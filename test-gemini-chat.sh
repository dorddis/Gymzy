#!/bin/bash
# Test script for new Gemini Chat API

BASE_URL="http://localhost:9001"

echo "🧪 Testing Gemini Chat API..."
echo ""

# Test 1: Simple chat
echo "Test 1: Simple chat message"
echo "----------------------------"
curl -X POST "$BASE_URL/api/ai/gemini-chat" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test-session-1",
    "userId": "test-user-1",
    "message": "Hello! Can you help me with my fitness goals?"
  }' | jq '.'

echo ""
echo ""

# Test 2: Workout generation (function calling)
echo "Test 2: Workout generation with function calling"
echo "------------------------------------------------"
curl -X POST "$BASE_URL/api/ai/gemini-chat" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test-session-1",
    "userId": "test-user-1",
    "message": "Create me a chest and back workout for intermediate level, 45 minutes"
  }' | jq '.'

echo ""
echo ""

# Test 3: Exercise info
echo "Test 3: Get exercise information"
echo "----------------------------------"
curl -X POST "$BASE_URL/api/ai/gemini-chat" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test-session-1",
    "userId": "test-user-1",
    "message": "Tell me about proper bench press form"
  }' | jq '.'

echo ""
echo ""

# Test 4: Get conversation history
echo "Test 4: Get conversation history"
echo "----------------------------------"
curl -X GET "$BASE_URL/api/ai/gemini-chat?sessionId=test-session-1" | jq '.'

echo ""
echo ""
echo "✅ All tests complete!"
