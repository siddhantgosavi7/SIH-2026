import logging
from typing import Any


def get_complaint_logger(name: str) -> logging.LoggerAdapter:
    """Return a logger adapter that accepts extra context kwargs."""
    logger = logging.getLogger(name)
    return ComplaintLoggerAdapter(logger, {})


class ComplaintLoggerAdapter(logging.LoggerAdapter):
    """Adapter to easily pass complaint context to structured logs."""
    
    def process(self, msg: str, kwargs: dict[str, Any]) -> tuple[str, dict[str, Any]]:
        extra = kwargs.get("extra", {})
        
        # Pop specific context keys and move them into extra for structured logging
        context_keys = [
            "complaint_id", 
            "department", 
            "classification_source", 
            "priority", 
            "processing_time_ms",
            "request_id",
            "user_id"
        ]
        
        for key in context_keys:
            if key in kwargs:
                extra[key] = kwargs.pop(key)
                
        kwargs["extra"] = extra
        return msg, kwargs
