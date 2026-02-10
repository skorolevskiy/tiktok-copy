from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import List
import uuid

from app.api import deps
from app.models.video import Video
from app.schemas.video import VideoDownloadRequest, VideoResponse
from app.worker.tasks import download_video_task
from app.core.config import settings
from app.api.v1.endpoints.files import get_file_url

router = APIRouter()

@router.post("/download", response_model=List[VideoResponse])
def download_videos(
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
                file_url=get_file_url(request, settings.MINIO_BUCKET_TIKTOK, existing.file_path) if existing.file_path else None
            ))
            continue

        vid = Video(original_url=url, status="pending")
        db.add(vid)
        db.commit()
        db.refresh(vid)
        
        # Trigger task
        download_video_task.delay(str(vid.id))
        
        responses.append(VideoResponse(
            id=vid.id,
            original_url=vid.original_url,
            status=vid.status,
            file_url=None
        ))
    return responses

@router.get("", response_model=List[VideoResponse])
def list_videos(request: Request, skip: int = 0, limit: int = 100, db: Session = Depends(deps.get_db)):
    videos = db.query(Video).filter(Video.status != "deleted").offset(skip).limit(limit).all()
    return [
        VideoResponse(
            id=v.id,
            original_url=v.original_url,
            status=v.status,
            file_url=get_file_url(request, settings.MINIO_BUCKET_TIKTOK, v.file_path) if v.file_path else None
        ) for v in videos
    ]

@router.get("/{video_id}", response_model=VideoResponse)
def get_video(video_id: uuid.UUID, request: Request, db: Session = Depends(deps.get_db)):
    vid = db.query(Video).filter(Video.id == video_id).first()
    if not vid:
        raise HTTPException(status_code=404, detail="Video not found")
    return VideoResponse(
        id=vid.id,
        original_url=vid.original_url,
        status=vid.status,
        file_url=get_file_url(request, settings.MINIO_BUCKET_TIKTOK, vid.file_path) if vid.file_path else None
    )

@router.delete("/{video_id}")
def delete_video(video_id: uuid.UUID, db: Session = Depends(deps.get_db)):
    vid = db.query(Video).filter(Video.id == video_id).first()
    if not vid:
        raise HTTPException(status_code=404, detail="Video not found")
    
    vid.status = "deleted"
    db.commit()
    return {"message": "Video deleted"}
