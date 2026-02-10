from pydantic import BaseModel
from uuid import UUID
from typing import Optional

class TrackBase(BaseModel):
    name: str
    artist: Optional[str] = None

class TrackCreate(TrackBase):
    pass

class TrackResponse(TrackBase):
    id: UUID
    duration_seconds: Optional[int]
    file_url: Optional[str] = None
    size_mb: float

    class Config:
        from_attributes = True
