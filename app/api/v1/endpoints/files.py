from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
from app.services.minio_client import minio_client
from app.core.config import settings

router = APIRouter()

ALLOWED_BUCKETS = {
    settings.MINIO_BUCKET_AUDIO,
    settings.MINIO_BUCKET_TIKTOK,
    settings.MINIO_BUCKET_PROCESSED,
}

CONTENT_TYPES = {
    ".mp4": "video/mp4",
    ".mp3": "audio/mpeg",
    ".wav": "audio/wav",
    ".webm": "video/webm",
    ".mkv": "video/x-matroska",
}


def get_file_url(request: Request, bucket: str, object_name: str) -> str:
    """Build an absolute URL for the file streaming endpoint."""
    base = str(request.base_url).rstrip("/")
    return f"{base}{settings.API_V1_STR}/files/{bucket}/{object_name}"


@router.get("/{bucket}/{object_name}")
def stream_file(bucket: str, object_name: str):
    """
    Stream a file directly from MinIO storage.
    Works as a reverse-proxy so the client doesn't need direct MinIO access.
    """
    if bucket not in ALLOWED_BUCKETS:
        raise HTTPException(status_code=403, detail="Access to this bucket is denied")

    try:
        response = minio_client.client.get_object(bucket, object_name)
    except Exception:
        raise HTTPException(status_code=404, detail="File not found")

    # Determine content type from headers or extension
    content_type = response.headers.get("Content-Type", "application/octet-stream")
    if content_type == "application/octet-stream":
        ext = "." + object_name.rsplit(".", 1)[-1] if "." in object_name else ""
        content_type = CONTENT_TYPES.get(ext, content_type)

    content_length = response.headers.get("Content-Length")

    headers = {
        "Content-Disposition": f'inline; filename="{object_name}"',
        "Accept-Ranges": "bytes",
        "Cache-Control": "public, max-age=3600",
    }
    if content_length:
        headers["Content-Length"] = content_length

    def iterfile():
        try:
            for chunk in response.stream(32 * 1024):
                yield chunk
        finally:
            response.close()
            response.release_conn()

    return StreamingResponse(
        iterfile(),
        media_type=content_type,
        headers=headers,
    )
