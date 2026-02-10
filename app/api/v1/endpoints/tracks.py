from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid
import io

from app.api import deps
from app.models.track import Track, TrackStatus
from app.schemas.track import TrackResponse
from app.services.minio_client import minio_client
from app.core.config import settings
from app.worker.tasks import process_track_task
from app.api.v1.endpoints.files import get_file_url

router = APIRouter()

# Simple Rate Limiter (Conceptual)
# In production, use fastapi-limiter with Redis
from fastapi import Request
import time
from collections import defaultdict
upload_counters = defaultdict(list)

def rate_limit(request: Request):
    client_ip = request.client.host
    now = time.time()
    # Clean old
    upload_counters[client_ip] = [t for t in upload_counters[client_ip] if now - t < 60]
    if len(upload_counters[client_ip]) >= 5:
        raise HTTPException(status_code=429, detail="Rate limit exceeded")
    upload_counters[client_ip].append(now)

@router.post("/upload", response_model=TrackResponse, dependencies=[Depends(rate_limit)])
def upload_track(
    request: Request,
    name: str = Form(...),
    artist: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(deps.get_db)
):
    if file.content_type not in ["audio/mpeg", "audio/wav", "audio/mp3"]:
        raise HTTPException(status_code=400, detail="Invalid file type. Only MP3/WAV allowed.")
    
    # Check size - crude check by reading into memory (limit 50MB as per req)
    MAX_SIZE = 50 * 1024 * 1024
    content = file.file.read()
    if len(content) > MAX_SIZE:
        raise HTTPException(status_code=400, detail="File too large")
    
    file.file.seek(0)
    
    track_id = uuid.uuid4()
    ext = file.filename.split(".")[-1]
    object_name = f"audio_{track_id}.{ext}"
    
    # Create DB entry
    db_track = Track(
        id=track_id,
        name=name,
        artist=artist,
        file_path=object_name,
        mimetype=file.content_type,
        size_bytes=len(content),
        status=TrackStatus.processing
    )
    db.add(db_track)
    try:
        db.commit()
        db.refresh(db_track)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail="Track name already exists or db error")

    # Upload to MinIO
    try:
        minio_client.put_object(
            settings.MINIO_BUCKET_AUDIO,
            object_name,
            io.BytesIO(content),
            len(content),
            file.content_type
        )
    except Exception as e:
        db.delete(db_track)
        db.commit()
        raise HTTPException(status_code=500, detail=f"Storage error: {str(e)}")

    # Trigger async processing
    process_track_task.delay(str(track_id))

    # Construct response
    return TrackResponse(
        id=db_track.id,
        name=db_track.name,
        artist=db_track.artist,
        duration_seconds=0, # Will be updated
        file_url=get_file_url(request, settings.MINIO_BUCKET_AUDIO, object_name),
        size_mb=len(content) / (1024 * 1024)
    )

@router.get("", response_model=List[TrackResponse])
def list_tracks(
    request: Request,
    skip: int = 0, 
    limit: int = 100, 
    search: Optional[str] = None,
    db: Session = Depends(deps.get_db)
):
    query = db.query(Track).filter(Track.status == TrackStatus.active)
    if search:
        query = query.filter(Track.name.ilike(f"%{search}%") | Track.artist.ilike(f"%{search}%"))
    
    tracks = query.offset(skip).limit(limit).all()
    
    return [
        TrackResponse(
            id=t.id,
            name=t.name,
            artist=t.artist or "",
            duration_seconds=t.duration_seconds,
            file_url=get_file_url(request, settings.MINIO_BUCKET_AUDIO, t.file_path),
            size_mb=t.size_bytes / (1024 * 1024)
        ) for t in tracks
    ]

@router.get("/{track_id}", response_model=TrackResponse)
def get_track(track_id: uuid.UUID, request: Request, db: Session = Depends(deps.get_db)):
    t = db.query(Track).filter(Track.id == track_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Track not found")
    
    return TrackResponse(
        id=t.id,
        name=t.name,
        artist=t.artist or "",
        duration_seconds=t.duration_seconds,
        file_url=get_file_url(request, settings.MINIO_BUCKET_AUDIO, t.file_path),
        size_mb=t.size_bytes / (1024 * 1024)
    )

@router.delete("/{track_id}")
def delete_track(track_id: uuid.UUID, db: Session = Depends(deps.get_db)):
    t = db.query(Track).filter(Track.id == track_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Track not found")
    
    # Soft delete requested
    t.status = TrackStatus.inactive
    db.commit()
    return {"message": "Track deleted"}
