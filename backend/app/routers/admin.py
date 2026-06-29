from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import require_admin
from app.models import DictionaryItem, MinimumBase, Plan, User
from app.schemas import (
    DictionaryItemCreate,
    DictionaryItemRead,
    MinimumBaseCreate,
    MinimumBaseRead,
    PlanCreate,
    PlanRead,
    UserCreate,
    UserRead,
    UserUpdate,
)
from app.security import hash_password
from app.services.aggregation import recalculate_aggregates


router = APIRouter(prefix="/api/admin", tags=["admin"], dependencies=[Depends(require_admin)])


@router.get("/users", response_model=list[UserRead])
def list_users(db: Session = Depends(get_db)) -> list[User]:
    return list(db.scalars(select(User).order_by(User.login)))


@router.post("/users", response_model=UserRead)
def create_user(payload: UserCreate, db: Session = Depends(get_db)) -> User:
    if db.scalar(select(User).where((User.login == payload.login) | (User.email == payload.email))):
        raise HTTPException(status_code=409, detail="Пользователь с таким логином или email уже существует")
    user = User(
        login=payload.login,
        email=payload.email,
        full_name=payload.full_name,
        password_hash=hash_password(payload.password),
        role=payload.role,
        is_active=payload.is_active,
    )
    db.add(user)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="Пользователь с таким логином или email уже существует") from exc
    db.refresh(user)
    return user


@router.patch("/users/{user_id}", response_model=UserRead)
def update_user(
    user_id: int,
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> User:
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == current_user.id and payload.is_active is False:
        raise HTTPException(status_code=400, detail="Нельзя заблокировать собственную учётную запись")
    if user.id == current_user.id and payload.role == "viewer":
        raise HTTPException(status_code=400, detail="Нельзя снять права администратора у собственной учётной записи")
    for field in ["email", "full_name", "role", "is_active"]:
        value = getattr(payload, field)
        if value is not None:
            setattr(user, field, value)
    if payload.password:
        user.password_hash = hash_password(payload.password)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="Пользователь с таким email уже существует") from exc
    db.refresh(user)
    return user


@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> dict:
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Нельзя удалить собственную учётную запись")
    if user.role == "admin" and user.is_active:
        active_admins = db.scalar(select(func.count()).select_from(User).where(User.role == "admin", User.is_active.is_(True))) or 0
        if active_admins <= 1:
            raise HTTPException(status_code=400, detail="Нельзя удалить последнего активного администратора")
    db.delete(user)
    db.commit()
    return {"status": "deleted"}


@router.get("/dictionaries/{dictionary_type}", response_model=list[DictionaryItemRead])
def list_dictionary(dictionary_type: str, db: Session = Depends(get_db)) -> list[DictionaryItem]:
    return list(db.scalars(select(DictionaryItem).where(DictionaryItem.type == dictionary_type).order_by(DictionaryItem.value)))


@router.post("/dictionaries/{dictionary_type}", response_model=DictionaryItemRead)
def create_dictionary_item(dictionary_type: str, payload: DictionaryItemCreate, db: Session = Depends(get_db)) -> DictionaryItem:
    item = DictionaryItem(type=dictionary_type, value=payload.value, parent=payload.parent, is_active=payload.is_active)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.patch("/dictionaries/{dictionary_type}/{item_id}", response_model=DictionaryItemRead)
def update_dictionary_item(dictionary_type: str, item_id: int, payload: DictionaryItemCreate, db: Session = Depends(get_db)) -> DictionaryItem:
    item = db.get(DictionaryItem, item_id)
    if not item or item.type != dictionary_type:
        raise HTTPException(status_code=404, detail="Dictionary item not found")
    item.value = payload.value
    item.parent = payload.parent
    item.is_active = payload.is_active
    db.commit()
    db.refresh(item)
    return item


@router.get("/plans", response_model=list[PlanRead])
def list_plans(db: Session = Depends(get_db)) -> list[Plan]:
    return list(db.scalars(select(Plan).order_by(Plan.segment, Plan.product)))


@router.post("/plans", response_model=PlanRead)
def create_plan(payload: PlanCreate, db: Session = Depends(get_db)) -> Plan:
    plan = Plan(**payload.model_dump())
    db.add(plan)
    db.commit()
    db.refresh(plan)
    recalculate_aggregates(db, payload.wave)
    return plan


@router.patch("/plans/{plan_id}", response_model=PlanRead)
def update_plan(plan_id: int, payload: PlanCreate, db: Session = Depends(get_db)) -> Plan:
    plan = db.get(Plan, plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    previous_wave = plan.wave
    for key, value in payload.model_dump().items():
        setattr(plan, key, value)
    db.commit()
    db.refresh(plan)
    recalculate_aggregates(db, payload.wave)
    if previous_wave != payload.wave:
        recalculate_aggregates(db, previous_wave)
    return plan


@router.delete("/plans/{plan_id}")
def delete_plan(plan_id: int, db: Session = Depends(get_db)) -> dict:
    plan = db.get(Plan, plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    wave = plan.wave
    db.delete(plan)
    db.commit()
    recalculate_aggregates(db, wave)
    return {"status": "deleted"}


@router.get("/minimum-bases", response_model=list[MinimumBaseRead])
def list_minimum_bases(db: Session = Depends(get_db)) -> list[MinimumBase]:
    return list(db.scalars(select(MinimumBase).order_by(MinimumBase.scope_key)))


@router.post("/minimum-bases", response_model=MinimumBaseRead)
def create_minimum_base(payload: MinimumBaseCreate, db: Session = Depends(get_db)) -> MinimumBase:
    item = MinimumBase(**payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    recalculate_aggregates(db)
    return item


@router.patch("/minimum-bases/{item_id}", response_model=MinimumBaseRead)
def update_minimum_base(item_id: int, payload: MinimumBaseCreate, db: Session = Depends(get_db)) -> MinimumBase:
    item = db.get(MinimumBase, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Minimum base not found")
    item.scope_key = payload.scope_key
    item.minimum_n = payload.minimum_n
    db.commit()
    db.refresh(item)
    recalculate_aggregates(db)
    return item


@router.delete("/minimum-bases/{item_id}")
def delete_minimum_base(item_id: int, db: Session = Depends(get_db)) -> dict:
    item = db.get(MinimumBase, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Minimum base not found")
    db.delete(item)
    db.commit()
    recalculate_aggregates(db)
    return {"status": "deleted"}
