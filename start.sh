#!/bin/bash

# Clueso Clone - Start Script
# This script starts the backend, frontend, and MongoDB services

echo "🚀 Starting Clueso Clone Application..."
echo ""

# Check if MongoDB is running
if ! pgrep -x "mongod" > /dev/null; then
    echo "📦 Starting MongoDB..."
    mongod --config /opt/homebrew/etc/mongod.conf --fork --logpath /opt/homebrew/var/log/mongodb/mongo.log
    sleep 2
fi

# Start Backend
echo "🔧 Starting Backend Server..."
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

# Wait a bit for backend to start
sleep 3

# Start Frontend
echo "🎨 Starting Frontend Server..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ Application started successfully!"
echo ""
echo "📍 Frontend: http://localhost:5173"
echo "📍 Backend API: http://localhost:5001"
echo "📍 MongoDB: localhost:27017"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for Ctrl+C
trap "echo ''; echo '🛑 Stopping services...'; kill $BACKEND_PID $FRONTEND_PID; mongod --shutdown; echo '✅ All services stopped'; exit" INT
wait
