#!/bin/bash

# run.sh - Startup script for the SaansSync Project

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Starting SaansSync Project...${NC}"

# Check for Docker daemon
if ! docker info > /dev/null 2>&1; then
  echo "Error: Docker daemon is not running. Please start Docker."
  exit 1
fi

echo -e "${GREEN}[1/4] Starting PostgreSQL Database via Docker Compose...${NC}"
docker-compose up -d db

echo "Killing any overlapping local processes on ports 3000 and 3001..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:3001 | xargs kill -9 2>/dev/null || true

# Wait for DB to be ready
echo "Waiting 10s for PostgreSQL to initially create the database..."
sleep 10

echo -e "${GREEN}[2/4] Syncing Prisma Database Schema...${NC}"
cd backend
npx prisma db push || {
    echo "Prisma push failed. Database might still be initializing. Retrying in 5 seconds..."
    sleep 5
    npx prisma db push
}
cd ..

echo -e "${GREEN}[3/4] Starting Backend Server...${NC}"
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

echo -e "${GREEN}[4/4] Starting Frontend Server...${NC}"
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo -e "${BLUE}Both servers are running!${NC}"
echo "Backend is running on http://localhost:3001"
echo "Frontend is running on http://localhost:3000"
echo "Press Ctrl+C to stop all servers."

# Trap Ctrl+C to kill the child processes
trap "echo 'Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID; docker-compose stop; exit" SIGINT

# Keep script running
wait
