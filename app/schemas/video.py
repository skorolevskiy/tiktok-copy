from pydantic import BaseModel, HttpUrl
from uuid import UUID
from typing import List, Optional

class VideoDownloadRequest(BaseModel):
    tiktok_urls: List[str]
    save_to_bucket: bool = True

class VideoResponse(BaseModel):
    id: UUID
    original_url: str
    status: str
    file_url: Optional[str] = None
    thumbnail_url: Optional[str] = None

    class Config:
        from_attributes = True
