from fastapi import APIRouter, HTTPException, File, UploadFile, Form, Depends, Request
from typing import List, Optional
from sqlalchemy.orm import Session
import uuid
import os
import io

from app.api import deps
from app.services.minio_client import MinioClient
from app.core.config import settings
from app.api.v1.endpoints.files import get_file_url
from app.models.avatar import Avatar as AvatarModel
from app.schemas.avatar import Avatar as AvatarSchema, AvatarCreate

router = APIRouter()
minio_client = MinioClient()

@router.post("", response_model=AvatarSchema)
async def create_avatar(
    request: Request,
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
    
    # Create DB record
    db_obj = AvatarModel(filename=filename, source_type=source_type)
    
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)

    return AvatarSchema(
        id=db_obj.id,
        filename=db_obj.filename,
        source_type=db_obj.source_type,
        created_at=db_obj.created_at,
        image_url=get_file_url(request, settings.MINIO_BUCKET_AVATARS, db_obj.filename)
    )

@router.get("/{avatar_id}", response_model=AvatarSchema)
async def get_avatar(avatar_id: str, request: Request, db: Session = Depends(deps.get_db)):
    try:
        uuid_id = uuid.UUID(avatar_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid UUID")

    avatar = db.query(AvatarModel).filter(AvatarModel.id == uuid_id).first()
    if not avatar:
        raise HTTPException(status_code=404, detail="Avatar not found")
        
    return AvatarSchema(
        id=avatar.id,
        filename=avatar.filename,
        source_type=avatar.source_type,
        created_at=avatar.created_at,
        image_url=get_file_url(request, settings.MINIO_BUCKET_AVATARS, avatar.filename)
    )

@router.get("", response_model=List[AvatarSchema])
async def list_avatars(request: Request, db: Session = Depends(deps.get_db)):
    avatars = db.query(AvatarModel).order_by(AvatarModel.created_at.desc()).all()
    return [
        AvatarSchema(
            id=a.id,
            filename=a.filename,
            source_type=a.source_type,
            created_at=a.created_at,
            image_url=get_file_url(request, settings.MINIO_BUCKET_AVATARS, a.filename)
        ) for a in avatars
    ]

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
