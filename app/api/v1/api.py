from fastapi import APIRouter
from app.api.v1.endpoints import tracks, videos, files, montage

api_router = APIRouter()
api_router.include_router(tracks.router, prefix="/tracks", tags=["tracks"])
api_router.include_router(videos.router, prefix="/videos", tags=["videos"])
api_router.include_router(montage.router, prefix="/montage", tags=["montage"])
api_router.include_router(files.router, prefix="/files", tags=["files"])
