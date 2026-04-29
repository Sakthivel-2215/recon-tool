#!/bin/bash
# ReconX - Start both backend and frontend

echo ""
echo "  ⬡  RECONX — Website Intelligence Tool"
echo "  ──────────────────────────────────────"
echo ""

# Install backend deps if needed
if [ ! -d "backend/node_modules" ]; then
  echo "→ Installing backend dependencies..."
  cd backend && npm install && cd ..
fi

# Install frontend deps if needed
if [ ! -d "frontend/node_modules" ]; then
  echo "→ Installing frontend dependencies..."
  cd frontend && npm install && cd ..
fi

echo "→ Starting backend on http://localhost:3001"
cd backend && node server.js &
BACKEND_PID=$!

sleep 1

echo "→ Starting frontend on http://localhost:3000"
cd ../frontend && npm run dev &
FRONTEND_PID=$!

echo ""
echo "  ✓  ReconX is running!"
echo "  → Open: http://localhost:3000"
echo ""
echo "  Press Ctrl+C to stop both servers"
echo ""

# Handle Ctrl+C
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo 'Stopped.'; exit" INT
wait
