from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.database import Base
from app.models import RawCallRow
from app.services.dashboard import get_field_control


def make_session() -> Session:
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(engine)
    return Session(engine)


def add_call_row(
    db: Session,
    call_id: str,
    *,
    wave: str = "I полугодие 2026",
    segment: str = "B2C",
    base: str = "Казахтелеком",
    company: str = "Казахтелеком",
    product: str = "Интернет",
    total_calls: int = 10,
    no_answer: int = 2,
    answered: int = 8,
    refusal: int = 1,
    screener: int = 2,
    completed: int = 5,
    plan_target: int = 10,
    collected: int = 5,
) -> None:
    db.add(
        RawCallRow(
            call_id=call_id,
            load_week="2026-W23",
            wave=wave,
            segment=segment,
            base=base,
            company=company,
            product=product,
            technology=None,
            total_calls=total_calls,
            no_answer=no_answer,
            answered=answered,
            refusal=refusal,
            screener=screener,
            completed=completed,
            plan_target=plan_target,
            collected=collected,
        )
    )


def test_field_control_groups_database_rows_by_base_and_product():
    db = make_session()
    add_call_row(db, "C-1", base="Казахтелеком", total_calls=10, collected=5, plan_target=10)
    add_call_row(db, "C-2", base="Конкуренты", total_calls=20, collected=12, plan_target=20)
    db.commit()

    payload = get_field_control(db, "I полугодие 2026")

    assert len(payload.rows) == 2
    assert {(row["base"], row["product"]) for row in payload.rows} == {
        ("Казахтелеком", "Интернет"),
        ("Конкуренты", "Интернет"),
    }
    assert [row["total_calls"] for row in payload.rows] == [10, 20]
