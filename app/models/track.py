import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, BigInteger, DateTime, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from app.models.base import Base
import enum

class TrackStatus(str, enum.Enum):
    active = "active"
    inactive = "inactive"
    processing = "processing"

class Track(Base):
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), unique=True, nullable=False)
    artist = Column(String(255), nullable=True)
    duration_seconds = Column(Integer, nullable=True)
    file_path = Column(String, nullable=False)
    mimetype = Column(String(50), nullable=False)
    size_bytes = Column(BigInteger, nullable=False)
    status = Column(SQLEnum(TrackStatus, name="track_status"), default=TrackStatus.processing)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    uploaded_by = Column(UUID(as_uuid=True), nullable=True)
