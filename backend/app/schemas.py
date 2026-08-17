from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field

class HealthResponse(BaseModel):
    status: str = "ok"
    hasGeminiKey: bool = False
    clusterCount: int = 0
    complaintCount: int = 0
    database_connected: bool = True
    message: str = "NagarAI Civic Intelligence Engine operational"

class LandmarkPOISchema(BaseModel):
    name: str
    type: str
    distanceMeters: int
    coordinates: Optional[Dict[str, float]] = None

class VisionAnalysisSchema(BaseModel):
    detectedObjects: List[str] = []
    hazardCategory: str = "pothole"
    severityRating: int = 3
    extentDescription: str = ""
    hazardConfidence: float = 0.85
    isHazardousToLife: bool = False
    autoRotated: Optional[bool] = False

class StructuredComplaintSchema(BaseModel):
    id: str
    ticketNumber: str
    timestamp: str
    citizenName: str
    citizenPhone: str
    language: str = "ta"
    originalInputType: str = "text"
    rawInputText: Optional[str] = None
    audioUrl: Optional[str] = None
    photoUrl: Optional[str] = None
    category: str
    severity: int = 3
    cleanDescription: str
    locationName: str
    coordinates: Dict[str, float]
    ward: str
    department: str
    nearbyLandmarks: List[Dict[str, Any]] = []
    visionAnalysis: Optional[Dict[str, Any]] = None
    clusterId: Optional[str] = None
    isDuplicate: Optional[bool] = False
    embedding: Optional[List[float]] = None
    transcription: Optional[str] = None

class PriorityBreakdownSchema(BaseModel):
    severityScore: float
    citizenMultiplier: float
    agingScore: float
    proximityBoost: float
    lifeThreatMultiplier: float
    totalScore: float
    formulaString: str
    explanation: str

class ResolutionDataSchema(BaseModel):
    resolvedAt: str
    resolutionNotes: str
    beforePhotoUrl: Optional[str] = None
    afterPhotoUrl: Optional[str] = None
    aiVerificationScore: float = 95.0
    aiVerificationSummary: str = "Visual inspection confirmed defect resolved"
    statusVerified: bool = True
    citizenConfirmations: Dict[str, int] = {"confirmed": 1, "disputed": 0, "total": 1}

class FieldCrewSchema(BaseModel):
    crewId: str
    name: str
    department: str
    contact: str
    vehicleNumber: str
    status: str = "available"

class MasterClusterSchema(BaseModel):
    id: str
    clusterCode: str
    title: str
    category: str
    department: str
    ward: str
    locationName: str
    coordinates: Dict[str, float]
    centroidRadiusMeters: int = 30
    status: str = "pending"
    slaHours: int = 24
    reportedAt: str
    daysPending: float = 0.0
    affectedCitizenCount: int = 1
    baseSeverity: int = 3
    priorityScore: float
    priorityBreakdown: PriorityBreakdownSchema
    complaints: List[StructuredComplaintSchema] = []
    assignedCrew: Optional[FieldCrewSchema] = None
    resolution: Optional[ResolutionDataSchema] = None
    activityLogs: List[Dict[str, Any]] = []

class CitizenNotificationSchema(BaseModel):
    id: str
    citizenPhone: Optional[str] = None
    recipientPhone: Optional[str] = None
    citizenName: Optional[str] = None
    clusterCode: str
    ticketNumber: Optional[str] = None
    channel: Optional[str] = "sms"
    type: str
    message: str
    timestamp: Optional[str] = None
    sentAt: Optional[str] = None
    status: Optional[str] = "delivered"
    actionTaken: Optional[str] = None

class OfficerNotificationSchema(BaseModel):
    id: str
    clusterId: Optional[str] = None
    clusterCode: str
    title: str
    department: str
    priorityScore: float
    severity: int
    type: str
    message: str
    timestamp: str
    ward: Optional[str] = "Unassigned Ward"
    locationName: Optional[str] = "Municipal Ward"
    actionRequired: Optional[bool] = True

# Request Payloads
class TranscribeVoiceRequest(BaseModel):
    audioBase64: str
    audioMimeType: Optional[str] = "audio/wav"
    languageHint: Optional[str] = "ta"

class TranscribeAndExtractRequest(BaseModel):
    rawText: Optional[str] = None
    audioBase64: Optional[str] = None
    audioMimeType: Optional[str] = "audio/wav"
    imageBase64: Optional[str] = None
    imageMimeType: Optional[str] = "image/jpeg"
    inputLanguage: Optional[str] = "ta"
    originalInputType: Optional[str] = "text"
    citizenName: Optional[str] = "Anonymous"
    citizenPhone: Optional[str] = ""
    locationName: Optional[str] = "Municipal Ward"
    gpsCoordinates: Optional[Dict[str, float]] = None
    category: Optional[str] = None
    transcription: Optional[str] = None

class DispatchCrewRequest(BaseModel):
    crewId: str

class VerifyAndResolveRequest(BaseModel):
    afterPhotoBase64: Optional[str] = None
    resolutionNotes: Optional[str] = ""

class NotificationVoteRequest(BaseModel):
    notificationId: Optional[str] = None
    vote: str = "confirmed"  # 'confirmed' | 'disputed'
