"""initial complaint platform schema

Revision ID: 20260822_0001
Revises:
Create Date: 2026-08-22
"""

import sqlalchemy as sa

from alembic import op

revision = "20260822_0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table("departments", sa.Column("id", sa.String(length=64), nullable=False), sa.Column("name", sa.String(length=120), nullable=False), sa.Column("active", sa.Boolean(), nullable=False), sa.PrimaryKeyConstraint("id"), sa.UniqueConstraint("name"))
    op.create_table("complaints",
        sa.Column("id", sa.String(length=32), nullable=False), sa.Column("student_id", sa.String(length=64), nullable=False),
        sa.Column("original_text", sa.Text(), nullable=False), sa.Column("normalized_text", sa.Text(), nullable=False), sa.Column("source", sa.String(length=20), nullable=False),
        sa.Column("category", sa.String(length=64), nullable=False), sa.Column("subcategory", sa.String(length=64), nullable=False), sa.Column("classification_confidence", sa.Float(), nullable=False),
        sa.Column("priority_score", sa.Integer(), nullable=False), sa.Column("priority_level", sa.String(length=20), nullable=False), sa.Column("priority_reasons", sa.JSON(), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False), sa.Column("department_id", sa.String(length=64), nullable=True), sa.Column("assigned_to", sa.String(length=100), nullable=True),
        sa.Column("cluster_id", sa.String(length=32), nullable=True), sa.Column("related_count", sa.Integer(), nullable=False), sa.Column("sla_due_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("escalation_level", sa.Integer(), nullable=False), sa.Column("resolution", sa.Text(), nullable=True), sa.Column("resolved_at", sa.DateTime(timezone=True), nullable=True), sa.Column("closed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False), sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["department_id"], ["departments.id"]), sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_complaints_student_id", "complaints", ["student_id"])
    op.create_index("ix_complaints_category", "complaints", ["category"])
    op.create_index("ix_complaints_status", "complaints", ["status"])
    op.create_index("ix_complaints_department_id", "complaints", ["department_id"])
    op.create_index("ix_complaints_cluster_id", "complaints", ["cluster_id"])
    op.create_index("ix_complaints_sla_due_at", "complaints", ["sla_due_at"])
    op.create_table("complaint_audit_events", sa.Column("id", sa.Integer(), nullable=False), sa.Column("complaint_id", sa.String(length=32), nullable=False), sa.Column("event_type", sa.String(length=100), nullable=False), sa.Column("actor", sa.String(length=100), nullable=False), sa.Column("correlation_id", sa.String(length=64), nullable=False), sa.Column("payload", sa.JSON(), nullable=False), sa.Column("created_at", sa.DateTime(timezone=True), nullable=False), sa.ForeignKeyConstraint(["complaint_id"], ["complaints.id"], ondelete="CASCADE"), sa.PrimaryKeyConstraint("id"))
    op.create_index("ix_complaint_audit_events_complaint_id", "complaint_audit_events", ["complaint_id"])
    op.create_index("ix_complaint_audit_events_correlation_id", "complaint_audit_events", ["correlation_id"])
    op.create_table("idempotency_records", sa.Column("key", sa.String(length=255), nullable=False), sa.Column("complaint_id", sa.String(length=32), nullable=False), sa.Column("created_at", sa.DateTime(timezone=True), nullable=False), sa.ForeignKeyConstraint(["complaint_id"], ["complaints.id"], ondelete="CASCADE"), sa.PrimaryKeyConstraint("key"))


def downgrade() -> None:
    op.drop_table("idempotency_records")
    op.drop_table("complaint_audit_events")
    op.drop_table("complaints")
    op.drop_table("departments")
