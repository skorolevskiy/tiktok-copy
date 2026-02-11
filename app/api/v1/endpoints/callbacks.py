from fastapi import APIRouter, Body, Depends, Response
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
import logging
import json
import aiohttp
import os
import io
import tempfile
import uuid

from app.api import deps
from app.models.motion_cache import MotionCache as MotionModel
from app.schemas.motion_cache import JobStatus
from app.services.minio_client import MinioClient
from app.services.video import generate_thumbnail
from app.core.config import settings

router = APIRouter()
logger = logging.getLogger(__name__)
minio_client = MinioClient()

@router.post("")
async def handle_callback(
    payload: dict = Body(...),
    db: Session = Depends(deps.get_db)
):
    # Validate basics
    if payload.get("code") != 200:
        logger.warning(f"Callback received with non-200 code: {payload}")
        return JSONResponse({"status": "ignored"})
    
    data = payload.get("data", {})
    task_id = data.get("taskId")
    state = data.get("state")
    
    if not task_id:
        return JSONResponse({"status": "no_task_id"}, status_code=400)

    # Find the motion task
    motion_task = db.query(MotionModel).filter(MotionModel.external_job_id == task_id).first()
    if not motion_task:
        logger.warning(f"Callback for unknown task_id: {task_id}")
        return JSONResponse({"status": "unknown_task_id"}, status_code=404)
    
    # We update based on external_job_id
    if state == "success":
        result_json_str = data.get("resultJson")
        video_url = None
        try:
            if result_json_str:
                res_data = json.loads(result_json_str)
                urls = res_data.get("resultUrls", [])
                if urls:
                    video_url = urls[0]
        except Exception as e:
            logger.error(f"Failed to parse resultJson: {e}")
        
        if video_url:
            motion_thumbnail_url = None
            local_video_url = None
            try:
                # Download video to temp
                temp_video = tempfile.mktemp(suffix=".mp4")
                
                async with aiohttp.ClientSession() as session:
                    async with session.get(video_url) as resp:
                        if resp.status == 200:
                            content = await resp.read()
                            with open(temp_video, "wb") as f:
                                f.write(content)
                            
                            # Upload video to MinIO (Motion Videos)
                            video_filename = f"motion_{task_id}_{uuid.uuid4()}.mp4"
                            video_file = io.BytesIO(content)
                            minio_client.put_object(
                                settings.MINIO_BUCKET_MOTIONS,
                                video_filename,
                                video_file,
                                len(content),
                                content_type="video/mp4"
                            )
                            local_video_url = minio_client.get_url(settings.MINIO_BUCKET_MOTIONS, video_filename)

                            # Generate thumbnail
                            thumb_path = generate_thumbnail(temp_video)
                            if thumb_path:
                                thumb_filename = f"thumb_motion_{task_id}_{uuid.uuid4()}.jpg"
                                with open(thumb_path, "rb") as tf:
                                    thumb_content = tf.read()
                                    thumb_file = io.BytesIO(thumb_content)
                                    minio_client.put_object(
                                        settings.MINIO_BUCKET_MOTIONS,
                                        thumb_filename,
                                        thumb_file,
                                        len(thumb_content),
                                        content_type="image/jpeg"
                                    )
                                    motion_thumbnail_url = minio_client.get_url(settings.MINIO_BUCKET_MOTIONS, thumb_filename)
                                
                                try: os.remove(thumb_path)
                                except: pass
                
                if os.path.exists(temp_video):
                    try: os.remove(temp_video)
                    except: pass
            except Exception as e:
                logger.error(f"Failed to process video/thumbnail for callback {task_id}: {e}")

            # Update DB record with info (Success)
            motion_task.status = JobStatus.SUCCESS.value
            motion_task.motion_video_url = local_video_url or video_url # Fallback to external if local fails? Or keeping external?
            motion_task.motion_thumbnail_url = motion_thumbnail_url
            
            db.commit()

    else:
        # handle fail
        fail_msg = data.get("failMsg")
        motion_task.status = JobStatus.FAILED.value
        motion_task.error_log = fail_msg
        db.commit()

    return JSONResponse({"status": "ok"})
