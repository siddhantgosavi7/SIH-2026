"""update_vector_dimension_and_add_hnsw

Revision ID: 27887d46a18f
Revises: 80a0c18a220d
Create Date: 2026-09-04 18:14:39.165920

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '27887d46a18f'
down_revision: Union[str, None] = '80a0c18a220d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Get dialect name
    conn = op.get_bind()
    if conn.dialect.name == "postgresql":
        # Truncate table to remove old 1536-dim vectors before altering type
        op.execute("TRUNCATE TABLE complaint_embeddings")
        # Change column type to vector(384)
        op.execute("ALTER TABLE complaint_embeddings ALTER COLUMN embedding TYPE vector(384)")
        # Create HNSW index
        op.execute("CREATE INDEX IF NOT EXISTS ix_embeddings_hnsw ON complaint_embeddings USING hnsw (embedding vector_cosine_ops)")


def downgrade() -> None:
    conn = op.get_bind()
    if conn.dialect.name == "postgresql":
        # Drop HNSW index
        op.execute("DROP INDEX IF EXISTS ix_embeddings_hnsw")
        # Truncate table to remove 384-dim vectors before reverting
        op.execute("TRUNCATE TABLE complaint_embeddings")
        # Revert column type to vector(1536)
        op.execute("ALTER TABLE complaint_embeddings ALTER COLUMN embedding TYPE vector(1536)")
