import logging
from config import Settings

def setup_logging(settings: Settings) -> None:
    """Basic logging configuration"""
    log_level = logging.DEBUG if settings.debug else logging.INFO

    logging.basicConfig(
        level=log_level,
        format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
    )