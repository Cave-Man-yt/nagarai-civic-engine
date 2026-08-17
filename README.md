# NagarAI: Civic Complaint Intelligence Engine (PS-S05)

![NagarAI Logo](nagarai-—-civic-complaint-intelligence-engine%20(1)/src/assets/images/nagar_ai_logo_1786970773414.jpg)

An intelligent, multimodal civic grievance ingestion, spatio-semantic deduplication, and explainable prioritization platform. NagarAI empowers citizens to report civic defects (potholes, live wire hazards, garbage dumps, open manholes, waterlogging) using native voice audio (Tamil, Hindi, Telugu, Marathi, English), camera photos, or multilingual text, and uses local computer vision, ASR, NLP embeddings, and geospatial database indexing to eliminate duplicate work orders and prioritize life-critical hazards for municipal command centers.

---

## 🌟 Key Architecture & Capabilities

1. **Multimodal Citizen Ingestion**:
   - **Voice ASR**: Local Whisper (`openai/whisper-tiny`) & IndicConformer models for multilingual speech-to-text with code-switching (Tanglish, Hinglish).
   - **Computer Vision (Zero-Shot)**: OpenAI CLIP (`ViT-B/32`) and Ultralytics YOLOv8 for orientation-invariant civic defect classification and 512-dim visual embeddings.
   - **Multilingual NLP**: SentenceTransformers (`all-MiniLM-L6-v2`) generating 384-dimensional text embeddings for semantic similarity matching.
2. **Spatio-Semantic Deduplication Engine**:
   - PostgreSQL **PostGIS** spatial indexing (`ST_DistanceSphere` within 250m radius).
   - **pgvector** HNSW cosine similarity search ($\ge 0.70$ or keyword overlap $\ge 0.18$) merging duplicate neighborhood reports into unified Master Clusters.
   - Dynamic geometric centroid calculation and spread radius visualization (30m–250m).
3. **Explainable, Game-Resistant Priority Formula**:
   $$\text{Priority Score} = \left[ (\text{Severity} \times 15) + (\ln(\text{Affected Citizens} + 1) \times 14) + (\text{Days Pending} \times 5) + \text{Proximity Boost} \right] \times \text{Life Hazard Multiplier}$$
   - **Proximity Boosts**: Hospitals $\le 500\text{m}$ (+25 pts), Schools $\le 300\text{m}$ (+18 pts), Metro/Transit hubs $\le 250\text{m}$ (+10 pts), capped at +35 pts.
   - **Life Hazard Multiplier**: $1.4\times$ multiplier for electrocution hazards (`live_wire_hazard`), open sewer manholes (`open_manhole`), fallen trees (`fallen_tree`), and structural collapses.
4. **Interactive 2-Role Unified UI**:
   - **Citizen Grievance Portal**: 5-step intuitive filing wizard, browser speech dictation, live SMS/WhatsApp notification feed, and resolution confirmation voting.
   - **Officer Command & War Room**: Real-time Leaflet GIS map with color-coded severity markers, radar pulse on life hazards, 1-click crew dispatch, transparent math inspector, and closed-loop AI photo verification.
   - **15-Complaint Judging Benchmark Suite**: End-to-end evaluation suite demonstrating 66.7% municipal backlog reduction.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend UI** | React 19, TypeScript, Vite, Tailwind CSS v4, Leaflet GIS, Lucide Icons, Motion, Canvas-Confetti |
| **Backend ML & API** | Python 3.10+, FastAPI, Uvicorn, PyTorch, Transformers, OpenAI CLIP, YOLOv8, SoundFile, FFmpeg |
| **Vector & Geospatial DB** | PostgreSQL 16, PostGIS 3.4 (`GEOMETRY(Point, 4326)`), pgvector 0.8.6 (`vector(384)`, `vector(512)`) |
| **Dev Orchestration** | Docker, Docker Compose, Bash startup automation |

---

## 🚀 Quick Start Guide

### Option 1: One-Click Startup (Recommended)

Run the automated startup script which launches PostgreSQL, initializes schema, seeds demo clusters, and starts both backend (:8000) and frontend (:5173):

```bash
chmod +x start_dev.sh
./start_dev.sh
```

- **React Web Application**: [http://localhost:5173](http://localhost:5173)
- **FastAPI Backend Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

### Option 2: Manual Step-by-Step Setup

#### Step 1: Start PostgreSQL + PostGIS + pgvector

Using Docker:
```bash
docker run -d --name nagarai-postgres -p 5432:5432 \
  -e POSTGRES_DB=nagarai \
  -e POSTGRES_USER=nagarai \
  -e POSTGRES_PASSWORD=nagarai_dev \
  postgis/postgis:16-3.4

# Install pgvector inside container
docker exec -u 0 nagarai-postgres bash -c "apt-get update && apt-get install -y postgresql-16-pgvector"
docker exec nagarai-postgres psql -U nagarai -d nagarai -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

#### Step 2: Set Up Python Virtual Environment & Install Dependencies

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

> **Note**: Ensure `ffmpeg` is installed on your operating system for audio conversion:
> - **Ubuntu/Debian**: `sudo apt-get install -y ffmpeg`
> - **macOS**: `brew install ffmpeg`
> - **Arch Linux**: `sudo pacman -S ffmpeg`

#### Step 3: Initialize Database Schema & Seed Data

```bash
export DATABASE_URL="postgresql://nagarai:nagarai_dev@localhost:5432/nagarai"
python db_setup.py
```

#### Step 4: Start Python ML FastAPI Backend

```bash
python unified_server.py
# Backend runs on http://127.0.0.1:8000
```

#### Step 5: Start React Frontend

In a new terminal:
```bash
cd "nagarai-—-civic-complaint-intelligence-engine (1)"
npm install
npm run dev
# Frontend runs on http://localhost:5173 (proxies /api requests to :8000)
```

---

## 📋 Comprehensive API Reference

The unified backend exposes 12 REST endpoints matching the React frontend contract:

| # | Endpoint | Method | Description |
|---|---|---|---|
| 1 | `GET /api/health` | `GET` | System health check and cluster/complaint counts. |
| 2 | `GET /api/clusters` | `GET` | Retrieves all active master clusters and field repair crews. |
| 3 | `GET /api/crews` | `GET` | Retrieves rapid-response field crews with dispatch status. |
| 4 | `GET /api/notifications?phone=...` | `GET` | Citizen SMS / WhatsApp notification stream. |
| 5 | `GET /api/officer-notifications` | `GET` | Officer tactical emergency and dispatch alerts feed. |
| 6 | `POST /api/gemini/transcribe-voice` | `POST` | Local Whisper STT converting audio base64 to text. |
| 7 | `POST /api/gemini/transcribe-and-extract` | `POST` | Core multimodal ingestion, CLIP vision classification, NLP embedding, and PostGIS deduplication. |
| 8 | `POST /api/clusters/{id}/dispatch` | `POST` | Assigns municipal field crew and triggers citizen SMS dispatch alert. |
| 9 | `POST /api/clusters/{id}/verify-and-resolve` | `POST` | Closed-loop AI photo verification and resolution sign-off. |
| 10 | `POST /api/notifications/vote` | `POST` | Citizen resolution confirmation or dispute vote. |
| 11 | `POST /api/benchmark/run-15-test` | `POST` | Executes standard 15-complaint hackathon judging evaluation. |
| 12 | `POST /api/clear` & `POST /api/reset` | `POST` | Wipes database to zero (`/clear`) or restores sample clusters (`/reset`). |

---

## 🧪 Testing & Evaluation

### Run End-to-End Test Suite
```bash
source venv/bin/activate
python -m pytest test_pipeline.py test_audio.py -v
```

### Run Benchmark 15-Complaint Evaluation
```bash
python test_15_complaints_judging.py
```

### Direct Multimodal Browser Testbenches
Open standalone test harnesses in your browser (connecting directly to `http://127.0.0.1:8000/api/complaint/submit`):
- `voice_test.html` — Live microphone recording & Whisper ASR testing
- `photo_test.html` — Drag-and-drop image upload & CLIP classification testing
- `text_test.html` — Multilingual Tamil/Hindi/English NLP extraction testing

---

## 👥 User Roles & Walkthrough

1. **👑 Quick Admin Login**:
   - Opens the **Officer War Room** with Leaflet GIS Map, live KPI cards, category filters, and priority queues.
   - Click on the high-voltage hazard near Kendriya Vidyalaya School (Priority 157) to inspect the **Geo Bonus Analysis** and dispatch an emergency squad.
   - Switch to the **15-Complaint Benchmark** tab to run the automated deduplication evaluation.
   - Inspect the **Priority Formula Sandbox** to experiment with mathematical weight sliders.
2. **👤 Quick Citizen Login**:
   - Opens the **Citizen Grievance Portal** with step-by-step reporting (Voice dictation, photo upload, GPS coordinates).
   - View filed tickets in **My Complaints**, inspect before/after resolution photos, and vote to Confirm or Dispute repairs.

---

## 📄 License & Attribution
Built for the NagarAI Civic Complaint Intelligence Engine Hackathon (PS-S05).
