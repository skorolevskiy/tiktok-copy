from fastapi import APIRouter, HTTPException, Depends, Request
from typing import List
from sqlalchemy.orm import Session
import uuid

from app.api import deps
from app.models.motion_cache import MotionCache as MotionModel
from app.models.avatar import Avatar as AvatarModel
from app.models.video import Video as VideoModel
from app.schemas.motion_cache import MotionCache, MotionCacheCreate, JobStatus
from app.services.motion_service import request_motion_generation
from app.api.v1.endpoints.files import get_file_url
from app.core.config import settings

router = APIRouter()

@router.post("", response_model=MotionCache)
async def create_motion_cache(
    motion: MotionCacheCreate,
    request: Request,
    db: Session = Depends(deps.get_db)
):
    # Check if exists (idempotency for same avatar+reference+success)
    existing = db.query(MotionModel).filter(
        MotionModel.avatar_id == motion.avatar_id,
        MotionModel.reference_id == motion.reference_id,
        MotionModel.status == JobStatus.SUCCESS.value
    ).first()
        
    if existing:
        return existing

    # Fetch URLs
    # Check Avatar
    avatar = db.query(AvatarModel).filter(AvatarModel.id == motion.avatar_id).first()
    if not avatar:
        raise HTTPException(status_code=404, detail="Avatar not found")
    avatar_url = avatar.image_url

    # Check Reference Motion (Video)
    reference = db.query(VideoModel).filter(VideoModel.id == motion.reference_id).first()
    if not reference:
        raise HTTPException(status_code=404, detail="Reference motion (Video) not found")

    # We need a URL for the reference video
    if reference.file_path:
         ref_url = get_file_url(request, settings.MINIO_BUCKET_TIKTOK, reference.file_path)
    else:
         ref_url = reference.original_url

    # Call External API via Service
    try:
        task_id = await request_motion_generation(avatar_url, ref_url)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to initiate motion generation: {str(e)}")

    # Create Motion Cache Entry
    new_motion = MotionModel(
        avatar_id=motion.avatar_id,
        reference_id=motion.reference_id,
        status=JobStatus.PROCESSING.value,
        external_job_id=task_id
    )

    db.add(new_motion)
    db.commit()
    db.refresh(new_motion)
    
    return new_motion

@router.get("", response_model=List[MotionCache])
async def list_motion(db: Session = Depends(deps.get_db)):
    return db.query(MotionModel).order_by(MotionModel.created_at.desc()).all()

@router.get("/{motion_id}", response_model=MotionCache)
async def get_motion(motion_id: str, db: Session = Depends(deps.get_db)):
    try:
        uuid_id = uuid.UUID(motion_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid UUID")

    item = db.query(MotionModel).filter(MotionModel.id == uuid_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Motion not found")
    return item

@router.delete("/{motion_id}", status_code=204)
async def delete_motion(motion_id: str, db: Session = Depends(deps.get_db)):
    try:
        uuid_id = uuid.UUID(motion_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid UUID")
        
    item = db.query(MotionModel).filter(MotionModel.id == uuid_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Motion entry not found")
        
    db.delete(item)
    db.commit()
    return None
