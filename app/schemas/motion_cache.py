from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional
from enum import Enum

class JobStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    SUCCESS = "success"
    FAILED = "failed"

class MotionCacheBase(BaseModel):
    avatar_id: UUID
    reference_id: UUID
    motion_video_url: Optional[str] = None
    motion_thumbnail_url: Optional[str] = None
    status: JobStatus = JobStatus.PENDING
    external_job_id: Optional[str] = None
    error_log: Optional[str] = None

class MotionCacheCreate(BaseModel):
    avatar_id: UUID
    reference_id: UUID

class MotionCacheUpdate(BaseModel):
    motion_video_url: Optional[str] = None
    motion_thumbnail_url: Optional[str] = None
    status: Optional[JobStatus] = None
    external_job_id: Optional[str] = None
    error_log: Optional[str] = None

class MotionCache(MotionCacheBase):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True
