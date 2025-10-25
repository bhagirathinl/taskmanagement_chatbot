#!/bin/bash

# API Test Suite for Project Management System
# Make sure your API is running on http://localhost:3000

BASE_URL="http://localhost:3000"

echo "🧪 Starting API Test Suite..."
echo "================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Function to test endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local description=$3
    local data=$4
    
    echo -e "${YELLOW}Testing:${NC} $description"
    echo "  ${method} ${endpoint}"
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "${BASE_URL}${endpoint}")
    else
        response=$(curl -s -w "\n%{http_code}" -X ${method} \
            -H "Content-Type: application/json" \
            -d "${data}" \
            "${BASE_URL}${endpoint}")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
        echo -e "  ${GREEN}✓ PASSED${NC} (HTTP $http_code)"
        echo "  Response: $(echo $body | head -c 100)..."
        ((TESTS_PASSED++))
    else
        echo -e "  ${RED}✗ FAILED${NC} (HTTP $http_code)"
        echo "  Error: $body"
        ((TESTS_FAILED++))
    fi
    echo ""
}

# ==================== HEALTH CHECK ====================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🏥 HEALTH CHECK"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_endpoint "GET" "/health" "Health check"

# ==================== PROJECT ENDPOINTS ====================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📁 PROJECT ENDPOINTS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

test_endpoint "GET" "/projects" "Get all projects"
test_endpoint "GET" "/projects/1" "Get project by ID (assuming ID=1 exists)"
test_endpoint "GET" "/projects/search/Website" "Search projects by name"
test_endpoint "GET" "/projects/1/summary" "Get project summary"
test_endpoint "GET" "/projects/1/tasks" "Get project tasks"
test_endpoint "GET" "/projects/1/team" "Get project team members"

# ==================== TASK ENDPOINTS ====================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ TASK ENDPOINTS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

test_endpoint "GET" "/tasks" "Get all tasks"
test_endpoint "GET" "/tasks/id/1" "Get task by ID (assuming ID=1 exists)"
test_endpoint "GET" "/tasks/user/1" "Get tasks by user ID"
test_endpoint "GET" "/tasks/status/in_progress" "Get tasks by status (in_progress)"

test_endpoint "GET" "/tasks/overdue/all" "Get overdue tasks"

# ==================== USER ENDPOINTS ====================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "👤 USER ENDPOINTS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

test_endpoint "GET" "/users" "Get all users"
test_endpoint "GET" "/users/1" "Get user by ID (assuming ID=1 exists)"
test_endpoint "GET" "/users/search/Alice" "Search users by name"
test_endpoint "GET" "/users/1/workload" "Get user workload"

# ==================== ANALYTICS ENDPOINTS ====================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 ANALYTICS ENDPOINTS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

test_endpoint "GET" "/analytics/dashboard" "Get dashboard statistics"

# ==================== UPDATE ENDPOINTS ====================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✏️  UPDATE ENDPOINTS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

test_endpoint "PUT" "/tasks/1" "Update task status" '{"status":"completed"}'
test_endpoint "PUT" "/projects/1" "Update project status" '{"status":"in_progress"}'

# ==================== SUMMARY ====================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📈 TEST SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
TOTAL_TESTS=$((TESTS_PASSED + TESTS_FAILED))
echo -e "Total Tests: $TOTAL_TESTS"
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Failed: $TESTS_FAILED${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "\n${GREEN}🎉 All tests passed!${NC}"
    exit 0
else
    echo -e "\n${RED}❌ Some tests failed${NC}"
    exit 1
fi