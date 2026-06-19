from datetime import datetime
from enum import Enum

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class UserRole(str, Enum):
    admin = "admin"
    viewer = "viewer"


class UploadType(str, Enum):
    nps = "nps"
    calls = "calls"
    historical = "historical"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    login: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    full_name: Mapped[str] = mapped_column(String(255), default="")
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(30), default=UserRole.viewer.value)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class DictionaryItem(Base):
    __tablename__ = "dictionary_items"
    __table_args__ = (UniqueConstraint("type", "value", name="uq_dictionary_type_value"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    type: Mapped[str] = mapped_column(String(60), index=True)
    value: Mapped[str] = mapped_column(String(255), index=True)
    parent: Mapped[str | None] = mapped_column(String(255), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)


class Wave(Base):
    __tablename__ = "waves"

    id: Mapped[int] = mapped_column(primary_key=True)
    code: Mapped[str] = mapped_column(String(80), unique=True)
    label: Mapped[str] = mapped_column(String(120))
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)


class Plan(Base):
    __tablename__ = "plans"

    id: Mapped[int] = mapped_column(primary_key=True)
    segment: Mapped[str] = mapped_column(String(40))
    product: Mapped[str] = mapped_column(String(120))
    company: Mapped[str | None] = mapped_column(String(120), nullable=True)
    technology: Mapped[str | None] = mapped_column(String(80), nullable=True)
    wave: Mapped[str] = mapped_column(String(80))
    target: Mapped[int] = mapped_column(Integer, default=0)


class MinimumBase(Base):
    __tablename__ = "minimum_bases"

    id: Mapped[int] = mapped_column(primary_key=True)
    scope_key: Mapped[str] = mapped_column(String(180), unique=True)
    minimum_n: Mapped[int] = mapped_column(Integer, default=30)


class UploadBatch(Base):
    __tablename__ = "upload_batches"

    id: Mapped[int] = mapped_column(primary_key=True)
    upload_type: Mapped[str] = mapped_column(String(40))
    filename: Mapped[str] = mapped_column(String(255))
    status: Mapped[str] = mapped_column(String(40), default="validated")
    total_rows: Mapped[int] = mapped_column(Integer, default=0)
    new_rows: Mapped[int] = mapped_column(Integer, default=0)
    duplicate_rows: Mapped[int] = mapped_column(Integer, default=0)
    error_rows: Mapped[int] = mapped_column(Integer, default=0)
    created_by: Mapped[str] = mapped_column(String(120), default="system")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    error_log: Mapped[str] = mapped_column(Text, default="[]")

    nps_rows: Mapped[list["RawNpsRow"]] = relationship(back_populates="upload_batch")
    call_rows: Mapped[list["RawCallRow"]] = relationship(back_populates="upload_batch")


class RawNpsRow(Base):
    __tablename__ = "raw_nps_rows"

    id: Mapped[int] = mapped_column(primary_key=True)
    survey_id: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    interview_date: Mapped[str] = mapped_column(String(40))
    wave: Mapped[str] = mapped_column(String(80), index=True)
    segment: Mapped[str] = mapped_column(String(40), index=True)
    base: Mapped[str] = mapped_column(String(120))
    company: Mapped[str] = mapped_column(String(120), index=True)
    product: Mapped[str] = mapped_column(String(120), index=True)
    technology: Mapped[str | None] = mapped_column(String(80), nullable=True)
    macroregion: Mapped[str] = mapped_column(String(120), index=True)
    region: Mapped[str | None] = mapped_column(String(120), nullable=True)
    settlement: Mapped[str | None] = mapped_column(String(120), nullable=True)
    settlement_type: Mapped[str | None] = mapped_column(String(40), nullable=True)
    score: Mapped[int] = mapped_column(Integer)
    upload_batch_id: Mapped[int | None] = mapped_column(ForeignKey("upload_batches.id"), nullable=True)
    upload_batch: Mapped[UploadBatch | None] = relationship(back_populates="nps_rows")


class RawCallRow(Base):
    __tablename__ = "raw_call_rows"

    id: Mapped[int] = mapped_column(primary_key=True)
    call_id: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    load_week: Mapped[str] = mapped_column(String(80))
    wave: Mapped[str] = mapped_column(String(80), index=True)
    segment: Mapped[str] = mapped_column(String(40), index=True)
    base: Mapped[str] = mapped_column(String(120))
    company: Mapped[str | None] = mapped_column(String(120), nullable=True)
    product: Mapped[str] = mapped_column(String(120), index=True)
    technology: Mapped[str | None] = mapped_column(String(80), nullable=True)
    total_calls: Mapped[int] = mapped_column(Integer, default=0)
    no_answer: Mapped[int] = mapped_column(Integer, default=0)
    answered: Mapped[int] = mapped_column(Integer, default=0)
    refusal: Mapped[int] = mapped_column(Integer, default=0)
    screener: Mapped[int] = mapped_column(Integer, default=0)
    completed: Mapped[int] = mapped_column(Integer, default=0)
    plan_target: Mapped[int] = mapped_column(Integer, default=0)
    collected: Mapped[int] = mapped_column(Integer, default=0)
    upload_batch_id: Mapped[int | None] = mapped_column(ForeignKey("upload_batches.id"), nullable=True)
    upload_batch: Mapped[UploadBatch | None] = relationship(back_populates="call_rows")


class DashboardAggregate(Base):
    __tablename__ = "dashboard_aggregates"
    __table_args__ = (UniqueConstraint("wave", "scope_type", "scope_key", name="uq_aggregate_scope"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    wave: Mapped[str] = mapped_column(String(80), index=True)
    scope_type: Mapped[str] = mapped_column(String(80), index=True)
    scope_key: Mapped[str] = mapped_column(String(180), index=True)
    label: Mapped[str] = mapped_column(String(180))
    nps: Mapped[int] = mapped_column(Integer, default=0)
    n: Mapped[int] = mapped_column(Integer, default=0)
    promoters: Mapped[int] = mapped_column(Integer, default=0)
    neutrals: Mapped[int] = mapped_column(Integer, default=0)
    detractors: Mapped[int] = mapped_column(Integer, default=0)
    promoter_share: Mapped[float] = mapped_column(Float, default=0)
    neutral_share: Mapped[float] = mapped_column(Float, default=0)
    detractor_share: Mapped[float] = mapped_column(Float, default=0)
    plan_target: Mapped[int] = mapped_column(Integer, default=0)
    plan_fact: Mapped[int] = mapped_column(Integer, default=0)
    plan_completion: Mapped[float] = mapped_column(Float, default=0)
    minimum_n: Mapped[int] = mapped_column(Integer, default=30)
    is_small_base: Mapped[bool] = mapped_column(Boolean, default=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class HistoricalAggregate(Base):
    __tablename__ = "historical_aggregates"

    id: Mapped[int] = mapped_column(primary_key=True)
    period: Mapped[str] = mapped_column(String(80), index=True)
    scope_type: Mapped[str] = mapped_column(String(80), index=True)
    scope_key: Mapped[str] = mapped_column(String(180), index=True)
    label: Mapped[str] = mapped_column(String(180))
    nps: Mapped[int] = mapped_column(Integer, default=0)
    n: Mapped[int] = mapped_column(Integer, default=0)
    promoter_share: Mapped[float] = mapped_column(Float, default=0)
    neutral_share: Mapped[float] = mapped_column(Float, default=0)
    detractor_share: Mapped[float] = mapped_column(Float, default=0)
