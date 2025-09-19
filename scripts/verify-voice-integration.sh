#!/bin/bash

# Voice Assistant Integration Verification Script
echo "========================================="
echo "Voice Assistant Integration Verification"
echo "========================================="

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Base URL
BASE_URL="https://xyuan.chat"

echo -e "\n${YELLOW}Checking Voice Assistant Services...${NC}"
echo "-----------------------------------------"

# 1. Check voice assistant page availability
echo -n "1. Voice Assistant Page: "
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/voice-assistant")
if [ "$HTTP_STATUS" = "307" ] || [ "$HTTP_STATUS" = "200" ]; then
    echo -e "${GREEN}✓ Available (Status: $HTTP_STATUS)${NC}"
else
    echo -e "${RED}✗ Not Available (Status: $HTTP_STATUS)${NC}"
fi

# 2. Check voice API endpoints
echo -n "2. Voice Devices API: "
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/voice/devices")
if [ "$API_STATUS" = "401" ] || [ "$API_STATUS" = "200" ]; then
    echo -e "${GREEN}✓ Endpoint exists (Status: $API_STATUS)${NC}"
else
    echo -e "${RED}✗ Not Available (Status: $API_STATUS)${NC}"
fi

echo -n "3. Voice Roles API: "
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/voice/roles")
if [ "$API_STATUS" = "401" ] || [ "$API_STATUS" = "200" ]; then
    echo -e "${GREEN}✓ Endpoint exists (Status: $API_STATUS)${NC}"
else
    echo -e "${RED}✗ Not Available (Status: $API_STATUS)${NC}"
fi

echo -n "4. Voice Sessions API: "
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/voice/sessions")
if [ "$API_STATUS" = "401" ] || [ "$API_STATUS" = "200" ]; then
    echo -e "${GREEN}✓ Endpoint exists (Status: $API_STATUS)${NC}"
else
    echo -e "${RED}✗ Not Available (Status: $API_STATUS)${NC}"
fi

# 3. Check WebSocket endpoint
echo -n "5. WebSocket Endpoint: "
WS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -H "Upgrade: websocket" -H "Connection: Upgrade" "$BASE_URL/voice-ws/")
if [ "$WS_STATUS" = "426" ] || [ "$WS_STATUS" = "101" ]; then
    echo -e "${GREEN}✓ WebSocket upgrade available${NC}"
else
    echo -e "${YELLOW}⚠ WebSocket status: $WS_STATUS${NC}"
fi

# 4. Check backend service through Nginx proxy
echo -n "6. Backend Service (via proxy): "
BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/voice-api/health" 2>/dev/null)
if [ "$BACKEND_STATUS" = "200" ] || [ "$BACKEND_STATUS" = "404" ] || [ "$BACKEND_STATUS" = "502" ]; then
    if [ "$BACKEND_STATUS" = "502" ]; then
        echo -e "${RED}✗ Backend service not running (502 Bad Gateway)${NC}"
    else
        echo -e "${GREEN}✓ Proxy configured (Status: $BACKEND_STATUS)${NC}"
    fi
else
    echo -e "${YELLOW}⚠ Status: $BACKEND_STATUS${NC}"
fi

echo -e "\n${YELLOW}Local Development Environment Check...${NC}"
echo "-----------------------------------------"

# 5. Check if local environment variables are set
echo -n "7. Environment Variables: "
if [ -f ".env.local" ]; then
    if grep -q "XIAOZHI_SERVICE_URL" .env.local 2>/dev/null; then
        echo -e "${GREEN}✓ Voice service URLs configured${NC}"
    else
        echo -e "${YELLOW}⚠ Voice service URLs not found in .env.local${NC}"
    fi
else
    echo -e "${RED}✗ .env.local not found${NC}"
fi

# 6. Check if voice components exist
echo -n "8. Voice Components: "
if [ -f "src/components/VoiceAssistant/VoiceAssistant.tsx" ]; then
    echo -e "${GREEN}✓ VoiceAssistant component exists${NC}"
else
    echo -e "${RED}✗ VoiceAssistant component not found${NC}"
fi

echo -n "9. Voice Library: "
if [ -d "src/lib/voice" ] && [ -f "src/lib/voice/websocket-client.ts" ]; then
    echo -e "${GREEN}✓ Voice library files exist${NC}"
else
    echo -e "${RED}✗ Voice library not found${NC}"
fi

echo -n "10. Voice API Routes: "
if [ -d "src/app/api/voice" ]; then
    ROUTE_COUNT=$(find src/app/api/voice -name "route.ts" | wc -l)
    echo -e "${GREEN}✓ $ROUTE_COUNT voice API routes found${NC}"
else
    echo -e "${RED}✗ Voice API routes not found${NC}"
fi

echo -e "\n${YELLOW}Database Schema Check...${NC}"
echo "-----------------------------------------"

echo -n "11. Prisma Voice Models: "
if grep -q "model VoiceDevice" prisma/schema.prisma 2>/dev/null; then
    echo -e "${GREEN}✓ Voice models in schema${NC}"
else
    echo -e "${RED}✗ Voice models not found in schema${NC}"
fi

echo -e "\n${YELLOW}Test Files Check...${NC}"
echo "-----------------------------------------"

echo -n "12. E2E Tests: "
if [ -f "tests/voice-assistant.spec.ts" ]; then
    echo -e "${GREEN}✓ Voice assistant tests exist${NC}"
else
    echo -e "${RED}✗ Voice assistant tests not found${NC}"
fi

echo -n "13. API Tests: "
if [ -f "tests/voice-api.spec.ts" ]; then
    echo -e "${GREEN}✓ Voice API tests exist${NC}"
else
    echo -e "${RED}✗ Voice API tests not found${NC}"
fi

echo -n "14. WebSocket Tests: "
if [ -f "tests/voice-websocket.spec.ts" ]; then
    echo -e "${GREEN}✓ WebSocket tests exist${NC}"
else
    echo -e "${RED}✗ WebSocket tests not found${NC}"
fi

echo -e "\n========================================="
echo -e "${GREEN}Verification Complete!${NC}"
echo "========================================="

echo -e "\n${YELLOW}Next Steps:${NC}"
echo "1. Run tests: npm run test:e2e tests/voice-assistant.spec.ts"
echo "2. Check backend logs: ssh to server and run 'sudo journalctl -u xiaozhi -n 50'"
echo "3. Visit: $BASE_URL/voice-assistant (after login)"
echo ""