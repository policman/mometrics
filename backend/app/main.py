from fastapi import FastAPI

from .core.config import get_settings
from .core.logging import setup_logging
from .api.v1.health import router as health_router

def create_app() -> FastAPI:
    settings = get_settings()
    setup_logging(settings)

    app = FastAPI(
        title=settings.app_name,
        debug=settings.debug
    )

    app.include_router(health_router, prefix=settings.api_v1_prefix)

    return app


app = create_app()