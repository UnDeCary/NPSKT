from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.database import Base
from app.models import RawNpsRow, Wave
from app.services.dashboard import get_regions_dashboard


def make_session() -> Session:
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(engine)
    return Session(engine)


def add_row(
    db: Session,
    survey_id: str,
    score: int,
    *,
    wave: str = "I полугодие 2026",
    segment: str = "B2C",
    product: str = "Интернет",
    macroregion: str = "Север",
    region: str = "Акмолинская область",
    settlement_type: str = "Город",
) -> None:
    db.add(
        RawNpsRow(
            survey_id=survey_id,
            interview_date="2026-01-01",
            wave=wave,
            segment=segment,
            base="Казахтелеком",
            company="Казахтелеком",
            product=product,
            technology=None,
            macroregion=macroregion,
            region=region,
            settlement="Кокшетау",
            settlement_type=settlement_type,
            score=score,
        )
    )


def test_regions_dashboard_aggregates_real_rows_by_region_and_filters_segment():
    db = make_session()
    db.add(Wave(code="I полугодие 2026", label="I полугодие 2026", sort_order=1))
    add_row(db, "A-1", 10)
    add_row(db, "A-2", 8)
    add_row(db, "A-3", 4)
    add_row(db, "B-1", 10, segment="B2B", product="ИКТ / Хостинг", macroregion="Центр", region="Карагандинская область")
    db.commit()

    total = get_regions_dashboard(db, wave="I полугодие 2026")
    b2c = get_regions_dashboard(db, wave="I полугодие 2026", segment="B2C")

    assert [region["region"] for region in total["regions"]] == ["Акмолинская область", "Карагандинская область"]
    assert total["sample_total"] == 4
    assert total["regions"][0]["nps"] == 0
    assert total["regions"][0]["promoter_share"] == 33.33
    assert total["regions"][0]["neutral_share"] == 33.33
    assert total["regions"][0]["detractor_share"] == 33.33
    assert [region["region"] for region in b2c["regions"]] == ["Акмолинская область"]
    assert b2c["sample_total"] == 3


def test_regions_dashboard_returns_only_periods_with_real_database_rows():
    db = make_session()
    db.add(Wave(code="2025 год", label="2025 год", sort_order=1))
    db.add(Wave(code="I полугодие 2026", label="I полугодие 2026", sort_order=2))
    add_row(db, "A-1", 10, wave="2025 год")
    add_row(db, "A-2", 0, wave="I полугодие 2026")
    db.commit()

    payload = get_regions_dashboard(db, wave="I полугодие 2026")

    assert [point["period"] for point in payload["trend"]] == ["2025 год", "I полугодие 2026"]
    assert payload["trend"][0]["values"] == {"Акмолинская область": 100}
    assert payload["trend"][1]["values"] == {"Акмолинская область": -100}
