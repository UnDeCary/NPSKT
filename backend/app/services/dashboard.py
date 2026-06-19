from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from app.models import DashboardAggregate, HistoricalAggregate, RawCallRow, RawNpsRow, UploadBatch, Wave
from app.page_config import DashboardPage, PAGES
from app.schemas import DashboardResponse, FieldControlResponse, KpiRead, TrendPoint, WaveRead
from app.services.metrics import calculate_nps

YEAR_PERIODS = ["2023 год", "2024 год", "2025 год"]
HALF_YEAR_PERIODS = [
    "I полугодие 2023",
    "II полугодие 2023",
    "I полугодие 2024",
    "II полугодие 2024",
    "I полугодие 2025",
    "II полугодие 2025",
    "I полугодие 2026",
]


def _empty_kpi(key: str, label: str) -> KpiRead:
    return KpiRead(
        key=key,
        label=label,
        nps=0,
        n=0,
        promoter_share=0,
        neutral_share=0,
        detractor_share=0,
        plan_target=0,
        plan_fact=0,
        plan_completion=0,
        is_small_base=True,
    )


def _kpi(db: Session, wave: str, key: str, label: str) -> KpiRead:
    aggregate = db.scalar(
        select(DashboardAggregate).where(DashboardAggregate.wave == wave, DashboardAggregate.scope_key == key)
    )
    if not aggregate:
        return _empty_kpi(key, label)
    return KpiRead(
        key=key,
        label=aggregate.label,
        nps=aggregate.nps,
        n=aggregate.n,
        promoter_share=aggregate.promoter_share,
        neutral_share=aggregate.neutral_share,
        detractor_share=aggregate.detractor_share,
        plan_target=aggregate.plan_target,
        plan_fact=aggregate.plan_fact,
        plan_completion=aggregate.plan_completion,
        is_small_base=aggregate.is_small_base,
    )


def list_waves(db: Session) -> list[WaveRead]:
    return [WaveRead(code=wave.code, label=wave.label) for wave in db.scalars(select(Wave).order_by(Wave.sort_order))]


def last_update(db: Session) -> str | None:
    batch = db.scalar(select(UploadBatch).where(UploadBatch.status == "committed").order_by(desc(UploadBatch.created_at)))
    return batch.created_at.isoformat() if batch else None


def _periods(periodicity: str, wave: str) -> list[str]:
    periods = YEAR_PERIODS if periodicity == "year" else HALF_YEAR_PERIODS
    if periodicity != "year" and "полугодие" in wave and wave not in periods:
        return [*periods, wave]
    return periods


def _historical(db: Session, period: str, key: str) -> HistoricalAggregate | None:
    return db.scalar(select(HistoricalAggregate).where(HistoricalAggregate.period == period, HistoricalAggregate.scope_key == key))


def _aggregate(db: Session, wave: str, key: str) -> DashboardAggregate | None:
    return db.scalar(select(DashboardAggregate).where(DashboardAggregate.wave == wave, DashboardAggregate.scope_key == key))


def _nps_for_period(db: Session, period: str, key: str) -> int:
    aggregate = _aggregate(db, period, key)
    historical = _historical(db, period, key)
    return aggregate.nps if aggregate else (historical.nps if historical else 0)


def _shares_for_period(db: Session, period: str, key: str) -> dict[str, float]:
    aggregate = _aggregate(db, period, key)
    historical = _historical(db, period, key)
    source = aggregate or historical
    if not source:
        return {"promoters": 0, "neutrals": 0, "detractors": 0}
    return _normalize_shares(source.promoter_share, source.neutral_share, source.detractor_share)


def _normalize_shares(promoters: float, neutrals: float, detractors: float) -> dict[str, float]:
    values = {
        "promoters": round(float(promoters), 2),
        "neutrals": round(float(neutrals), 2),
        "detractors": round(float(detractors), 2),
    }
    total = round(sum(values.values()), 2)
    if total and total != 100:
        largest_key = max(values, key=values.get)
        values[largest_key] = round(values[largest_key] + (100 - total), 2)
    return values


def get_dashboard_page(db: Session, page: DashboardPage, wave: str, periodicity: str = "year") -> DashboardResponse:
    keys = [page.primary.key] + [scope.key for scope in page.comparisons]
    trend_periods = _periods(periodicity, wave)
    trend = []
    for period in trend_periods:
        values: dict[str, int] = {}
        for key in keys:
            values[key] = _nps_for_period(db, period, key)
        trend.append(TrendPoint(period=period, values=values))
    all_kpis = [_kpi(db, wave, page.primary.key, page.primary.label)] + [
        _kpi(db, wave, scope.key, scope.label) for scope in page.comparisons
    ]
    return DashboardResponse(
        title=page.title,
        breadcrumbs=page.breadcrumbs,
        wave=wave,
        primary=all_kpis[0],
        comparisons=all_kpis[1:],
        trend=trend,
        structure=[
            {
                "key": kpi.key,
                "label": kpi.label,
                "rows": [
                    {"period": period, **_shares_for_period(db, period, kpi.key)}
                    for period in trend_periods
                ],
            }
            for kpi in all_kpis
        ],
    )


def get_page_by_key(key: str) -> DashboardPage:
    if key not in PAGES:
        raise KeyError(key)
    return PAGES[key]


def get_field_control(db: Session, wave: str) -> FieldControlResponse:
    rows = []
    raw_rows = db.scalars(select(RawCallRow).where(RawCallRow.wave == wave)).all()
    grouped: dict[tuple[str, str, str, str], dict] = {}
    for item in raw_rows:
        key = (item.segment, item.base, item.company or "", item.product)
        bucket = grouped.setdefault(
            key,
            {
                "segment": item.segment,
                "product": item.product,
                "base": item.base,
                "company": item.company or "",
                "total_calls": 0,
                "no_answer": 0,
                "answered": 0,
                "refusal": 0,
                "screener": 0,
                "completed": 0,
                "plan_target": 0,
                "collected": 0,
            },
        )
        for field in ["total_calls", "no_answer", "answered", "refusal", "screener", "completed", "plan_target", "collected"]:
            bucket[field] += getattr(item, field)
    for row in grouped.values():
        row["completion"] = round(row["collected"] / row["plan_target"] * 100, 2) if row["plan_target"] else 0
        rows.append(row)
    return FieldControlResponse(title="\u041a\u043e\u043d\u0442\u0440\u043e\u043b\u044c \u043f\u043e\u043b\u044f", wave=wave, rows=rows)
    return FieldControlResponse(title="РљРѕРЅС‚СЂРѕР»СЊ РїРѕР»СЏ", wave=wave, rows=rows)


def _region_rows_query(
    db: Session,
    *,
    wave: str | None = None,
    segment: str | None = None,
    product: str | None = None,
    settlement_type: str | None = None,
):
    query = select(RawNpsRow)
    if wave:
        query = query.where(RawNpsRow.wave == wave)
    if segment:
        query = query.where(RawNpsRow.segment == segment)
    if product:
        query = query.where(RawNpsRow.product == product)
    if settlement_type:
        query = query.where(RawNpsRow.settlement_type == settlement_type)
    return query


def _region_metrics(rows: list[RawNpsRow]) -> dict:
    metrics = calculate_nps([row.score for row in rows])
    return {
        "n": metrics.n,
        "nps": metrics.nps,
        "promoters": metrics.promoters,
        "neutrals": metrics.neutrals,
        "detractors": metrics.detractors,
        "promoter_share": metrics.promoter_share,
        "neutral_share": metrics.neutral_share,
        "detractor_share": metrics.detractor_share,
    }


def _ordered_region_periods(db: Session, available: set[str]) -> list[str]:
    configured = [wave.code for wave in db.scalars(select(Wave).order_by(Wave.sort_order))]
    ordered = [period for period in configured if period in available]
    ordered.extend(sorted(available - set(ordered)))
    return ordered


def get_regions_dashboard(
    db: Session,
    wave: str,
    segment: str | None = None,
    product: str | None = None,
    settlement_type: str | None = None,
) -> dict:
    current_rows = list(
        db.scalars(
            _region_rows_query(
                db,
                wave=wave,
                segment=segment,
                product=product,
                settlement_type=settlement_type,
            )
        )
    )
    grouped: dict[str, list[RawNpsRow]] = {}
    for row in current_rows:
        if row.region:
            grouped.setdefault(row.region, []).append(row)

    regions = []
    for region, rows in sorted(grouped.items()):
        regions.append(
            {
                "region": region,
                "macroregion": rows[0].macroregion,
                **_region_metrics(rows),
            }
        )

    all_filtered_rows = list(
        db.scalars(
            _region_rows_query(
                db,
                segment=segment,
                product=product,
                settlement_type=settlement_type,
            )
        )
    )
    periods = _ordered_region_periods(db, {row.wave for row in all_filtered_rows})
    trend = []
    for period in periods:
        period_grouped: dict[str, list[RawNpsRow]] = {}
        for row in all_filtered_rows:
            if row.wave == period and row.region:
                period_grouped.setdefault(row.region, []).append(row)
        trend.append(
            {
                "period": period,
                "values": {
                    region: _region_metrics(rows)["nps"]
                    for region, rows in sorted(period_grouped.items())
                },
            }
        )

    return {
        "title": "NPS Dashboard / Регионы",
        "wave": wave,
        "segment": segment,
        "product": product,
        "settlement_type": settlement_type,
        "sample_total": sum(region["n"] for region in regions),
        "regions": regions,
        "structure": [
            {
                "region": item["region"],
                "promoters": item["promoter_share"],
                "neutrals": item["neutral_share"],
                "detractors": item["detractor_share"],
            }
            for item in regions
        ],
        "trend": trend,
    }
    return FieldControlResponse(title="Контроль поля", wave=wave, rows=rows)
