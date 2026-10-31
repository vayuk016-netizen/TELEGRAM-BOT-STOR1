#!/bin/bash
# Start Telegram Bot Store (Backend + Frontend)

echo "⚡ Starting Telegram Bot Store Workspace..."

# Kill any lingering zombie processes on port 8000 and port 3000
echo "🧹 Checking & releasing ports (8000, 3000)..."
lsof -ti :8000 | xargs kill -9 2>/dev/null || true
lsof -ti :3000 | xargs kill -9 2>/dev/null || true
sleep 1

# 1. Check & Setup Frontend dependencies if needed
if [ ! -d "frontend/node_modules" ]; then
    echo "📦 Frontend node_modules not found. Installing..."
    (cd frontend && npm install)
fi

# 2. Check Backend Virtual Environment
if [ ! -f "backend/.venv/bin/uvicorn" ]; then
    echo "❌ Error: Backend virtual environment with uvicorn not found at backend/.venv/bin/uvicorn"
    echo "👉 Please set up your Python environment by running: npm run setup:backend"
    exit 1
fi

# 3. Start Backend FastAPI
echo "📦 Starting Backend API & Telegram Bot on http://localhost:8000..."
(cd backend && ./.venv/bin/uvicorn app.main:app --reload --port 8000) &
BACKEND_PID=$!

# Wait briefly for backend port to bind
sleep 2

# 4. Start Frontend Vite
echo "🎨 Starting Frontend Dashboard on http://localhost:3000..."
(cd frontend && npm run dev) &
FRONTEND_PID=$!

# Cleanup function when user presses Ctrl+C
cleanup() {
    echo ""
    echo "🛑 Shutting down all services..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
    lsof -ti :8000 | xargs kill -9 2>/dev/null || true
    lsof -ti :3000 | xargs kill -9 2>/dev/null || true
    exit 0
}
trap cleanup SIGINT SIGTERM EXIT

wait
