from pydantic import BaseModel
from uuid import UUID
from typing import Optional

class EditRequest(BaseModel):
    motion_id: Optional[UUID] = None
    video_id: Optional[UUID] = None
    track_id: UUID

class EditResponse(BaseModel):
    id: UUID
    motion_id: Optional[UUID]
    video_id: Optional[UUID] = None
    track_id: UUID
    status: str
    file_url: Optional[str] = None
    thumbnail_url: Optional[str] = None

    class Config:
        from_attributes = True
