#!/bin/bash

# Insta-Stream API Test Script
# This script tests all API endpoints

API_URL="http://localhost:3000"

echo "🧪 Testing Insta-Stream API"
echo "============================"
echo ""

# Health check
echo "1. Health Check"
curl -s "${API_URL}/health" | jq '.'
echo ""

# Get initial status
echo "2. Get Stream Status"
curl -s "${API_URL}/api/stream/status" | jq '.'
echo ""

# Get playlist
echo "3. Get Playlist"
curl -s "${API_URL}/api/playlist" | jq '.'
echo ""

# Upload video (uncomment and provide path to test)
# echo "4. Upload Video"
# curl -X POST "${API_URL}/api/upload" \
#   -F "video=@/path/to/your/video.mp4" | jq '.'
# echo ""

# Start stream
echo "5. Start Stream"
curl -s -X POST "${API_URL}/api/stream/start" | jq '.'
echo ""

# Wait a bit
sleep 2

# Get status after starting
echo "6. Get Status After Start"
curl -s "${API_URL}/api/stream/status" | jq '.'
echo ""

# Pause stream
echo "7. Pause Stream"
curl -s -X POST "${API_URL}/api/stream/pause" | jq '.'
echo ""

# Resume stream
echo "8. Resume Stream"
curl -s -X POST "${API_URL}/api/stream/resume" | jq '.'
echo ""

# Stop stream
echo "9. Stop Stream"
curl -s -X POST "${API_URL}/api/stream/stop" | jq '.'
echo ""

echo "✅ API tests completed"
