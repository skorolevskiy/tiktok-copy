from fastapi import APIRouter
from app.api.v1.endpoints import tracks, references, files, montage, motions, avatars, callbacks

api_router = APIRouter()
api_router.include_router(tracks.router, prefix="/tracks", tags=["tracks"])
api_router.include_router(references.router, prefix="/references", tags=["references"])
api_router.include_router(montage.router, prefix="/montage", tags=["montage"])
api_router.include_router(files.router, prefix="/files", tags=["files"])
api_router.include_router(motions.router, prefix="/motions", tags=["motions"])
api_router.include_router(avatars.router, prefix="/avatars", tags=["avatars"])
api_router.include_router(callbacks.router, prefix="/callback", tags=["callback"])