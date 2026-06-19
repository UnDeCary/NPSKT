from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import DashboardResponse, FieldControlResponse, RegionsDashboardResponse
from app.services.dashboard import get_dashboard_page, get_field_control, get_page_by_key, get_regions_dashboard


router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/home", response_model=DashboardResponse)
def home(wave: str = "I полугодие 2026", periodicity: str = "year", db: Session = Depends(get_db)) -> DashboardResponse:
    return get_dashboard_page(db, get_page_by_key("home"), wave, periodicity)


@router.get("/segment/{segment_key}", response_model=DashboardResponse)
def segment(segment_key: str, wave: str = "I полугодие 2026", periodicity: str = "year", db: Session = Depends(get_db)) -> DashboardResponse:
    page_key = segment_key.lower()
    if page_key not in {"b2c", "b2b"}:
        raise HTTPException(status_code=404, detail="Segment not found")
    return get_dashboard_page(db, get_page_by_key(page_key), wave, periodicity)


@router.get("/product/{product_key}", response_model=DashboardResponse)
def product(product_key: str, wave: str = "I полугодие 2026", periodicity: str = "year", db: Session = Depends(get_db)) -> DashboardResponse:
    try:
        return get_dashboard_page(db, get_page_by_key(product_key), wave, periodicity)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="Product page not found") from exc


@router.get("/field-control", response_model=FieldControlResponse)
def field_control(wave: str = "I полугодие 2026", db: Session = Depends(get_db)) -> FieldControlResponse:
    return get_field_control(db, wave)


@router.get("/regions", response_model=RegionsDashboardResponse)
def regions(
    wave: str = "I РїРѕР»СѓРіРѕРґРёРµ 2026",
    segment: str | None = None,
    product: str | None = None,
    settlement_type: str | None = None,
    db: Session = Depends(get_db),
) -> RegionsDashboardResponse:
    return RegionsDashboardResponse(
        **get_regions_dashboard(
            db,
            wave=wave,
            segment=segment,
            product=product,
            settlement_type=settlement_type,
        )
    )
