from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import DictionaryItem, MinimumBase, Plan, User, Wave
from app.security import hash_password


DEFAULT_DICTIONARIES = {
    "segments": ["B2C", "B2B"],
    "base": ["Казахтелеком", "конкуренты"],
    "products": ["Интернет", "Телевидение", "FMS", "Корпоративный интернет", "ИКТ / Хостинг", "Облачное видеонаблюдение"],
    "technologies": ["ADSL", "GPON"],
    "companies": ["Казахтелеком", "Beeline", "Alma TV", "Jusan", "Транстелеком"],
    "macroregions": ["Центр", "Север", "Юг", "Запад", "Восток", "Алматы", "Астана"],
    "settlement_types": ["Город", "Село"],
    "call_statuses": ["Недозвон", "Дозвон", "Отказ / сброс", "Скринер", "Полная анкета"],
}

DEFAULT_WAVES = ["2023 год", "2024 год", "2025 год", "I полугодие 2026", "II полугодие 2026"]


def seed_defaults(db: Session) -> None:
    if not db.scalar(select(User).where(User.login == "admin")):
        db.add(
            User(
                login="admin",
                email="admin@nps.local",
                full_name="Dashboard administrator",
                password_hash=hash_password("admin123"),
                role="admin",
            )
        )
    for dtype, values in DEFAULT_DICTIONARIES.items():
        for value in values:
            exists = db.scalar(select(DictionaryItem).where(DictionaryItem.type == dtype, DictionaryItem.value == value))
            if not exists:
                db.add(DictionaryItem(type=dtype, value=value))
    for index, wave in enumerate(DEFAULT_WAVES):
        if not db.scalar(select(Wave).where(Wave.code == wave)):
            db.add(Wave(code=wave, label=wave, sort_order=index))
    for scope in ["total", "b2c", "b2b", "b2c-internet", "b2c-tv", "b2c-fms"]:
        if not db.scalar(select(MinimumBase).where(MinimumBase.scope_key == scope)):
            db.add(MinimumBase(scope_key=scope, minimum_n=30))
    plan_specs = [
        ("B2C", "Интернет", None, None, "I полугодие 2026", 1000),
        ("B2C", "Телевидение", None, None, "I полугодие 2026", 600),
        ("B2C", "FMS", None, None, "I полугодие 2026", 500),
        ("B2B", "Корпоративный интернет", None, None, "I полугодие 2026", 400),
        ("B2B", "ИКТ / Хостинг", None, None, "I полугодие 2026", 300),
        ("B2B", "Облачное видеонаблюдение", None, None, "I полугодие 2026", 250),
    ]
    for segment, product, company, technology, wave, target in plan_specs:
        exists = db.scalar(
            select(Plan).where(
                Plan.segment == segment,
                Plan.product == product,
                Plan.company.is_(None),
                Plan.technology.is_(None),
                Plan.wave == wave,
            )
        )
        if not exists:
            db.add(Plan(segment=segment, product=product, company=company, technology=technology, wave=wave, target=target))
    db.commit()
