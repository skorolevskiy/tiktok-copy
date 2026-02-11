from pydantic import BaseModel
from uuid import UUID
from datetime import datetime

class AvatarBase(BaseModel):
    filename: str
    source_type: str = "Upload"

class AvatarCreate(AvatarBase):
    pass

class Avatar(AvatarBase):
    id: UUID
    image_url: str
    created_at: datetime

    class Config:
        from_attributes = True
