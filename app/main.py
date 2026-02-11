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

    @app.get("/{full_path:path}")
    def serve_frontend(full_path: str):
        # Allow API routes to pass through if technically they weren't caught (though they should be by include_router priority)
        if full_path.startswith("api/") or full_path.startswith("docs") or full_path.startswith("openapi.json"):
             from fastapi import HTTPException
             raise HTTPException(status_code=404, detail="Not Found")
             
        # Check if file exists in root of frontend dir (e.g. favicon.ico, manifest.json)
        potential_file = os.path.join(FRONTEND_DIR, full_path)
        if os.path.isfile(potential_file):
            return FileResponse(potential_file)

        # Fallback to index.html for SPA routing
        return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))
