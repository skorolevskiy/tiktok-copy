import uuid
from sqlalchemy import Column, String, ForeignKey, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.models.base import Base
import enum

class EditStatus(str, enum.Enum):
    pending = "pending"
    processing = "processing"
    completed = "completed"
    failed = "failed"

class Edit(Base):
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    motion_id = Column(UUID(as_uuid=True), ForeignKey('motion_cache.id'), nullable=True)
    video_id = Column(UUID(as_uuid=True), ForeignKey('video.id'), nullable=True)
    track_id = Column(UUID(as_uuid=True), ForeignKey('tracks.id'), nullable=False)
    processed_file_path = Column(String, nullable=True)
    edit_task_id = Column(UUID(as_uuid=True), nullable=True)
    status = Column(SQLEnum(EditStatus, name="edit_status"), default=EditStatus.pending)
    
    motion = relationship("MotionCache")
    video = relationship("Video")
    track = relationship("Track")
