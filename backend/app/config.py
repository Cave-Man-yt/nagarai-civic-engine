import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "NagarAI Civic Complaint Intelligence Engine Backend"
    API_V1_STR: str = "/api"
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql://nagarai:nagarai_dev@localhost:5432/nagarai"
    )
    PORT: int = 8000
    SECRET_KEY: str = os.getenv("SECRET_KEY", "nagarai_secret_key_2026")

    class Config:
        case_sensitive = True
        env_file = ".env"
        extra = "ignore"

settings = Settings()
