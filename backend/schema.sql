-- PostgreSQL + PostGIS + pgvector Schema Script
-- PS-S05: NagarAI Civic Complaint Intelligence Engine

-- 1. Enable Extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Create Field Crews Table
CREATE TABLE IF NOT EXISTS field_crews (
    crew_id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    department VARCHAR(128) NOT NULL DEFAULT 'Roads & PWD',
    contact VARCHAR(32) NOT NULL DEFAULT '',
    vehicle_number VARCHAR(32) NOT NULL DEFAULT '',
    status VARCHAR(32) NOT NULL DEFAULT 'available'
);

-- 3. Create Master Clusters Table
CREATE TABLE IF NOT EXISTS clusters (
    id VARCHAR(64) PRIMARY KEY,
    cluster_code VARCHAR(32),
    title TEXT,
    location_name TEXT DEFAULT 'Municipal Ward',
    ward VARCHAR(64) DEFAULT 'Unassigned Ward',
    center_location GEOMETRY(Point, 4326),
    center_lat DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    center_lng DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    centroid_radius_meters INT DEFAULT 30,
    category VARCHAR(64) NOT NULL DEFAULT 'pothole',
    severity INT NOT NULL DEFAULT 3,
    summary TEXT,
    affected_citizens INT NOT NULL DEFAULT 1,
    priority_score DOUBLE PRECISION NOT NULL DEFAULT 50.0,
    is_sensitive_location BOOLEAN DEFAULT FALSE,
    assigned_department VARCHAR(128) DEFAULT 'Roads & PWD',
    sla_hours INT DEFAULT 24,
    status VARCHAR(32) NOT NULL DEFAULT 'pending',
    days_pending DOUBLE PRECISION DEFAULT 0.0,
    assigned_crew_id VARCHAR(64) REFERENCES field_crews(crew_id) ON DELETE SET NULL,
    priority_breakdown JSONB,
    resolution_data JSONB,
    activity_logs JSONB DEFAULT '[]',
    reported_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create Raw Complaints Ingestion Table
CREATE TABLE IF NOT EXISTS complaints (
    id VARCHAR(64) PRIMARY KEY,
    ticket_number VARCHAR(32),
    user_id VARCHAR(64) NOT NULL DEFAULT 'anonymous',
    citizen_name VARCHAR(128) DEFAULT 'Anonymous',
    citizen_phone VARCHAR(32) DEFAULT '',
    input_language VARCHAR(16) DEFAULT 'ta',
    original_input_type VARCHAR(16) DEFAULT 'text',
    transcription TEXT,
    gps_location GEOMETRY(Point, 4326),
    gps_lat DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    gps_lng DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    location_name TEXT DEFAULT 'Municipal Ward',
    ward VARCHAR(64) DEFAULT 'Unassigned Ward',
    department VARCHAR(128) DEFAULT 'Roads & PWD',
    audio_url VARCHAR(512),
    image_url VARCHAR(512),
    photo_url VARCHAR(512),
    raw_text TEXT,
    summary TEXT,
    clean_description TEXT,
    category VARCHAR(64) DEFAULT 'pothole',
    severity INT DEFAULT 3,
    nearby_landmarks JSONB DEFAULT '[]',
    text_embedding vector(384),
    image_embedding vector(512),
    cluster_id VARCHAR(64) REFERENCES clusters(id) ON DELETE SET NULL,
    is_duplicate BOOLEAN DEFAULT FALSE,
    is_sensitive_location BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Create Citizen Notifications Table
CREATE TABLE IF NOT EXISTS citizen_notifications (
    id VARCHAR(64) PRIMARY KEY,
    cluster_id VARCHAR(64) REFERENCES clusters(id) ON DELETE CASCADE,
    cluster_code VARCHAR(32),
    ticket_number VARCHAR(32),
    recipient_name VARCHAR(128) DEFAULT 'Citizen',
    recipient_phone VARCHAR(32) DEFAULT '',
    channel VARCHAR(16) DEFAULT 'sms',
    type VARCHAR(32) NOT NULL DEFAULT 'intake_received',
    message TEXT NOT NULL,
    status VARCHAR(32) DEFAULT 'delivered',
    action_taken VARCHAR(16),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Create Officer Notifications Table
CREATE TABLE IF NOT EXISTS officer_notifications (
    id VARCHAR(64) PRIMARY KEY,
    cluster_id VARCHAR(64) REFERENCES clusters(id) ON DELETE CASCADE,
    cluster_code VARCHAR(32),
    title VARCHAR(256) NOT NULL,
    department VARCHAR(128) DEFAULT 'Roads & PWD',
    priority_score DOUBLE PRECISION NOT NULL DEFAULT 50.0,
    severity INT NOT NULL DEFAULT 3,
    type VARCHAR(32) NOT NULL DEFAULT 'critical_emergency',
    message TEXT NOT NULL,
    ward VARCHAR(64) DEFAULT 'Unassigned Ward',
    location_name TEXT DEFAULT 'Municipal Ward',
    action_required BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Spatial GIST Indexes for Fast Radius Queries
CREATE INDEX IF NOT EXISTS idx_clusters_location ON clusters USING GIST (center_location);
CREATE INDEX IF NOT EXISTS idx_complaints_location ON complaints USING GIST (gps_location);

-- 8. HNSW Vector Similarity Indexes (Cosine Distance)
CREATE INDEX IF NOT EXISTS idx_complaints_text_vector ON complaints USING hnsw (text_embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_complaints_image_vector ON complaints USING hnsw (image_embedding vector_cosine_ops);
