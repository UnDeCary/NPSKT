from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.database import Base
from app.models import DashboardAggregate, HistoricalAggregate
from app.page_config import PAGES
from app.services.dashboard import HALF_YEAR_PERIODS, YEAR_PERIODS, get_dashboard_page


def make_session() -> Session:
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(engine)
    return Session(engine)


def add_current_aggregate(db: Session, wave: str, key: str, label: str) -> None:
    db.add(
        DashboardAggregate(
            wave=wave,
            scope_type="configured",
            scope_key=key,
            label=label,
            nps=20,
            n=10,
            promoters=5,
            neutrals=2,
            detractors=3,
            promoter_share=50,
            neutral_share=20,
            detractor_share=30,
        )
    )


def add_historical_aggregate(db: Session, period: str, key: str, label: str, nps: int) -> None:
    db.add(
        HistoricalAggregate(
            period=period,
            scope_type="configured",
            scope_key=key,
            label=label,
            nps=nps,
            n=10,
            promoter_share=40,
            neutral_share=35,
            detractor_share=25,
        )
    )


def test_dashboard_periodicity_changes_trend_periods_and_structure_rows():
    db = make_session()
    page = PAGES["home"]
    current_wave = HALF_YEAR_PERIODS[-1]
    keys = [page.primary.key] + [scope.key for scope in page.comparisons]
    for key in keys:
        add_current_aggregate(db, current_wave, key, key)
        add_historical_aggregate(db, YEAR_PERIODS[-1], key, key, nps=11)
        add_historical_aggregate(db, HALF_YEAR_PERIODS[-2], key, key, nps=12)
    db.commit()

    yearly = get_dashboard_page(db, page, current_wave, periodicity="year")
    half_yearly = get_dashboard_page(db, page, current_wave, periodicity="half")

    assert [point.period for point in yearly.trend] == YEAR_PERIODS
    assert [point.period for point in half_yearly.trend] == HALF_YEAR_PERIODS
    assert yearly.structure[0]["rows"] == [
        {"period": YEAR_PERIODS[0], "promoters": 0, "neutrals": 0, "detractors": 0},
        {"period": YEAR_PERIODS[1], "promoters": 0, "neutrals": 0, "detractors": 0},
        {"period": YEAR_PERIODS[2], "promoters": 40, "neutrals": 35, "detractors": 25},
    ]
    assert half_yearly.structure[0]["rows"][-1] == {
        "period": current_wave,
        "promoters": 50,
        "neutrals": 20,
        "detractors": 30,
    }
