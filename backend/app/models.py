import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, Boolean, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from geoalchemy2 import Geometry
from pgvector.sqlalchemy import Vector
from app.database import Base



class Cluster(Base):
    __tablename__ = "clusters"

    id = Column(String(64), primary_key=True, default=lambda: f"cluster_{uuid.uuid4().hex[:8]}")
    center_location = Column(Geometry(geometry_type='POINT', srid=4326))
    center_lat = Column(Float, nullable=False)
    center_lng = Column(Float, nullable=False)
    category = Column(String(64), nullable=False, default="other")
    severity = Column(Integer, nullable=False, default=3)
    summary = Column(Text, nullable=True)
    affected_citizens = Column(Integer, nullable=False, default=1)
    priority_score = Column(Float, nullable=False, default=50.0)
    is_sensitive_location = Column(Boolean, default=False)
    assigned_department = Column(String(128), default="Municipal Services")
    sla_hours = Column(Integer, default=24)
    status = Column(String(32), nullable=False, default="SUBMITTED")
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    complaints = relationship("Complaint", back_populates="cluster")


class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(String(64), primary_key=True, default=lambda: f"cmp_{uuid.uuid4().hex[:8]}")
    user_id = Column(String(64), nullable=False, default="anonymous")
    gps_location = Column(Geometry(geometry_type='POINT', srid=4326))
    gps_lat = Column(Float, nullable=False)
    gps_lng = Column(Float, nullable=False)
    audio_url = Column(String(512), nullable=True)
    image_url = Column(String(512), nullable=True)
    raw_text = Column(Text, nullable=True)
    summary = Column(Text, nullable=True)
    category = Column(String(64), nullable=True)
    severity = Column(Integer, nullable=True)
    text_embedding = Column(Vector(384), nullable=True)
    image_embedding = Column(Vector(512), nullable=True)
    cluster_id = Column(String(64), ForeignKey("clusters.id", ondelete="SET NULL"), nullable=True)
    is_sensitive_location = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    cluster = relationship("Cluster", back_populates="complaints")
