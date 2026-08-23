"""add soft delete to complaints

Revision ID: 0003_complaint_soft_delete
Revises: 0002_intelligence_lifecycle
"""

from alembic import op
import sqlalchemy as sa

revision = "0003_complaint_soft_delete"
down_revision = "0002_intelligence_lifecycle"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("complaints", sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True))


def downgrade():
    op.drop_column("complaints", "deleted_at")
