import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, Boolean, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from geoalchemy2 import Geometry
from pgvector.sqlalchemy import Vector
from app.database import Base

class FieldCrew(Base):
    __tablename__ = "field_crews"

    crew_id = Column(String(64), primary_key=True)
    name = Column(String(128), nullable=False)
    department = Column(String(128), default="Roads & PWD")
    contact = Column(String(32), default="")
    vehicle_number = Column(String(32), default="")
    status = Column(String(32), default="available")

    clusters = relationship("Cluster", back_populates="assigned_crew")


class Cluster(Base):
    __tablename__ = "clusters"

    id = Column(String(64), primary_key=True, default=lambda: f"cluster_{uuid.uuid4().hex[:8]}")
    cluster_code = Column(String(32), default=lambda: f"CL-{uuid.uuid4().hex[:4].upper()}")
    title = Column(Text, nullable=True)
    location_name = Column(Text, default="Municipal Ward")
    ward = Column(String(64), default="Unassigned Ward")
    center_location = Column(Geometry(geometry_type='POINT', srid=4326), nullable=True)
    center_lat = Column(Float, nullable=False, default=0.0)
    center_lng = Column(Float, nullable=False, default=0.0)
    centroid_radius_meters = Column(Integer, default=30)
    category = Column(String(64), nullable=False, default="pothole")
    severity = Column(Integer, nullable=False, default=3)
    summary = Column(Text, nullable=True)
    affected_citizens = Column(Integer, nullable=False, default=1)
    priority_score = Column(Float, nullable=False, default=50.0)
    is_sensitive_location = Column(Boolean, default=False)
    assigned_department = Column(String(128), default="Roads & PWD")
    sla_hours = Column(Integer, default=24)
    status = Column(String(32), nullable=False, default="pending")
    days_pending = Column(Float, default=0.0)
    assigned_crew_id = Column(String(64), ForeignKey("field_crews.crew_id", ondelete="SET NULL"), nullable=True)
    priority_breakdown = Column(JSON, nullable=True)
    resolution_data = Column(JSON, nullable=True)
    activity_logs = Column(JSON, default=list)
    reported_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    complaints = relationship("Complaint", back_populates="cluster", cascade="all, delete-orphan")
    assigned_crew = relationship("FieldCrew", back_populates="clusters")
    citizen_notifications = relationship("CitizenNotification", back_populates="cluster", cascade="all, delete-orphan")
    officer_notifications = relationship("OfficerNotification", back_populates="cluster", cascade="all, delete-orphan")


class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(String(64), primary_key=True, default=lambda: f"cmp_{uuid.uuid4().hex[:8]}")
    ticket_number = Column(String(32), default=lambda: f"NGR-{uuid.uuid4().hex[:5].upper()}")
    user_id = Column(String(64), nullable=False, default="anonymous")
    citizen_name = Column(String(128), default="Anonymous")
    citizen_phone = Column(String(32), default="")
    input_language = Column(String(16), default="ta")
    original_input_type = Column(String(16), default="text")
    transcription = Column(Text, nullable=True)
    gps_location = Column(Geometry(geometry_type='POINT', srid=4326), nullable=True)
    gps_lat = Column(Float, nullable=False, default=0.0)
    gps_lng = Column(Float, nullable=False, default=0.0)
    location_name = Column(Text, default="Municipal Ward")
    ward = Column(String(64), default="Unassigned Ward")
    department = Column(String(128), default="Roads & PWD")
    audio_url = Column(String(512), nullable=True)
    image_url = Column(String(512), nullable=True)
    photo_url = Column(String(512), nullable=True)
    raw_text = Column(Text, nullable=True)
    summary = Column(Text, nullable=True)
    clean_description = Column(Text, nullable=True)
    category = Column(String(64), nullable=True, default="pothole")
    severity = Column(Integer, nullable=True, default=3)
    nearby_landmarks = Column(JSON, default=list)
    text_embedding = Column(Vector(384), nullable=True)
    image_embedding = Column(Vector(512), nullable=True)
    cluster_id = Column(String(64), ForeignKey("clusters.id", ondelete="SET NULL"), nullable=True)
    is_duplicate = Column(Boolean, default=False)
    is_sensitive_location = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    cluster = relationship("Cluster", back_populates="complaints")


class CitizenNotification(Base):
    __tablename__ = "citizen_notifications"

    id = Column(String(64), primary_key=True, default=lambda: f"notif_{uuid.uuid4().hex[:8]}")
    cluster_id = Column(String(64), ForeignKey("clusters.id", ondelete="CASCADE"), nullable=True)
    cluster_code = Column(String(32), nullable=True)
    ticket_number = Column(String(32), nullable=True)
    recipient_name = Column(String(128), default="Citizen")
    recipient_phone = Column(String(32), default="")
    channel = Column(String(16), default="sms")
    type = Column(String(32), nullable=False, default="intake_received")
    message = Column(Text, nullable=False)
    status = Column(String(32), default="delivered")
    action_taken = Column(String(16), nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    cluster = relationship("Cluster", back_populates="citizen_notifications")


class OfficerNotification(Base):
    __tablename__ = "officer_notifications"

    id = Column(String(64), primary_key=True, default=lambda: f"off_notif_{uuid.uuid4().hex[:8]}")
    cluster_id = Column(String(64), ForeignKey("clusters.id", ondelete="CASCADE"), nullable=True)
    cluster_code = Column(String(32), nullable=True)
    title = Column(String(256), nullable=False)
    department = Column(String(128), default="Roads & PWD")
    priority_score = Column(Float, nullable=False, default=50.0)
    severity = Column(Integer, nullable=False, default=3)
    type = Column(String(32), nullable=False, default="critical_emergency")
    message = Column(Text, nullable=False)
    ward = Column(String(64), default="Unassigned Ward")
    location_name = Column(Text, default="Municipal Ward")
    action_required = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    cluster = relationship("Cluster", back_populates="officer_notifications")
