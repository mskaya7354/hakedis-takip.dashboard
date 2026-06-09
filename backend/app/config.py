from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

# backend/.env — çalışma dizininden bağımsız (preview/systemd/farklı cwd uyumu)
_ENV_PATH = Path(__file__).resolve().parent.parent / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=str(_ENV_PATH), env_file_encoding="utf-8")

    excel_path: Path
    auth_username: str = "admin"
    auth_password: str = "change-me"
    jwt_secret: str = "change-me-jwt-secret"
    jwt_expires_minutes: int = 480
    push_token: str = "change-me-push-token"

    cache_ttl_seconds: float = 5.0
    load_max_retries: int = 3
    load_retry_backoff_sec: float = 1.0
    stale_tolerance_sec: int = 300


settings = Settings()
