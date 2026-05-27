import logging
from typing import Optional

LOG_FORMAT = "%(asctime)s | %(levelname)s | %(message)s"


def resolve_level(debug: bool, log_level: Optional[str]) -> str:
    if log_level:
        value = getattr(logging, log_level.upper(), None)
        if isinstance(value, int):
            return logging.getLevelName(value)
    return "DEBUG" if debug else "INFO"


def build_logging_config(debug: bool, log_level: Optional[str]) -> dict:
    resolved_level = resolve_level(debug, log_level)
    return {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "standard": {
                "format": LOG_FORMAT,
            }
        },
        "handlers": {
            "console": {
                "class": "logging.StreamHandler",
                "level": resolved_level,
                "formatter": "standard",
            }
        },
        "root": {
            "handlers": ["console"],
            "level": resolved_level,
        },
    }

