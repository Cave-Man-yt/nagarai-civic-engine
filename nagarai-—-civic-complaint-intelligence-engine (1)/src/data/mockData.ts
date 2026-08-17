import { 
  BenchmarkTestCase, 
  Department, 
  FieldCrew, 
  MasterCluster, 
  VolunteerTask, 
  CitizenNotification, 
  OfficerNotification, 
  OfficerQualification, 
  VolunteerUser, 
  VolunteerSkillCategory 
} from '../types';

export const CIVIC_DEPARTMENTS: Department[] = [
  'Roads & PWD',
  'Solid Waste Management',
  'Electricity & Power',
  'Water Supply & Drainage',
  'Urban Forestry & Disaster',
];

export const CIVIC_WARDS = [
  'Ward 4 - Anna Nagar',
  'Ward 7 - T. Nagar Commercial',
  'Ward 8 - Ring Road Residential',
  'Ward 12 - George Town & Central',
  'Ward 15 - Mylapore Heritage',
];

export const INITIAL_FIELD_CREWS: FieldCrew[] = [];

export const SAMPLE_CIVIC_PHOTOS: Record<string, string> = {
  pothole_crater: '',
  pothole_sideways: '',
  live_wire: '',
  garbage_dump: '',
  open_manhole: '',
  waterlogging: '',
  resolved_road: '',
  resolved_garbage: '',
};

export const BENCHMARK_15_COMPLAINTS: BenchmarkTestCase[] = [];

export function getInitialSeedClusters(): MasterCluster[] {
  return [];
}

export const INITIAL_SEED_CLUSTERS: MasterCluster[] = [];
export const INITIAL_CREWS: FieldCrew[] = [];
export const INITIAL_VOLUNTEER_TASKS: VolunteerTask[] = [];
export const INITIAL_CITIZEN_NOTIFICATIONS: CitizenNotification[] = [];
export const INITIAL_OFFICER_NOTIFICATIONS: OfficerNotification[] = [];

export const OFFICER_QUALIFICATION_DATA: OfficerQualification = {
  id: '',
  name: '',
  role: 'Municipal Officer',
  department: 'Municipal Corporation',
  zonalAuthority: 'Central Division',
  clearanceLevel: 'Municipal Dispatch Authority',
  certifications: [],
  authorizedActions: [
    'Fast-Track Dispatch',
    'Inter-Department Crew Allocation',
    'Work Order Authorization',
    'AI Resolution Verification Sign-Off'
  ]
};

export const VOLUNTEER_SKILL_OPTIONS: Array<{
  id: VolunteerSkillCategory;
  name: string;
  label: string;
  icon: string;
  description: string;
}> = [
  { id: 'waste_segregation', name: 'Waste Segregation & De-littering', label: 'Waste Segregation', icon: '♻️', description: 'Park, sidewalk and neighborhood clean-up drives' },
  { id: 'drain_clearing', name: 'Surface Drain & Gutter Clearing', label: 'Drain Clearing', icon: '🧹', description: 'Removing plastic and dry leaves from stormwater grates' },
  { id: 'tree_pruning', name: 'Light Branch Pruning & Fallen Twigs', label: 'Tree Pruning', icon: '🌿', description: 'Clearing walkways of fallen light branches and vegetation' },
  { id: 'pothole_filling', name: 'Cold-Mix Asphalt Patching', label: 'Pothole Patching', icon: '🕳️', description: 'Fixing small pedestrian pathway potholes with cold gravel' },
  { id: 'street_painting', name: 'Civic Signboard Restoration', label: 'Signboard Painting', icon: '🎨', description: 'Removing illegal posters and repainting speed breaker stripes' },
  { id: 'electrical_inspection', name: 'Non-Hazard Streetlight Audits', label: 'Streetlight Audits', icon: '💡', description: 'Reporting flickering residential bulbs and broken globes' },
  { id: 'traffic_control', name: 'School Zone Crosswalk Assistance', label: 'Crosswalk Assistance', icon: '🚸', description: 'Helping children cross safely near civic repairs' },
  { id: 'public_awareness', name: 'Citizen Awareness & Feedback Outreach', label: 'Public Awareness', icon: '📢', description: 'Surveying residents on completed municipal repairs' },
];

export const SAMPLE_EXISTING_VOLUNTEERS: VolunteerUser[] = [];



