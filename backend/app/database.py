import os
import logging
from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config import settings

logger = logging.getLogger("nagarai.database")

Base = declarative_base()

def get_engine():
    db_url = settings.DATABASE_URL
    try:
        engine = create_engine(
            db_url,
            pool_pre_ping=True,
            echo=False
        )
        # Test connection
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        logger.info(f"Connected to PostgreSQL database at {db_url.split('@')[-1] if '@' in db_url else db_url}")
        return engine
    except Exception as e:
        logger.warning(f"Could not connect to PostgreSQL at {db_url}: {e}. Falling back to SQLite for local development.")
        sqlite_engine = create_engine(
            "sqlite:///./nagarai_dev.db",
            connect_args={"check_same_thread": False},
            echo=False
        )
        return sqlite_engine

engine = get_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
