import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.auth import router as auth_router
from app.api.v1.health import router as health_router
from app.api.v1.monitors import router as monitor_router
from app.api.v1.projects import router as projects_router
from app.api.v1.users import router as users_router
from app.api.v1.public_projects import router as public_projects_router
from app.api.v1.public_monitors import router as public_monitors_router
from app.core.config import get_settings
from app.core.logging import setup_logging


def create_app() -> FastAPI:
    setup_logging()

    settings = get_settings()
    logger = logging.getLogger("app.main")

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        # startup ----
        logger.info("Starting %s in %s", settings.app_name, settings.environment)

        yield

        # shutdown ---
        logger.info("Shutting down %s", settings.app_name)

    app = FastAPI(
        title=settings.app_name,
        debug=settings.debug,
        lifespan=lifespan
    )

    origins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]

    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(health_router, prefix=settings.api_v1_prefix)
    app.include_router(users_router, prefix=settings.api_v1_prefix)
    app.include_router(auth_router, prefix=settings.api_v1_prefix)
    app.include_router(projects_router, prefix=settings.api_v1_prefix)
    app.include_router(monitor_router, prefix=settings.api_v1_prefix)
    app.include_router(public_projects_router, prefix=settings.api_v1_prefix)
    app.include_router(public_monitors_router, prefix=settings.api_v1_prefix)

    return app



app = create_app()
