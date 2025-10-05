"""
Logging utilities for ML Service
"""

import logging
import sys
from pythonjsonlogger import jsonlogger


def setup_logger(name: str = "ml-service", level: int = logging.INFO) -> logging.Logger:
    """
    Setup structured JSON logger

    Benefits:
    - Structured logs (JSON format)
    - Easy parsing by log aggregators (Datadog, CloudWatch)
    - Consistent format across services
    """
    logger = logging.getLogger(name)
    logger.setLevel(level)

    # Console handler with JSON formatter
    handler = logging.StreamHandler(sys.stdout)
    formatter = jsonlogger.JsonFormatter(
        fmt='%(asctime)s %(name)s %(levelname)s %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    handler.setFormatter(formatter)

    # Clear existing handlers and add new one
    logger.handlers = []
    logger.addHandler(handler)

    return logger
