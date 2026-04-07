#!/bin/bash

set -e

# Identif.ai Quick Start Script
# Starts both ML Backend (FastAPI) and Frontend (Express) servers

PROJECT_DIR="/home/CL502-30/identif.ai"
ML_ENV="$PROJECT_DIR/ml_env"
export PATH="$ML_ENV/bin:$PATH"

echo " Starting Identif.ai..."
echo ""

# Create .env files if they don't exist
if [ ! -f "$PROJECT_DIR/.env" ]; then
    echo "⚠️  Creating $PROJECT_DIR/.env"
    cat > "$PROJECT_DIR/.env" << 'EOF'
# HuggingFace Credentials
HF_TOKEN=hf_your_token_here
HF_REPO=your-username/your-repo-name

# AWS Polly (optional)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1
EOF
    echo "   📝 Edit this file with your credentials"
fi

if [ ! -f "$PROJECT_DIR/frontend/server/.env" ]; then
    echo "⚠️  Creating frontend/.env"
    cat > "$PROJECT_DIR/frontend/server/.env" << 'EOF'
PORT=5000
ML_BACKEND_URL=http://localhost:8000
NODE_ENV=development
EOF
fi

FRONTEND_PORT=$(awk -F= '/^PORT=/{print $2; exit}' "$PROJECT_DIR/frontend/server/.env" | tr -d '[:space:]')
if [ -z "$FRONTEND_PORT" ]; then
    FRONTEND_PORT=5000
fi

CLIENT_PORT=$(awk -F= '/^PORT=/{print $2; exit}' "$PROJECT_DIR/frontend/client/package.json" 2>/dev/null)
if [ -z "$CLIENT_PORT" ]; then
    CLIENT_PORT=3001
fi

# Start ML Backend in background
echo ""
echo "🤖 Starting ML Backend..."
cd "$PROJECT_DIR"
if [ ! -d "$ML_ENV" ]; then
    echo "   Creating Python virtual environment..."
    python3 -m venv "$ML_ENV"
fi
if [ ! -f "$ML_ENV/bin/pip" ]; then
    echo "   ✅ Virtual environment created"
else
    echo "   ✅ Virtual environment already exists"
fi

echo "   Installing Python dependencies..."
PYTHONNOUSERSITE=1 "$ML_ENV/bin/python" -m pip install --no-user --upgrade pip "setuptools<82" wheel >/dev/null
PYTHONNOUSERSITE=1 "$ML_ENV/bin/python" -m pip install --no-user -q -r ml_requirements.txt

# Whisper requires ffmpeg for audio decoding.
if ! command -v ffmpeg >/dev/null 2>&1; then
    if command -v conda >/dev/null 2>&1; then
        echo "   Installing ffmpeg into the environment..."
        conda install -y -p "$ML_ENV" -c conda-forge ffmpeg >/dev/null
    else
        echo "   ❌ ffmpeg is missing and conda is unavailable. Install ffmpeg and rerun."
        exit 1
    fi
fi

# Ensure required spaCy model is available for attribute extraction.
if ! PYTHONNOUSERSITE=1 "$ML_ENV/bin/python" -c "import spacy; spacy.load('en_core_web_sm')" >/dev/null 2>&1; then
    echo "   Installing spaCy model: en_core_web_sm..."
    PYTHONNOUSERSITE=1 "$ML_ENV/bin/python" -m spacy download en_core_web_sm >/dev/null
fi

# xformers is optional and the prebuilt wheels frequently mismatch the local CUDA stack.
# Remove it so diffusers can fall back to the standard attention path.
PYTHONNOUSERSITE=1 "$ML_ENV/bin/python" -m pip uninstall -y xformers >/dev/null 2>&1 || true

echo "   Starting ML Backend..."
PYTHONNOUSERSITE=1 "$ML_ENV/bin/python" ml_backend.py > /tmp/ml_backend.log 2>&1 &
ML_PID=$!
echo "   ✅ ML Backend PID: $ML_PID (port 8000)"

# Wait for ML backend to be actually ready (model load can take minutes)
echo "   Waiting for ML Backend health check..."
MAX_WAIT_SECONDS=900
WAITED_SECONDS=0
until curl -fsS "http://127.0.0.1:8000/health" >/dev/null 2>&1; do
    if ! kill -0 "$ML_PID" >/dev/null 2>&1; then
        echo "   ❌ ML Backend exited during startup. Check /tmp/ml_backend.log"
        exit 1
    fi

    sleep 5
    WAITED_SECONDS=$((WAITED_SECONDS + 5))

    if [ "$WAITED_SECONDS" -ge "$MAX_WAIT_SECONDS" ]; then
        echo "   ❌ Timed out waiting for ML Backend (>${MAX_WAIT_SECONDS}s). Check /tmp/ml_backend.log"
        exit 1
    fi
done
echo "   ✅ ML Backend is healthy"

# Start Frontend in background
echo ""
echo "🌐 Starting Frontend..."
cd "$PROJECT_DIR/frontend/server"

# Check if Node.js is installed
if ! command -v node &> /dev/null || ! command -v npm &> /dev/null; then
    echo "   ❌ Node.js/npm not found. Install Node.js 18+ and rerun start.sh."
    echo "   On Ubuntu/Debian: sudo apt-get update && sudo apt-get install -y nodejs npm"
    echo "   Or install Node.js from https://nodejs.org/"
    exit 1
fi

if [ ! -d "node_modules" ]; then
    echo "   Installing npm dependencies..."
    npm install --quiet
fi

# Rebuild the native SQLite module if the binary was built for a different platform.
if ! node -e "require('better-sqlite3')" >/dev/null 2>&1; then
    echo "   Rebuilding native Node module: better-sqlite3"
    npm rebuild better-sqlite3 --build-from-source --quiet
fi
npm start > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!
echo "   ✅ Frontend PID: $FRONTEND_PID (port $FRONTEND_PORT)"

echo ""
echo "🖥️  Starting Client..."
cd "$PROJECT_DIR/frontend/client"
if [ ! -d "node_modules" ]; then
    echo "   Installing client dependencies..."
    npm install --quiet
fi
npm start > /tmp/client.log 2>&1 &
CLIENT_PID=$!
echo "   ✅ Client PID: $CLIENT_PID (port 3001)"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ Identif.ai is running!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📍 URLs:"
echo "   Frontend UI:  http://localhost:3001"
echo "   Backend API:  http://localhost:$FRONTEND_PORT"
echo "   ML Backend:   http://localhost:8000"
echo "   API Docs:     http://localhost:8000/docs"
echo ""
echo "🛑 To stop both services:"
echo "   kill $ML_PID $FRONTEND_PID $CLIENT_PID"
echo ""

# Wait for both processes
wait $ML_PID $FRONTEND_PID $CLIENT_PID
