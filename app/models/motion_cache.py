import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from app.models.base import Base

class MotionCache(Base):
    __tablename__ = "motion_cache"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    avatar_id = Column(UUID(as_uuid=True), nullable=False) # ForeignKey('avatars.id') if needed, but loose coupling is fine too
    reference_id = Column(UUID(as_uuid=True), nullable=False) # ForeignKey('referencemotions.id')
    motion_video_url = Column(String, nullable=True)
    motion_thumbnail_url = Column(String, nullable=True)
    status = Column(String, default="pending")
    external_job_id = Column(String, nullable=True)
    error_log = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
