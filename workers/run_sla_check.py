"""Run from a scheduler: python workers/run_sla_check.py."""

from app.workers.queue import get_queue
from app.workers.sla import run_sla_check

if __name__ == "__main__":
    get_queue().enqueue(run_sla_check, job_timeout=120)
