#!/bin/bash

# Identif.ai Service Launcher
# Enhanced version that properly manages both services

PROJECT_DIR="/home/CL502-30/identif.ai"
ML_ENV="$PROJECT_DIR/ml_env"
ML_LOG_FILE="/tmp/ml_backend.log"
FRONTEND_LOG_FILE="/tmp/frontend.log"

echo "🚀 Identif.ai Startup Script"
echo "================================"
echo ""

# Verify environments exist
if [ ! -d "$ML_ENV" ]; then
    echo "❌ ML environment not found at $ML_ENV"
    echo "   Please run: python3 -m venv $ML_ENV"
    echo "   Then: $ML_ENV/bin/pip install -r ml_requirements.txt"
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found in PATH"
    exit 1
fi

# Create .env files
if [ ! -f "$PROJECT_DIR/.env" ]; then
    echo "📝 Creating $PROJECT_DIR/.env"
    cat > "$PROJECT_DIR/.env" << 'EOF'
HF_TOKEN=hf_your_token_here
HF_REPO=your-username/repo-name
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1
EOF
    echo "   ⚠️  Edit this file with your HF credentials"
fi

if [ ! -f "$PROJECT_DIR/frontend/server/.env" ]; then
    echo "📝 Creating $PROJECT_DIR/frontend/server/.env"
    mkdir -p "$PROJECT_DIR/frontend/server"
    cat > "$PROJECT_DIR/frontend/server/.env" << 'EOF'
PORT=5000
ML_BACKEND_URL=http://localhost:8000
NODE_ENV=development
EOF
fi

echo ""
echo "🤖 Starting ML Backend..."
echo "   Log: $ML_LOG_FILE"

# Start ML Backend
"$ML_ENV/bin/python3" "$PROJECT_DIR/ml_backend.py" > "$ML_LOG_FILE" 2>&1 &
ML_PID=$!
echo "   ✅ ML Backend PID: $ML_PID"

# Wait for ML backend to start
sleep 8

# Check if ML backend started successfully
if ! kill -0 $ML_PID 2>/dev/null; then
    echo "   ❌ ML Backend failed to start!"
    echo "   Last 20 lines of log:"
    tail -20 "$ML_LOG_FILE"
    exit 1
fi

# Check if health endpoint is available
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "   ✅ ML Backend is responding"
else
    echo "   ⚠️  ML Backend not yet responding (may still be loading models...)"
fi

echo ""
echo "🌐 Starting Frontend..."
echo "   Log: $FRONTEND_LOG_FILE"

# Install npm dependencies if needed
cd "$PROJECT_DIR/frontend/server" || exit 1
if [ ! -d "node_modules" ]; then
    echo "   📦 Installing npm dependencies..."
    npm install --quiet 2>&1 | tail -5
fi

# Start Frontend
npm start > "$FRONTEND_LOG_FILE" 2>&1 &
FRONTEND_PID=$!
echo "   ✅ Frontend PID: $FRONTEND_PID"

sleep 3

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ Services Starting"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📍 Access URLs:"
echo "   Frontend:     http://localhost:5000"
echo "   ML Backend:   http://localhost:8000"
echo "   API Docs:     http://localhost:8000/docs"
echo ""
echo "📋 Logs:"
echo "   ML Backend:   tail -f $ML_LOG_FILE"
echo "   Frontend:     tail -f $FRONTEND_LOG_FILE"
echo ""
echo "🛑 To stop services:"
echo "   kill $ML_PID $FRONTEND_PID"
echo ""
echo "Waiting for services to run..."

# Wait for both processes
wait $ML_PID $FRONTEND_PID
