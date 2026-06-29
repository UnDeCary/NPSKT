from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class LoginRequest(BaseModel):
    login: str
    password: str


class ForgotPasswordRequest(BaseModel):
    email: str


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    login: str
    email: str
    full_name: str
    role: str
    is_active: bool


class UserCreate(BaseModel):
    login: str = Field(min_length=3, max_length=120)
    email: str = Field(min_length=3, max_length=255)
    full_name: str = ""
    password: str = Field(min_length=8, max_length=128)
    role: Literal["admin", "viewer"] = "viewer"
    is_active: bool = True


class UserUpdate(BaseModel):
    email: str | None = None
    full_name: str | None = None
    password: str | None = Field(default=None, min_length=8, max_length=128)
    role: Literal["admin", "viewer"] | None = None
    is_active: bool | None = None


class DictionaryItemRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    type: str
    value: str
    parent: str | None
    is_active: bool


class DictionaryItemCreate(BaseModel):
    value: str
    parent: str | None = None
    is_active: bool = True


class PlanRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    segment: str
    product: str
    company: str | None
    technology: str | None
    wave: str
    target: int


class PlanCreate(BaseModel):
    segment: str
    product: str
    company: str | None = None
    technology: str | None = None
    wave: str
    target: int = Field(ge=0)


class MinimumBaseRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    scope_key: str
    minimum_n: int


class MinimumBaseCreate(BaseModel):
    scope_key: str
    minimum_n: int = Field(ge=1)


class UploadHistoryRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    upload_type: str
    filename: str
    status: str
    total_rows: int
    new_rows: int
    duplicate_rows: int
    error_rows: int
    created_by: str
    created_at: datetime


class WaveRead(BaseModel):
    code: str
    label: str


class KpiRead(BaseModel):
    key: str
    label: str
    nps: int
    n: int
    promoter_share: float
    neutral_share: float
    detractor_share: float
    plan_target: int
    plan_fact: int
    plan_completion: float
    is_small_base: bool


class TrendPoint(BaseModel):
    period: str
    values: dict[str, int]


class DashboardResponse(BaseModel):
    title: str
    breadcrumbs: list[str]
    wave: str
    primary: KpiRead
    comparisons: list[KpiRead]
    trend: list[TrendPoint]
    structure: list[dict]


class FieldControlResponse(BaseModel):
    title: str
    wave: str
    rows: list[dict]


class RegionsDashboardResponse(BaseModel):
    title: str
    wave: str
    segment: str | None
    product: str | None
    settlement_type: str | None
    sample_total: int
    regions: list[dict]
    structure: list[dict]
    trend: list[dict]
