from fastapi import APIRouter, HTTPException, File, UploadFile, Form, Depends
from typing import List, Optional
from sqlalchemy.orm import Session
import uuid
import os
import io

from app.api import deps
from app.services.minio_client import MinioClient
from app.core.config import settings
from app.models.avatar import Avatar as AvatarModel
from app.schemas.avatar import Avatar as AvatarSchema, AvatarCreate

router = APIRouter()
minio_client = MinioClient()

@router.post("", response_model=AvatarSchema)
async def create_avatar(
    file: UploadFile = File(...),
    source_type: str = Form("Upload"),
    db: Session = Depends(deps.get_db)
):
    # Read file content
    file_content = await file.read()
    
    # Check size (200MB)
    if len(file_content) > 200 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File too large (max 200MB)")
            
    filename = f"avatar_{uuid.uuid4()}{os.path.splitext(file.filename)[1]}"
    file_obj = io.BytesIO(file_content)
    
    # Upload to MinIO
    minio_client.put_object(
        settings.MINIO_BUCKET_AVATARS,
        filename,
        file_obj,
        len(file_content),
        content_type=file.content_type
    )
    
    image_url = minio_client.get_url(settings.MINIO_BUCKET_AVATARS, filename)

    # Create DB record
    avatar_in = AvatarCreate(image_url=image_url, source_type=source_type)
    db_obj = AvatarModel(**avatar_in.dict())
    
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    
    return db_obj

@router.get("/{avatar_id}", response_model=AvatarSchema)
async def get_avatar(avatar_id: str, db: Session = Depends(deps.get_db)):
    try:
        uuid_id = uuid.UUID(avatar_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid UUID")

    avatar = db.query(AvatarModel).filter(AvatarModel.id == uuid_id).first()
    if not avatar:
        raise HTTPException(status_code=404, detail="Avatar not found")
    return avatar

@router.get("", response_model=List[AvatarSchema])
async def list_avatars(db: Session = Depends(deps.get_db)):
    return db.query(AvatarModel).order_by(AvatarModel.created_at.desc()).all()

@router.delete("/{avatar_id}", status_code=204)
async def delete_avatar(avatar_id: str, db: Session = Depends(deps.get_db)):
    try:
        uuid_id = uuid.UUID(avatar_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid UUID")
        
    avatar = db.query(AvatarModel).filter(AvatarModel.id == uuid_id).first()
    if not avatar:
        raise HTTPException(status_code=404, detail="Avatar not found")
        
    db.delete(avatar)
    db.commit()
    return None
