# NagarAI: Civic Complaint Intelligence Engine (PS-S05)

![NagarAI Logo](src/assets/images/nagar_ai_logo_1786970773414.jpg)

An intelligent, multimodal civic complaint ingestion and deduplication engine. NagarAI empowers citizens to report civic issues (like potholes, garbage dumps, broken streetlights) using voice, text, or photos, and uses advanced AI to automatically classify, prioritize, and deduplicate complaints for municipal authorities.

## 🌟 Key Features

1. **Multimodal Ingestion**: Submit complaints via Text, Voice (Multilingual), or Image.
2. **Audio Processing (ASR)**: Uses OpenAI Whisper for speech-to-text conversion.
3. **Visual Intelligence (Zero-Shot)**: Uses OpenAI CLIP (ViT-B/32) and YOLOv8 to automatically detect and classify civic issues from photos (e.g., classifying an image as a "pothole" or "waterlogging").
4. **Semantic NLP Extraction**: Uses `all-MiniLM-L6-v2` SentenceTransformers to generate 384-dimensional embeddings of complaint text.
5. **Spatial & Semantic Deduplication**: Groups identical complaints into "Master Clusters" using a combination of **Haversine GPS distance** (< 50 meters) and **Cosine Similarity** (> 0.80) to prevent duplicate dispatching.
6. **Smart Priority Scoring**: Assigns a dynamic priority score (0-100) based on severity, number of affected citizens (cluster size), and sensitive locations (near schools/hospitals).
7. **Interactive Dashboards**: 
   - **Citizen Portal**: Easily submit complaints.
   - **Officer GIS Dashboard**: View deduplicated clusters, heatmaps, and priority queues.

## 🛠️ Technology Stack

### Frontend
- **React 19** with TypeScript
- **Vite** & Bun
- Vanilla CSS (Glassmorphism & Neumorphism design)

### Backend (ML Engine & API)
- **FastAPI** (Python 3.10+)
- **PyTorch** & **HuggingFace Transformers**
- **OpenAI CLIP** & **Ultralytics YOLOv8**
- **FFmpeg** (Audio processing pipeline)

### Database (Required)
- **PostgreSQL**
- **PostGIS** extension (for Spatial `ST_DWithin` queries)
- **pgvector** extension (for HNSW Cosine distance matching)

## 🚀 Getting Started

### 1. Database Setup
You must have a PostgreSQL database with `postgis` and `vector` extensions installed.
You can run it locally via Docker:
```bash
docker run --name nagarai-db -e POSTGRES_PASSWORD=mysecretpassword -p 5432:5432 -d ankane/pgvector
```
Then, execute the `backend/schema.sql` script to set up the tables and indexes.

### 2. Backend (ML Engine) Setup
Navigate to the root directory and install dependencies:
```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

**Note**: You must have `ffmpeg` installed on your system for audio conversions.
```bash
# macOS
brew install ffmpeg
```

Run the FastAPI backend:
```bash
python server.py
# Server runs on http://127.0.0.1:8000
```

### 3. Frontend Setup
Navigate to the frontend directory:
```bash
npm install
# or
bun install
```

Start the Vite dev server:
```bash
npm run dev
# Server runs on http://localhost:3000
```

## 🧪 Interactive Testing Portals

You can test the individual AI components locally:
- **Voice Intelligence Test**: `voice_test.html` (Run a local python server `python3 -m http.server 9999` and navigate to `http://localhost:9999/voice_test.html`)
- **Text/NLP Intelligence Test**: `text_test.html`
- **Vision AI Classification Test**: `photo_test.html`

## 📋 API Endpoints

- `POST /api/complaint/submit`: Accepts `raw_text`, `latitude`, `longitude`, `audio_file`, `image_file`.
- `GET /api/clusters`: Retrieves all master civic issue clusters.
- `POST /api/reset`: Wipes the database for fresh testing.

## 📄 License
This project was built for the NagarAI Hackathon (PS-S05).
