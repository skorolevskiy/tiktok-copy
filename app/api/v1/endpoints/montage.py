from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import List
import uuid

from app.api import deps
from app.models.motion_cache import MotionCache
from app.models.video import Video
from app.models.edit import Edit, EditStatus
from app.models.track import Track
from app.schemas.edit import EditRequest, EditResponse
from app.worker.tasks import process_edit_task
from app.core.config import settings
from app.api.v1.endpoints.files import get_file_url

router = APIRouter()


@router.post("", response_model=EditResponse)
def create_montage(
    payload: EditRequest,
    request: Request,
    db: Session = Depends(deps.get_db),
):
    """Create a new montage: overlay a track onto a generated motion video or a reference video."""
    video_id = None
    motion_id = None

    if payload.motion_id:
        motion = db.query(MotionCache).filter(MotionCache.id == payload.motion_id).first()
        if not motion:
            raise HTTPException(status_code=404, detail="Motion video not found")
        # Check if motion is successful/ready?
        if motion.status != "success": 
            raise HTTPException(status_code=400, detail="Motion video is not ready for editing")
        motion_id = motion.id

    elif payload.video_id:
        video = db.query(Video).filter(Video.id == payload.video_id).first()
        if not video:
             raise HTTPException(status_code=404, detail="Reference video not found")
        # Check if video is downloaded
        if video.status != "downloaded" and video.status != "completed": # Accomodate possible statuses
             raise HTTPException(status_code=400, detail="Reference video is not ready (not downloaded)")
        video_id = video.id

    else:
        raise HTTPException(status_code=400, detail="Either motion_id or video_id must be provided")

    track = db.query(Track).filter(Track.id == payload.track_id).first()
    if not track:
        raise HTTPException(status_code=404, detail="Track not found")

    edit_job = Edit(
        motion_id=motion_id,
        video_id=video_id,
        track_id=track.id,
        status=EditStatus.pending,
    )
    db.add(edit_job)
    db.commit()
    db.refresh(edit_job)

    process_edit_task.delay(str(edit_job.id))

    return EditResponse(
        id=edit_job.id,
        motion_id=motion_id,
        video_id=video_id,
        track_id=track.id,
        status=edit_job.status.value,
        file_url=None,
    )


@router.get("", response_model=List[EditResponse])
def list_all_montages(
    request: Request,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(deps.get_db),
):
    """List all generated montages across all videos."""
    edits = (
        db.query(Edit)
        .filter(Edit.status != EditStatus.failed)
        .order_by(Edit.id.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return [
        EditResponse(
            id=e.id,
            motion_id=e.motion_id,
            track_id=e.track_id,
            status=e.status.value if hasattr(e.status, "value") else e.status,
            file_url=get_file_url(request, settings.MINIO_BUCKET_PROCESSED, e.processed_file_path)
            if e.processed_file_path
            else None,
        )
        for e in edits
    ]


@router.get("/{montage_id}", response_model=EditResponse)
def get_montage(
    montage_id: uuid.UUID,
    request: Request,
    db: Session = Depends(deps.get_db),
):
    """Get a single montage by ID."""
    e = db.query(Edit).filter(Edit.id == montage_id).first()
    if not e:
        raise HTTPException(status_code=404, detail="Montage not found")
    return EditResponse(
        id=e.id,
        motion_id=e.motion_id,
        track_id=e.track_id,
        status=e.status.value if hasattr(e.status, "value") else e.status,
        file_url=get_file_url(request, settings.MINIO_BUCKET_PROCESSED, e.processed_file_path)
        if e.processed_file_path
        else None,
    )


@router.delete("/{montage_id}")
def delete_montage(
    montage_id: uuid.UUID,
    db: Session = Depends(deps.get_db),
):
    """Delete a montage result."""
    e = db.query(Edit).filter(Edit.id == montage_id).first()
    if not e:
        raise HTTPException(status_code=404, detail="Montage not found")

    # Try to remove the file from MinIO
    if e.processed_file_path:
        try:
            from app.services.minio_client import minio_client

            minio_client.client.remove_object(settings.MINIO_BUCKET_PROCESSED, e.processed_file_path)
        except Exception:
            pass  # file may already be gone

    db.delete(e)
    db.commit()
    return {"message": "Montage deleted"}
