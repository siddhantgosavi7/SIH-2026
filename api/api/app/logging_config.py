import json
import logging
import sys
from datetime import datetime, timezone
from typing import Any


class JSONFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        log_obj: dict[str, Any] = {
            "timestamp": datetime.fromtimestamp(record.created, tz=timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }

        if hasattr(record, "request_id"):
            log_obj["request_id"] = record.request_id

        if hasattr(record, "user_id"):
            log_obj["user_id"] = record.user_id

        if hasattr(record, "complaint_id"):
            log_obj["complaint_id"] = record.complaint_id

        if hasattr(record, "department"):
            log_obj["department"] = record.department

        if hasattr(record, "classification_source"):
            log_obj["classification_source"] = record.classification_source

        if hasattr(record, "priority"):
            log_obj["priority"] = record.priority
            
        if hasattr(record, "processing_time_ms"):
            log_obj["processing_time_ms"] = record.processing_time_ms

        if record.exc_info:
            log_obj["exception"] = self.formatException(record.exc_info)

        # Merge any extra kwargs passed to logger
        for key, value in record.__dict__.items():
            if key not in {"args", "asctime", "created", "exc_info", "exc_text", "filename",
                           "funcName", "id", "levelname", "levelno", "lineno", "module",
                           "msecs", "message", "msg", "name", "pathname", "process",
                           "processName", "relativeCreated", "stack_info", "thread",
                           "threadName", "taskName", "request_id", "user_id",
                           "complaint_id", "department", "classification_source", "priority", "processing_time_ms"}:
                log_obj[key] = value

        return json.dumps(log_obj, default=str)


def configure_logging() -> None:
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(JSONFormatter())
    
    # Overwrite root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.INFO)
    
    # Clear existing handlers
    if root_logger.hasHandlers():
        root_logger.handlers.clear()
        
    root_logger.addHandler(handler)
