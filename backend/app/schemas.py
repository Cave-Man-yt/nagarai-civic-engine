from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str = "ok"
    database_connected: bool = True
    message: str = "PostgreSQL + PostGIS + pgvector backend operational"


class SubmitComplaintResponse(BaseModel):
    status: str = "success"
    complaint_id: str
    cluster_id: str
    action: str  # "created" or "merged"
    category: str
    severity: int
    summary: str
    priority_score: float
    affected_citizens: int
    message: str


class ComplaintOut(BaseModel):
    id: str
    user_id: str
    gps_lat: float
    gps_lng: float
    audio_url: Optional[str] = None
    image_url: Optional[str] = None
    raw_text: Optional[str] = None
    summary: Optional[str] = None
    category: Optional[str] = None
    severity: Optional[int] = None
    cluster_id: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ClusterOut(BaseModel):
    id: str
    center_lat: float
    center_lng: float
    category: str
    severity: int
    summary: Optional[str] = None
    affected_citizens: int
    priority_score: float
    status: str
    assigned_department: Optional[str] = None
    sla_hours: Optional[int] = 24
    created_at: datetime

    class Config:
        from_attributes = True
