#!/bin/bash
# Start Telegram Bot Store (Backend + Frontend)

echo "⚡ Starting Telegram Bot Store Workspace..."

# Kill any lingering zombie processes on port 8000 and port 3000
echo "🧹 Checking & releasing ports (8000, 3000)..."
lsof -ti :8000 | xargs kill -9 2>/dev/null || true
lsof -ti :3000 | xargs kill -9 2>/dev/null || true
sleep 1

# 1. Start Backend FastAPI
echo "📦 Starting Backend API & Telegram Bot on http://localhost:8000..."
(cd backend && ./.venv/bin/uvicorn app.main:app --reload --port 8000) &
BACKEND_PID=$!

# Wait briefly for backend port to bind
sleep 2

# 2. Start Frontend Vite
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
