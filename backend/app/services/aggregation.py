from datetime import datetime

from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from app.models import DashboardAggregate, MinimumBase, Plan, RawNpsRow
from app.page_config import SCOPES, DashboardScope, scope_filter
from app.services.metrics import calculate_nps


def _scope_query(db: Session, scope: DashboardScope, wave: str):
    query = select(RawNpsRow).where(RawNpsRow.wave == wave)
    for field, value in scope_filter(scope).items():
        query = query.where(getattr(RawNpsRow, field) == value)
    return query


def _plan_target(db: Session, scope: DashboardScope, wave: str) -> int:
    query = select(func.coalesce(func.sum(Plan.target), 0)).where(Plan.wave == wave)
    if scope.segment:
        query = query.where(Plan.segment == scope.segment)
    if scope.product:
        query = query.where(Plan.product == scope.product)
    if scope.company:
        query = query.where(Plan.company == scope.company)
    if scope.technology:
        query = query.where(Plan.technology == scope.technology)
    return int(db.scalar(query) or 0)


def _minimum_n(db: Session, scope_key: str) -> int:
    item = db.scalar(select(MinimumBase).where(MinimumBase.scope_key == scope_key))
    return item.minimum_n if item else 30


def recalculate_aggregates(db: Session, wave: str | None = None) -> None:
    waves = [wave] if wave else list(db.scalars(select(RawNpsRow.wave).distinct()))
    for current_wave in waves:
        db.execute(delete(DashboardAggregate).where(DashboardAggregate.wave == current_wave))
        for scope in SCOPES.values():
            rows = list(db.scalars(_scope_query(db, scope, current_wave)))
            scores = [row.score for row in rows]
            metrics = calculate_nps(scores)
            minimum_n = _minimum_n(db, scope.key)
            plan_target = _plan_target(db, scope, current_wave)
            plan_fact = metrics.n
            db.add(
                DashboardAggregate(
                    wave=current_wave,
                    scope_type="configured",
                    scope_key=scope.key,
                    label=scope.label,
                    nps=metrics.nps,
                    n=metrics.n,
                    promoters=metrics.promoters,
                    neutrals=metrics.neutrals,
                    detractors=metrics.detractors,
                    promoter_share=metrics.promoter_share,
                    neutral_share=metrics.neutral_share,
                    detractor_share=metrics.detractor_share,
                    plan_target=plan_target,
                    plan_fact=plan_fact,
                    plan_completion=round(plan_fact / plan_target * 100, 2) if plan_target else 0,
                    minimum_n=minimum_n,
                    is_small_base=metrics.n < minimum_n,
                    updated_at=datetime.utcnow(),
                )
            )
    db.commit()
