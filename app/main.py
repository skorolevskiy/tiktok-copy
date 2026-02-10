from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from app.api.v1.api import api_router
from app.core.config import settings
import os

# Frontend build directory
# Priority: /frontend-dist (Docker build), then frontend/dist (local dev)
FRONTEND_DIR = None
for _candidate in ["/frontend-dist", os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend", "dist")]:
    if os.path.isdir(_candidate):
        FRONTEND_DIR = _candidate
        break

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/health")
def health_check():
    return {"status": "ok"}

# Serve React frontend from the Vite build output
if FRONTEND_DIR:
    _assets_dir = os.path.join(FRONTEND_DIR, "assets")
    if os.path.isdir(_assets_dir):
        app.mount("/assets", StaticFiles(directory=_assets_dir), name="static-assets")

    @app.get("/")
    def serve_frontend():
        return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))
