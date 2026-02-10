from pydantic import BaseModel
from uuid import UUID
from typing import Optional

class EditRequest(BaseModel):
    video_id: UUID
    track_id: UUID

class EditResponse(BaseModel):
    id: UUID
    video_id: UUID
    track_id: UUID
    status: str
    file_url: Optional[str] = None

    class Config:
        from_attributes = True
