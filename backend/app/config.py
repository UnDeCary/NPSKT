from functools import lru_cache
from pydantic import ConfigDict
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    model_config = ConfigDict(env_file=".env", extra="ignore")

    app_name: str = "Dashboard NPS KT"
    environment: str = "local"
    database_url: str = "sqlite:///./npskt.db"
    jwt_secret: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    access_token_minutes: int = 480
    frontend_origin: str = "http://localhost:5173"

@lru_cache
def get_settings() -> Settings:
    return Settings()
