import json

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import require_admin
from app.models import DictionaryItem, RawCallRow, RawNpsRow, UploadBatch, User
from app.schemas import UploadHistoryRead
from app.services.aggregation import recalculate_aggregates
from app.services.seed import DEFAULT_DICTIONARIES
from app.services.upload_validation import DictionarySnapshot, validate_call_rows, validate_nps_rows
from app.services.xlsx import parse_xlsx


router = APIRouter(prefix="/api/uploads", tags=["uploads"], dependencies=[Depends(require_admin)])


def _snapshot(db: Session) -> DictionarySnapshot:
    items = list(db.scalars(select(DictionaryItem).where(DictionaryItem.is_active.is_(True))))
    grouped: dict[str, set[str]] = {key: set(values) for key, values in DEFAULT_DICTIONARIES.items()}
    for item in items:
        grouped.setdefault(item.type, set()).add(item.value)
    return DictionarySnapshot(
        segments=grouped.get("segments", set()),
        products=grouped.get("products", set()),
        companies=grouped.get("companies", set()),
        technologies=grouped.get("technologies", set()),
        macroregions=grouped.get("macroregions", set()),
        settlement_types=grouped.get("settlement_types", set()),
    )


def _validation_payload(result) -> dict:
    return {
        "total_rows": result.total_rows,
        "new_rows": result.new_rows,
        "duplicate_rows": len(result.duplicate_ids),
        "duplicate_ids": result.duplicate_ids,
        "error_rows": len({error.row for error in result.errors}),
        "errors": [error.__dict__ for error in result.errors],
        "is_valid": result.is_valid,
    }


@router.post("/nps/validate")
async def validate_nps(file: UploadFile = File(...), db: Session = Depends(get_db)) -> dict:
    rows = parse_xlsx(await file.read())
    existing_ids = set(db.scalars(select(RawNpsRow.survey_id)))
    result = validate_nps_rows(rows, _snapshot(db), existing_ids)
    return _validation_payload(result)


@router.post("/nps/commit")
async def commit_nps(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(require_admin),
) -> dict:
    rows = parse_xlsx(await file.read())
    existing_ids = set(db.scalars(select(RawNpsRow.survey_id)))
    result = validate_nps_rows(rows, _snapshot(db), existing_ids)
    if not result.is_valid:
        raise HTTPException(status_code=422, detail=_validation_payload(result))
    batch = UploadBatch(
        upload_type="nps",
        filename=file.filename or "nps.xlsx",
        status="committed",
        total_rows=result.total_rows,
        new_rows=result.new_rows,
        duplicate_rows=len(result.duplicate_ids),
        error_rows=0,
        created_by=user.login,
        error_log="[]",
    )
    db.add(batch)
    db.flush()
    duplicate_ids = set(result.duplicate_ids)
    for row in rows:
        survey_id = str(row.get("ID анкеты", "")).strip()
        if survey_id in duplicate_ids or survey_id in existing_ids:
            continue
        db.add(
            RawNpsRow(
                survey_id=survey_id,
                interview_date=str(row.get("Дата интервью", "")),
                wave=str(row.get("Период / волна", "")),
                segment=str(row.get("Сегмент", "")),
                base=str(row.get("База", "")),
                company=str(row.get("Компания", "")),
                product=str(row.get("Продукт", "")),
                technology=str(row.get("Технология") or "") or None,
                macroregion=str(row.get("Макрорегион", "")),
                region=str(row.get("Регион / область") or "") or None,
                settlement=str(row.get("Населенный пункт") or "") or None,
                settlement_type=str(row.get("Тип населенного пункта") or "") or None,
                score=int(row.get("Оценка NPS")),
                upload_batch_id=batch.id,
            )
        )
    db.commit()
    recalculate_aggregates(db)
    return _validation_payload(result)


@router.post("/calls/validate")
async def validate_calls(file: UploadFile = File(...), db: Session = Depends(get_db)) -> dict:
    rows = parse_xlsx(await file.read())
    existing_ids = set(db.scalars(select(RawCallRow.call_id)))
    result = validate_call_rows(rows, _snapshot(db), existing_ids)
    return _validation_payload(result)


@router.post("/calls/commit")
async def commit_calls(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(require_admin),
) -> dict:
    rows = parse_xlsx(await file.read())
    existing_ids = set(db.scalars(select(RawCallRow.call_id)))
    result = validate_call_rows(rows, _snapshot(db), existing_ids)
    if not result.is_valid:
        raise HTTPException(status_code=422, detail=_validation_payload(result))
    batch = UploadBatch(
        upload_type="calls",
        filename=file.filename or "calls.xlsx",
        status="committed",
        total_rows=result.total_rows,
        new_rows=result.new_rows,
        duplicate_rows=len(result.duplicate_ids),
        error_rows=0,
        created_by=user.login,
        error_log=json.dumps([]),
    )
    db.add(batch)
    db.flush()
    duplicate_ids = set(result.duplicate_ids)
    for row in rows:
        call_id = str(row.get("ID звонка", "")).strip()
        if call_id in duplicate_ids or call_id in existing_ids:
            continue
        db.add(
            RawCallRow(
                call_id=call_id,
                load_week=str(row.get("Дата / неделя загрузки", "")),
                wave=str(row.get("Период / волна", "")),
                segment=str(row.get("Сегмент", "")),
                base=str(row.get("База", "")),
                company=str(row.get("Компания") or "") or None,
                product=str(row.get("Продукт", "")),
                technology=str(row.get("Технология") or "") or None,
                total_calls=int(row.get("Всего звонков") or 0),
                no_answer=int(row.get("Недозвоны") or 0),
                answered=int(row.get("Дозвоны") or 0),
                refusal=int(row.get("Отказ / сброс") or 0),
                screener=int(row.get("Скринер") or 0),
                completed=int(row.get("Полная анкета") or 0),
                plan_target=int(row.get("План анкет") or 0),
                collected=int(row.get("Собрано анкет") or 0),
                upload_batch_id=batch.id,
            )
        )
    db.commit()
    return _validation_payload(result)


@router.get("/history", response_model=list[UploadHistoryRead])
def history(db: Session = Depends(get_db)) -> list[UploadBatch]:
    return list(db.scalars(select(UploadBatch).order_by(UploadBatch.created_at.desc())))
