-- PostgreSQL + PostGIS + pgvector Schema Script
-- PS-S05: NagarAI Civic Complaint Intelligence Engine

-- 1. Enable Extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Create Master Clusters Table
CREATE TABLE IF NOT EXISTS clusters (
    id VARCHAR(64) PRIMARY KEY,
    center_location GEOMETRY(Point, 4326),
    center_lat DOUBLE PRECISION NOT NULL,
    center_lng DOUBLE PRECISION NOT NULL,
    category VARCHAR(64) NOT NULL DEFAULT 'other',
    severity INT NOT NULL DEFAULT 3,
    summary TEXT,
    affected_citizens INT NOT NULL DEFAULT 1,
    priority_score DOUBLE PRECISION NOT NULL DEFAULT 50.0,
    is_sensitive_location BOOLEAN DEFAULT FALSE,
    assigned_department VARCHAR(128) DEFAULT 'Municipal Services',
    sla_hours INT DEFAULT 24,
    status VARCHAR(32) NOT NULL DEFAULT 'SUBMITTED',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create Raw Complaints Ingestion Table
CREATE TABLE IF NOT EXISTS complaints (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL DEFAULT 'anonymous',
    gps_location GEOMETRY(Point, 4326),
    gps_lat DOUBLE PRECISION NOT NULL,
    gps_lng DOUBLE PRECISION NOT NULL,
    audio_url VARCHAR(512),
    image_url VARCHAR(512),
    raw_text TEXT,
    summary TEXT,
    category VARCHAR(64),
    severity INT,
    text_embedding vector(384),
    image_embedding vector(512),
    cluster_id VARCHAR(64) REFERENCES clusters(id) ON DELETE SET NULL,
    is_sensitive_location BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create Spatial GIST Indexes for Fast 50m ST_DWithin Radius Queries
CREATE INDEX IF NOT EXISTS idx_clusters_location ON clusters USING GIST (center_location);
CREATE INDEX IF NOT EXISTS idx_complaints_location ON complaints USING GIST (gps_location);

-- 5. Create HNSW Vector Similarity Indexes (Cosine Distance)
CREATE INDEX IF NOT EXISTS idx_complaints_text_vector ON complaints USING hnsw (text_embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_complaints_image_vector ON complaints USING hnsw (image_embedding vector_cosine_ops);
