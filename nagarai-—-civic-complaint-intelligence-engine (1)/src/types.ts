export type ComplaintCategory =
  | 'pothole'
  | 'garbage_dump'
  | 'live_wire_hazard'
  | 'broken_streetlight'
  | 'open_manhole'
  | 'waterlogging'
  | 'water_leakage'
  | 'fallen_tree'
  | 'sewage_overflow';

export type Department =
  | 'Roads & PWD'
  | 'Solid Waste Management'
  | 'Electricity & Power'
  | 'Water Supply & Drainage'
  | 'Urban Forestry & Disaster';

export type ClusterStatus = 'pending' | 'dispatched' | 'in_progress' | 'resolved' | 'reopened';

export interface LandmarkPOI {
  name: string;
  type: 'school' | 'hospital' | 'metro' | 'market' | 'temple';
  distanceMeters: number;
  coordinates?: { lat: number; lng: number };
}

export interface VisionAnalysis {
  detectedObjects: string[];
  hazardCategory: ComplaintCategory;
  severityRating: number; // 1 to 5
  extentDescription: string;
  hazardConfidence: number; // 0 to 1
  isHazardousToLife: boolean;
  autoRotated?: boolean;
}

export interface StructuredComplaint {
  id: string;
  ticketNumber: string;
  timestamp: string;
  citizenName: string;
  citizenPhone: string;
  language: string;
  originalInputType: 'voice' | 'photo' | 'text' | 'multimodal';
  rawInputText?: string;
  audioUrl?: string;
  photoUrl?: string;
  category: ComplaintCategory;
  severity: number; // 1-5
  cleanDescription: string;
  locationName: string;
  coordinates: { lat: number; lng: number };
  ward: string;
  department: Department;
  nearbyLandmarks: LandmarkPOI[];
  visionAnalysis?: VisionAnalysis;
  clusterId?: string;
  isDuplicate?: boolean;
  embedding?: number[];
  transcription?: string;
}

export interface PriorityBreakdown {
  severityScore: number;
  citizenMultiplier: number;
  agingScore: number;
  proximityBoost: number;
  lifeThreatMultiplier: number;
  totalScore: number;
  formulaString: string;
  explanation: string;
}

export interface ResolutionData {
  resolvedAt: string;
  resolutionNotes: string;
  beforePhotoUrl?: string;
  afterPhotoUrl?: string;
  aiVerificationScore: number; // 0-100%
  aiVerificationSummary: string;
  statusVerified: boolean;
  citizenConfirmations: {
    confirmed: number;
    disputed: number;
    total: number;
  };
}

export interface FieldCrew {
  crewId: string;
  name: string;
  department: Department;
  contact: string;
  vehicleNumber: string;
  status: 'available' | 'on_duty' | 'dispatched';
}

export interface MasterCluster {
  id: string;
  clusterCode: string;
  title: string;
  category: ComplaintCategory;
  department: Department;
  ward: string;
  locationName: string;
  coordinates: { lat: number; lng: number };
  centroidRadiusMeters: number;
  status: ClusterStatus;
  slaHours: number;
  reportedAt: string;
  daysPending: number;
  affectedCitizenCount: number;
  baseSeverity: number;
  priorityScore: number;
  priorityBreakdown: PriorityBreakdown;
  complaints: StructuredComplaint[];
  assignedCrew?: FieldCrew;
  resolution?: ResolutionData;
  isVolunteerResolvable?: boolean;
  volunteerTask?: VolunteerTask;
  activityLogs: Array<{
    timestamp: string;
    action: string;
    actor: string;
    details?: string;
  }>;
}

export interface VolunteerTask {
  id: string;
  clusterId: string;
  clusterCode: string;
  title: string;
  category: ComplaintCategory;
  locationName: string;
  ward: string;
  severity: number; // 1 or 2
  difficulty: 'Easy' | 'Moderate';
  estimatedMinutes: number; // e.g. 15, 30, 45
  karmaPoints: number; // e.g. 50, 100, 150
  status: 'open_for_volunteers' | 'in_progress' | 'volunteer_resolved';
  description?: string;
  toolsRecommended?: string[];
  pledgedVolunteers: Array<{
    name: string;
    phone: string;
    pledgedAt: string;
  }>;
  resolvedBy?: {
    volunteerName: string;
    volunteerPhone: string;
    resolvedAt: string;
    beforePhotoUrl?: string;
    afterPhotoUrl?: string;
    notes?: string;
    aiVerificationScore?: number;
  };
}

export interface BenchmarkTestCase {
  id: string;
  expectedClusterId: string;
  citizenName: string;
  language: string;
  modality: 'voice' | 'photo' | 'text' | 'multimodal';
  rawText: string;
  sampleAudioPreset?: string;
  photoUrl?: string;
  category: ComplaintCategory;
  locationName: string;
  coordinates: { lat: number; lng: number };
  severity: number;
  notes: string;
}

export interface CitizenNotification {
  id: string;
  citizenPhone?: string;
  recipientPhone?: string;
  citizenName?: string;
  clusterCode: string;
  ticketNumber?: string;
  channel?: 'sms' | 'whatsapp';
  type: 'intake_received' | 'merged' | 'dispatched' | 'resolved' | 'verification_request';
  message: string;
  timestamp?: string;
  sentAt?: string;
  status?: 'sent' | 'delivered' | 'read';
  actionTaken?: 'confirmed' | 'disputed';
}

export interface OfficerNotification {
  id: string;
  clusterId?: string;
  clusterCode: string;
  title: string;
  department: string;
  priorityScore: number;
  severity: number;
  type: 'critical_emergency' | 'crew_dispatched' | 'cluster_merged' | 'resolution_pending' | 'sla_warning' | 'zonal_alert';
  message: string;
  timestamp: string;
  ward?: string;
  locationName?: string;
  actionRequired?: boolean;
}

export interface OfficerQualification {
  id: string;
  name: string;
  role: string;
  department: string;
  zonalAuthority: string;
  clearanceLevel: string;
  certifications: string[];
  authorizedActions: string[];
}

export type VolunteerSkillCategory =
  | 'waste_segregation'
  | 'drain_clearing'
  | 'tree_pruning'
  | 'pothole_filling'
  | 'street_painting'
  | 'electrical_inspection'
  | 'traffic_control'
  | 'public_awareness';

export interface VolunteerUser {
  id: string;
  name: string;
  phone: string;
  ward: string;
  karmaPoints: number;
  badges: string[];
  skills: VolunteerSkillCategory[];
  tasksCompletedCount: number;
}

export interface CitizenUser {
  id: string;
  name: string;
  phone: string;
  ward?: string;
}

export interface OfficerUser {
  id: string;
  name: string;
  phone?: string;
  role: string;
  department: string;
  ward?: string;
  division?: string;
}

