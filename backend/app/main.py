from fastapi import FastAPI

from app.core.config import get_settings
from app.core.logging import setup_logging
from app.api.v1.health import router as health_router

from app.api.v1.users import router as users_router

def create_app() -> FastAPI:
    settings = get_settings()
    setup_logging(settings)

    app = FastAPI(
        title=settings.app_name,
        debug=settings.debug
    )

    app.include_router(health_router, prefix=settings.api_v1_prefix)
    app.include_router(users_router, prefix=settings.api_v1_prefix)

    return app


app = create_app()