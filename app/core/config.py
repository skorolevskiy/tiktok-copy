from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "TikTok Video Service"
    API_V1_STR: str = "/api"
    
    # Postgres
    POSTGRES_SERVER: str = "db"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_DB: str = "app"
    SQLALCHEMY_DATABASE_URI: Optional[str] = None

    # Redis (Celery)
    REDIS_HOST: str = "redis"
    REDIS_PORT: int = 6379
    CELERY_BROKER_URL: Optional[str] = None
    CELERY_RESULT_BACKEND: Optional[str] = None

    # MinIO
    MINIO_URL: str = "minio:9000"
    MINIO_ACCESS_KEY: str = "minioadmin"
    MINIO_SECRET_KEY: str = "minioadmin"
    MINIO_BUCKET_AUDIO: str = "audio-tracks"
    MINIO_BUCKET_TIKTOK: str = "tiktok-original"
    MINIO_BUCKET_PROCESSED: str = "processed-videos"
    MINIO_BUCKET_AVATARS: str = "avatars"
    MINIO_BUCKET_REFERENCES: str = "references"
    MINIO_BUCKET_MOTIONS: str = "motions"
    MINIO_SECURE: bool = False

    def model_post_init(self, __context):
        if self.SQLALCHEMY_DATABASE_URI is None:
            self.SQLALCHEMY_DATABASE_URI = f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}/{self.POSTGRES_DB}"
        if self.CELERY_BROKER_URL is None:
            self.CELERY_BROKER_URL = f"redis://{self.REDIS_HOST}:{self.REDIS_PORT}/0"
        if self.CELERY_RESULT_BACKEND is None:
            self.CELERY_RESULT_BACKEND = f"redis://{self.REDIS_HOST}:{self.REDIS_PORT}/0"

settings = Settings()
