# NagarAI — Civic Complaint Intelligence Engine (PS-S05)
## Execution & Usage Guide

### 🚀 1. One-Click Launch (Recommended)

Start the entire stack (PostgreSQL + PostGIS + pgvector, Python FastAPI ML Backend on `:8000`, and React 19 Frontend on `:5173`) with a single command:

```bash
chmod +x start_dev.sh
./start_dev.sh
```

Then open your browser at:
- 👉 **Web Application**: [http://localhost:5173](http://localhost:5173)
- 👉 **Backend API Documentation**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

### 🛠️ 2. Manual Startup Workflow

#### Terminal 1 — Database & Python ML Backend:
```bash
# 1. Start PostgreSQL with PostGIS + pgvector (via Docker)
docker run -d --name nagarai-postgres -p 5432:5432 \
  -e POSTGRES_DB=nagarai \
  -e POSTGRES_USER=nagarai \
  -e POSTGRES_PASSWORD=nagarai_dev \
  postgis/postgis:16-3.4

# 2. Activate virtual environment & seed initial dataset
source venv/bin/activate
export DATABASE_URL="postgresql://nagarai:nagarai_dev@localhost:5432/nagarai"
python db_setup.py

# 3. Start the Unified FastAPI Backend
python unified_server.py
# Running on http://127.0.0.1:8000
```

#### Terminal 2 — Modern React 19 Frontend:
```bash
cd "nagarai-—-civic-complaint-intelligence-engine (1)"
npm install
npm run dev
# Running on http://localhost:5173 (proxies /api requests to http://127.0.0.1:8000)
```

---

### 🌟 3. Testing Features in the React UI

1. **👑 Quick Officer Login**:
   - Access the **War Room Dashboard** with live Leaflet GIS maps, priority-ranked work orders, and department filters.
   - Inspect the **Live Wire Hazard** (Priority 157) near Kendriya Vidyalaya School and click **Dispatch Crew** to deploy an emergency squad.
   - Click **Verify & Resolve** to test AI visual proof verification and celebrate with confetti.
   - Click the **15-Complaint Benchmark** tab to run the full hackathon evaluation.
   - Click the **Priority Formula** tab to simulate scores with custom weight sliders.

2. **👤 Quick Citizen Login**:
   - Access the **Citizen Grievance Portal** with 5-step grievance submission:
     - **Step 1**: Choose Voice, Photo, or Text modality.
     - **Step 2**: GPS location auto-pinning.
     - **Step 3**: Category selection.
     - **Step 4**: Language selection (Tamil, Hindi, Telugu, Marathi, English).
     - **Step 5**: Instant grievance filing.
   - Inspect filed tickets in **My Complaints** and vote to **Confirm** or **Dispute** resolved repairs.

---

### 💻 4. Command-Line Interface (CLI) & Test Tools

#### Live 15-Complaint Judging Evaluation:
```bash
source venv/bin/activate
python test_15_complaints_judging.py
```

#### Standalone PyTest Suite:
```bash
source venv/bin/activate
python -m pytest test_pipeline.py test_audio.py -v
```

#### Ingest Custom Complaint via CLI:
```bash
source venv/bin/activate
# Text
python run_my_complaint.py --text "Deep dangerous pothole on Anna Salai" --lat 13.0645 --lon 80.2642

# Voice Audio
python run_my_complaint.py --audio "path/to/speech.wav" --lat 13.0645 --lon 80.2642

# Image
python run_my_complaint.py --image "path/to/pothole.jpg" --lat 13.0645 --lon 80.2642
```

#### Standalone HTML Browser Testbenches:
Directly test local ML inference endpoints via static HTML test harnesses on `http://127.0.0.1:8000`:
- `voice_test.html` — Live microphone recording & Whisper ASR testing
- `photo_test.html` — Drag-and-drop image upload & CLIP classification testing
- `text_test.html` — Multilingual NLP parsing and embedding testing
