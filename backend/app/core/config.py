import os
from pathlib import Path
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parents[2]
ENV_PATH = BACKEND_DIR / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(ENV_PATH) if ENV_PATH.exists() else ".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=True,
    )

    # Server Config
    PROJECT_NAME: str = "Telegram Digital Store Bot API"
    ENV: str = "development"
    DEBUG: bool = True
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    FRONTEND_URL: Optional[str] = None

    # Database
    POSTGRES_USER: str = "store_user"
    POSTGRES_PASSWORD: str = "store_password_secret"
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_DB: str = "telegram_store_db"
    DATABASE_URL: Optional[str] = None

    @property
    def async_database_url(self) -> str:
        if self.DATABASE_URL:
            url = self.DATABASE_URL
            if url.startswith("postgresql://"):
                url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
            elif url.startswith("postgres://"):
                url = url.replace("postgres://", "postgresql+asyncpg://", 1)
            return url
        return f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    # Redis
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0
    REDIS_URL: Optional[str] = None

    @property
    def get_redis_url(self) -> str:
        if self.REDIS_URL:
            return self.REDIS_URL
        return f"redis://{self.REDIS_HOST}:{self.REDIS_PORT}/{self.REDIS_DB}"

    # Security & JWT
    JWT_SECRET: str = "super_secret_jwt_key_change_me_in_production_32bytes_min"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 43200
    ADMIN_USERNAME: str = "vayuk016@gmail.com"
    ADMIN_PASSWORD: str = "sp169926"

    # Digital Key Encryption (AES-Fernet key)
    # Default 32-byte urlsafe base64 key
    KEY_ENCRYPTION_KEY: str = "gK7xL2Z8N3V_pW9Q1mY4sT0uR6vX8zA5bC2dE1fG3hI="

    # Telegram Bot
    BOT_TOKEN: str = "123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
    TELEGRAM_BOT_USERNAME: str = "sopha9926"
    ADMIN_TELEGRAM_ID: Optional[int] = None
    TELEGRAM_WEBHOOK_URL: Optional[str] = None

    # KHQR / Payment
    KHQR_MERCHANT_NAME: str = "DIGITAL STORE KH"
    KHQR_MERCHANT_CITY: str = "PHNOM PENH"
    KHQR_ACCOUNT_NUMBER: str = "000111222"
    KHQR_SECRET: str = "khqr_webhook_secret_key"

    # ABA Payment specific config
    ABA_ACCOUNT_NAME: str = "HAK HAK"
    ABA_ACCOUNT_NUMBER: str = "000 111 222"
    ABA_QR_LINK: str = "https://example.com/aba_qr.jpg"

    # Cloudinary Config (Optional for Production CDN Media Storage)
    CLOUDINARY_CLOUD_NAME: Optional[str] = None
    CLOUDINARY_API_KEY: Optional[str] = None
    CLOUDINARY_API_SECRET: Optional[str] = None
    CLOUDINARY_URL: Optional[str] = None


settings = Settings()
