"""Initial schema

Revision ID: 20260611_0001
Revises:
Create Date: 2026-06-11
"""

from alembic import op
import sqlalchemy as sa


revision = "20260611_0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # The MVP app uses SQLAlchemy metadata create_all on startup for local
    # bootstrap. This baseline revision anchors Alembic for production diffs.
    pass


def downgrade() -> None:
    pass
