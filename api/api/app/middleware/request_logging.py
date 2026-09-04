import logging
import time
from uuid import uuid4

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger("api.request")


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request_id = str(uuid4())
        # Attach request_id to request state so other parts of the app can use it
        request.state.request_id = request_id
        
        start_time = time.time()
        
        # Determine user_id if token exists in header (this is a best-effort, 
        # normally we do it in dependency injection but middleware runs before it)
        # For simplicity, we just won't have user_id here, but we can capture it in routes if needed.
        # Wait, if we want user_id in the access log, it's tricky because authentication happens later.
        
        response = await call_next(request)
        
        duration_ms = (time.time() - start_time) * 1000
        
        # To avoid logging sensitive paths like passwords, we can mask them, but standard method/path is fine
        logger.info(
            "HTTP Request",
            extra={
                "request_id": request_id,
                "method": request.method,
                "path": request.url.path,
                "status_code": response.status_code,
                "duration_ms": round(duration_ms, 2)
            }
        )
        
        # Add request_id to response headers
        response.headers["X-Request-ID"] = request_id
        return response
