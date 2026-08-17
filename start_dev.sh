#!/bin/bash
set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$PROJECT_ROOT/nagarai-—-civic-complaint-intelligence-engine (1)"

echo "================================================================"
echo "  🏛️  NAGARAI CIVIC COMPLAINT INTELLIGENCE ENGINE  🏛️"
echo "  Unified Local ML Backend (Whisper + CLIP + YOLOv8 + PostGIS)"
echo "  React 19 Frontend (Vite + Tailwind CSS)"
echo "================================================================"

# 1. Activate Python Virtual Environment
if [ -d "$PROJECT_ROOT/venv" ]; then
    echo "[1/4] Activating Python virtual environment..."
    source "$PROJECT_ROOT/venv/bin/activate"
fi

# 2. Check / Start PostgreSQL Container
echo "[2/4] Checking PostgreSQL + PostGIS + pgvector database..."
if docker ps -a --format '{{.Names}}' | grep -q "^nagarai-postgres$"; then
    if ! docker ps --format '{{.Names}}' | grep -q "^nagarai-postgres$"; then
        echo "Starting existing nagarai-postgres container..."
        docker start nagarai-postgres
    else
        echo "PostgreSQL container is already running."
    fi
else
    echo "Creating and starting nagarai-postgres container..."
    docker run -d --name nagarai-postgres -p 5432:5432 \
        -e POSTGRES_DB=nagarai \
        -e POSTGRES_USER=nagarai \
        -e POSTGRES_PASSWORD=nagarai_dev \
        postgis/postgis:16-3.4
    sleep 3
    docker exec -u 0 nagarai-postgres bash -c "apt-get update && apt-get install -y postgresql-16-pgvector" 2>/dev/null || true
    docker exec nagarai-postgres psql -U nagarai -d nagarai -c "CREATE EXTENSION IF NOT EXISTS vector;" 2>/dev/null || true
fi

# 3. Initialize Database & Seed Data
echo "[3/4] Initializing database schema and seed records..."
export DATABASE_URL="postgresql://nagarai:nagarai_dev@localhost:5432/nagarai"
python "$PROJECT_ROOT/db_setup.py"

# 4. Start Python ML Server & Frontend Dev Server
echo "[4/4] Starting Unified Python ML Server (:8000) and React Frontend (:5173)..."

python "$PROJECT_ROOT/unified_server.py" &
BACKEND_PID=$!

cd "$FRONTEND_DIR"
npm run dev &
FRONTEND_PID=$!

cleanup() {
    echo ""
    echo "Stopping NagarAI services..."
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    exit 0
}

trap cleanup INT TERM EXIT

echo ""
echo "================================================================"
echo "  ✅ Services Operational:"
echo "  🌐 React UI Dashboard:     http://localhost:5173"
echo "  ⚡ Python FastAPI Backend:  http://localhost:8000"
echo "  📖 API Documentation:       http://localhost:8000/docs"
echo "================================================================"
echo "Press Ctrl+C to stop all services."
echo ""

wait
