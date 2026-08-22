"""add pgvector embedding storage

Revision ID: 20260822_0005
Revises: 20260822_0004
Create Date: 2026-08-22
"""

from alembic import op

revision = "20260822_0005"
down_revision = "20260822_0004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")
    op.execute("CREATE TABLE complaint_embeddings (complaint_id varchar(32) PRIMARY KEY REFERENCES complaints(id) ON DELETE CASCADE, embedding vector(384) NOT NULL, created_at timestamptz NOT NULL)")
    op.execute("CREATE INDEX ix_complaint_embeddings_vector ON complaint_embeddings USING hnsw (embedding vector_cosine_ops)")


def downgrade() -> None:
    op.execute("DROP TABLE complaint_embeddings")
