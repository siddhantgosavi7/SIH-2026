"""add_classification_source

Revision ID: 80a0c18a220d
Revises: 0010_user_profile_completed
Create Date: 2026-09-04 17:57:11.059506

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '80a0c18a220d'
down_revision: Union[str, None] = '0010_user_profile_completed'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("complaints", sa.Column("classification_source", sa.String(32), server_default="RULE", nullable=False))


def downgrade() -> None:
    op.drop_column("complaints", "classification_source")
