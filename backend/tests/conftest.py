import os

os.environ["ENVIRONMENT"] = "test"

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import get_settings
from app.db.base import Base
from app.db.session import get_async_db
from app.main import app

settings = get_settings()


@pytest.fixture(scope="session")
def engine():
    """
    one engine for all session tests
    create tables in test_db before tests and delete after
    """

    engine = create_engine(settings.database_url, future=True)

    import app.models  # noqa: 401

    Base.metadata.create_all(bind=engine)

    try:
        yield engine
    finally:
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def db_session(engine):
    """
    Session for every test
    At the end of the test, roll back all changes
    """
    SessionLocal = sessionmaker(
        bind=engine, autoflush=False, autocommit=False, future=True
    )
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(scope="function")
def client(db_session):
    """
    TestClient, which uses TEST db_session instead regular get_db
    """

    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_async_db] = override_get_db

    with TestClient(app) as c:
        yield c

    # clear overrides after test
    app.dependency_overrides.clear()
