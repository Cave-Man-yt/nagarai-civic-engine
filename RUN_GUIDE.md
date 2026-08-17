# NagarAI — Civic Complaint Intelligence Engine (PS-S05)
## Execution & Usage Guide

### 🚀 Launching the Interactive Web Dashboard & REST API

You can launch the visual, map-based **Web Dashboard** and submit custom complaint inputs directly from your browser!

```bash
cd /Users/vivekjampani/.gemini/antigravity/scratch/nagarai-civic-engine
source venv/bin/activate

# Start the FastAPI Web Dashboard Server
python server.py
```

Then open your web browser at:
👉 **[http://localhost:8000](http://localhost:8000)**

---

### 🌟 Dashboard Features & Testing Capabilities

1. **Interactive Leaflet Map**:
   - Geotagged map pins color-coded by issue category (`Red` = Open Manhole, `Orange` = Pothole, `Blue` = Waterlogging, `Green` = Garbage, `Yellow` = Streetlight).
   - Click anywhere on the map to automatically set coordinates for a new complaint submission.

2. **Custom Input Submission Modal**:
   - Test your own inputs using **Text**, **Voice Audio File Upload (.wav, .mp3)**, or **Photo Image Upload (.jpg, .png)**.
   - Speech notes automatically run through **Whisper / IndicConformer ASR** to generate issue descriptions.
   - Photos automatically run through **YOLOv8 + CLIP** for classification & severity estimation.

3. **Live Priority Leaderboard Queue**:
   - Displays complaint clusters sorted by the transparent formula priority score ($0 - 100$).
   - Shows **Assigned Department** & **SLA Resolution Countdown Timer**.
   - Change status in real-time (`SUBMITTED` $\rightarrow$ `IN_PROGRESS` $\rightarrow$ `RESOLVED`) to trigger citizen notifications.

4. **Cluster Inspector Modal**:
   - Click **Details** on any card to view the mathematical step-by-step priority score breakdown, auto-generated summary, and all merged citizen reports.

---

### 💻 Command-Line Interface (CLI) Tools

If you prefer testing directly in the terminal, use these CLI tools:

#### 1. Live 15-Complaint Judging Test Suite
```bash
python test_15_complaints_judging.py
```

#### 2. Submit Custom Inputs via CLI
```bash
# Text Complaint
python run_my_complaint.py --text "Deep dangerous pothole blocking traffic on MG Road" --lat 28.6315 --lon 77.2167

# Audio Speech Complaint
python run_my_complaint.py --audio "path/to/speech.wav" --lat 28.6315 --lon 77.2167

# Image Complaint
python run_my_complaint.py --image "path/to/pothole.jpg" --lat 28.6315 --lon 77.2167
```

#### 3. Interactive Terminal Wizard
```bash
python run_interactive.py
```

#### 4. Browse & Inspect Complaints Leaderboard
```bash
python browse_complaints.py
```

#### 5. Reset Database Store
```bash
python reset_db.py
```
