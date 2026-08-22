import logging
from time import perf_counter
from uuid import uuid4

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.core.config import get_settings

settings = get_settings()

app = FastAPI(
    title="Complaint Intelligence Platform",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")

logger = logging.getLogger("complaint_api")


@app.middleware("http")
async def request_observability(request: Request, call_next):
    correlation_id = request.headers.get("X-Correlation-Id", uuid4().hex)
    started = perf_counter()
    response = await call_next(request)
    response.headers["X-Correlation-Id"] = correlation_id
    logger.info("request method=%s path=%s status=%s duration_ms=%d correlation_id=%s", request.method, request.url.path, response.status_code, (perf_counter() - started) * 1000, correlation_id)
    return response


@app.get("/health")
async def health() -> dict[str, str]:
    return {
        "status": "ok",
        "service": "complaint-api",
    }


@app.get("/ready")
async def readiness() -> dict[str, str]:
    return {"status": "ready", "service": "complaint-api", "environment": settings.app_env}
