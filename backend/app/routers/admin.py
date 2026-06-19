from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
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


router = APIRouter(prefix="/api/admin", tags=["admin"], dependencies=[Depends(require_admin)])


@router.get("/users", response_model=list[UserRead])
def list_users(db: Session = Depends(get_db)) -> list[User]:
    return list(db.scalars(select(User).order_by(User.login)))


@router.post("/users", response_model=UserRead)
def create_user(payload: UserCreate, db: Session = Depends(get_db)) -> User:
    user = User(
        login=payload.login,
        email=payload.email,
        full_name=payload.full_name,
        password_hash=hash_password(payload.password),
        role=payload.role,
        is_active=payload.is_active,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.patch("/users/{user_id}", response_model=UserRead)
def update_user(user_id: int, payload: UserUpdate, db: Session = Depends(get_db)) -> User:
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    for field in ["email", "full_name", "role", "is_active"]:
        value = getattr(payload, field)
        if value is not None:
            setattr(user, field, value)
    if payload.password:
        user.password_hash = hash_password(payload.password)
    db.commit()
    db.refresh(user)
    return user


@router.delete("/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db)) -> dict:
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
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
    return plan


@router.patch("/plans/{plan_id}", response_model=PlanRead)
def update_plan(plan_id: int, payload: PlanCreate, db: Session = Depends(get_db)) -> Plan:
    plan = db.get(Plan, plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    for key, value in payload.model_dump().items():
        setattr(plan, key, value)
    db.commit()
    db.refresh(plan)
    return plan


@router.get("/minimum-bases", response_model=list[MinimumBaseRead])
def list_minimum_bases(db: Session = Depends(get_db)) -> list[MinimumBase]:
    return list(db.scalars(select(MinimumBase).order_by(MinimumBase.scope_key)))


@router.post("/minimum-bases", response_model=MinimumBaseRead)
def create_minimum_base(payload: MinimumBaseCreate, db: Session = Depends(get_db)) -> MinimumBase:
    item = MinimumBase(**payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
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
    return item
