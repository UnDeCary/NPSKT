from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.dashboard import last_update, list_waves


router = APIRouter(prefix="/api/meta", tags=["meta"])


@router.get("/waves")
def waves(db: Session = Depends(get_db)) -> list[dict]:
    return [wave.model_dump() for wave in list_waves(db)]


@router.get("/last-update")
def get_last_update(db: Session = Depends(get_db)) -> dict:
    return {"last_update": last_update(db)}
