from fastapi import APIRouter, HTTPException, Depends, Request
from typing import List
from sqlalchemy.orm import Session
import uuid

from app.api import deps
from app.models.video import Video
from app.schemas.video import VideoDownloadRequest, VideoResponse
from app.worker.tasks import download_video_task
from app.core.config import settings
from app.api.v1.endpoints.files import get_file_url

router = APIRouter()

@router.post("", response_model=List[VideoResponse])
async def create_reference(
    payload: VideoDownloadRequest,
    request: Request,
    db: Session = Depends(deps.get_db)
):
    responses = []
    for url in payload.tiktok_urls:
         # Check if this URL was already downloaded
        existing = db.query(Video).filter(
            Video.original_url == url,
            Video.status != "deleted"
        ).first()

        if existing:
            responses.append(VideoResponse(
                id=existing.id,
                original_url=existing.original_url,
                status=existing.status,
                file_url=get_file_url(request, settings.MINIO_BUCKET_TIKTOK, existing.file_path) if existing.file_path else None,
                thumbnail_url=get_file_url(request, settings.MINIO_BUCKET_TIKTOK, existing.thumbnail_path) if existing.thumbnail_path else None
            ))
            continue
        
        # Create new video entry
        vid = Video(original_url=url, status="pending")
        db.add(vid)
        db.commit()
        db.refresh(vid)
        
        # Trigger task for download
        download_video_task.delay(str(vid.id))

        responses.append(VideoResponse(
            id=vid.id,
            original_url=vid.original_url,
            status=vid.status,
            file_url=None,
            thumbnail_url=None
        ))
    return responses

@router.get("", response_model=List[VideoResponse])
async def list_references(request: Request, db: Session = Depends(deps.get_db)):
    videos = db.query(Video).filter(Video.status != "deleted").order_by(Video.created_at.desc()).all()
    return [
        VideoResponse(
            id=v.id,
            original_url=v.original_url,
            status=v.status,
            file_url=get_file_url(request, settings.MINIO_BUCKET_TIKTOK, v.file_path) if v.file_path else None,
            thumbnail_url=get_file_url(request, settings.MINIO_BUCKET_TIKTOK, v.thumbnail_path) if v.thumbnail_path else None
        ) for v in videos
    ]

@router.get("/{reference_id}", response_model=VideoResponse)
async def get_reference(reference_id: str, request: Request, db: Session = Depends(deps.get_db)):
    try:
        uuid_id = uuid.UUID(reference_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid UUID")

    vid = db.query(Video).filter(Video.id == uuid_id).first()
    if not vid:
        raise HTTPException(status_code=404, detail="Reference motion not found")
    return VideoResponse(
        id=vid.id,
        original_url=vid.original_url,
        status=vid.status,
        file_url=get_file_url(request, settings.MINIO_BUCKET_TIKTOK, vid.file_path) if vid.file_path else None,
        thumbnail_url=get_file_url(request, settings.MINIO_BUCKET_TIKTOK, vid.thumbnail_path) if vid.thumbnail_path else None
    )

@router.delete("/{reference_id}", status_code=204)
async def delete_reference(reference_id: str, db: Session = Depends(deps.get_db)):
    try:
        uuid_id = uuid.UUID(reference_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid UUID")
        
    vid = db.query(Video).filter(Video.id == uuid_id).first()
    if not vid:
        raise HTTPException(status_code=404, detail="Reference motion not found")
        
    vid.status = "deleted"
    db.commit()
    return None
