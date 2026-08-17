import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "NagarAI Civic Complaint Intelligence Engine Backend"
    API_V1_STR: str = "/api/v1"
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql://vivekjampani@localhost:5432/nagarai_db"
    )
    PORT: int = 8001
    SECRET_KEY: str = "nagarai_secret_key_2026"

    class Config:
        case_sensitive = True
        env_file = ".env"
        extra = "ignore"


settings = Settings()
