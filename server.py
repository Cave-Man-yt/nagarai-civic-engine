"""
FastAPI Web Dashboard Server for NagarAI Civic Intelligence Engine
PS-S05
"""

import os
import sys
import time
import shutil
import logging
from pathlib import Path
from typing import Optional, Dict, Any

from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from main import process_civic_complaint
from deduplicator import DEFAULT_STORE
from browse_complaints import seed_sample_complaints


logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).parent.resolve()
PUBLIC_DIR = BASE_DIR / "public"
UPLOADS_DIR = BASE_DIR / "uploads"

PUBLIC_DIR.mkdir(exist_ok=True)
UPLOADS_DIR.mkdir(exist_ok=True)

app = FastAPI(
    title="NagarAI Civic Complaint Intelligence Engine API",
    description="PS-S05: Spatio-Semantic Deduplication & Priority Engine",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory=str(PUBLIC_DIR)), name="static")
app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")

# Seed sample dataset on startup
seed_sample_complaints(DEFAULT_STORE)


@app.get("/", response_class=HTMLResponse)
async def serve_dashboard():
    index_file = PUBLIC_DIR / "index.html"
    if index_file.exists():
        return index_file.read_text(encoding="utf-8")
    return "<h1>NagarAI Engine Dashboard Server Running</h1>"


@app.get("/api/clusters")
async def get_clusters():
    clusters = DEFAULT_STORE.get_all_clusters()
    sorted_clusters = sorted(clusters, key=lambda c: c.get("priority_score", 0.0), reverse=True)
    return JSONResponse(content={"clusters": sorted_clusters, "count": len(sorted_clusters)})


@app.post("/api/complaint/submit")
async def submit_complaint(
    raw_text: Optional[str] = Form(None),
    latitude: float = Form(28.6315),
    longitude: float = Form(77.2167),
    is_sensitive_location: bool = Form(False),
    days_pending: float = Form(0.0),
    sensitive: Optional[bool] = Form(None),
    days: Optional[float] = Form(None),
    audio_file: Optional[UploadFile] = File(None),
    image_file: Optional[UploadFile] = File(None)
):
    import math
    if math.isnan(latitude): latitude = 28.6315
    if math.isnan(longitude): longitude = 77.2167
    
    actual_sensitive = sensitive if sensitive is not None else is_sensitive_location
    actual_days = days if days is not None else days_pending
    
    saved_audio_path = None
    saved_image_path = None

    if audio_file and audio_file.filename:
        audio_ext = Path(audio_file.filename).suffix or ".wav"
        saved_audio_path = str(UPLOADS_DIR / f"voice_{int(time.time()*1000)}{audio_ext}")
        with open(saved_audio_path, "wb") as f:
            shutil.copyfileobj(audio_file.file, f)

    if image_file and image_file.filename:
        img_ext = Path(image_file.filename).suffix or ".jpg"
        saved_image_path = str(UPLOADS_DIR / f"img_{int(time.time()*1000)}{img_ext}")
        with open(saved_image_path, "wb") as f:
            shutil.copyfileobj(image_file.file, f)

    if not raw_text and not saved_audio_path and not saved_image_path:
        raise HTTPException(status_code=400, detail="Must provide at least a text description, audio file, or photo!")

    result = process_civic_complaint(
        audio_path=saved_audio_path,
        image_path=saved_image_path,
        raw_text=raw_text,
        latitude=latitude,
        longitude=longitude,
        is_sensitive_location=actual_sensitive,
        days_pending=actual_days,
        store=DEFAULT_STORE
    )

    return JSONResponse(content=result)


@app.post("/api/cluster/{cluster_id}/status")
async def update_status(cluster_id: str, payload: Dict[str, Any]):
    new_status = payload.get("status", "SUBMITTED")
    updated = DEFAULT_STORE.update_cluster_status(cluster_id, new_status)
    if not updated:
        raise HTTPException(status_code=404, detail="Cluster ID not found")
    return JSONResponse(content={"status": "success", "cluster": updated})


@app.post("/api/reset")
async def reset_database():
    DEFAULT_STORE.clear()
    return JSONResponse(content={"status": "cleared", "message": "All complaint clusters deleted."})


@app.post("/api/seed")
async def seed_database():
    seed_sample_complaints(DEFAULT_STORE)
    return JSONResponse(content={"status": "seeded", "message": "Sample complaints loaded."})


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000, reload=False)

