#!/bin/bash
set -e

echo "=========================================="
echo "   ERD Builder E2E Test Runner"
echo "=========================================="

# Configuration
FRONTEND_URL="${FRONTEND_URL:-http://frontend:3000}"
SELENIUM_HUB="${SELENIUM_HUB:-http://selenium-chrome:4444/wd/hub}"
MAX_RETRIES=30
RETRY_INTERVAL=5

# Validate required files exist
if [ ! -f "/tests/test_erd_flows.py" ]; then
    echo "❌ Error: test_erd_flows.py not found!"
    exit 1
fi

if [ ! -f "/tests/conftest.py" ]; then
    echo "❌ Error: conftest.py not found!"
    exit 1
fi

# Function to wait for a service to be ready
wait_for_service() {
    local url=$1
    local service_name=$2
    local retries=0
    
    echo "⏳ Waiting for $service_name at $url..."
    
    while [ $retries -lt $MAX_RETRIES ]; do
        if curl -s --head --fail "$url" > /dev/null 2>&1; then
            echo "✅ $service_name is ready!"
            return 0
        fi
        
        retries=$((retries + 1))
        echo "   Attempt $retries/$MAX_RETRIES - $service_name not ready, waiting ${RETRY_INTERVAL}s..."
        sleep $RETRY_INTERVAL
    done
    
    echo "❌ $service_name did not become ready in time"
    return 1
}

# Wait for Selenium Hub
echo ""
echo "🔧 Checking Selenium Hub..."
wait_for_service "${SELENIUM_HUB}/status" "Selenium Hub"

# Wait for Frontend
echo ""
echo "🌐 Checking Frontend..."
wait_for_service "$FRONTEND_URL" "Frontend"

# Create reports directory
echo ""
echo "📁 Setting up reports directory..."
mkdir -p /tests/reports

# Clean up old debug screenshots (keep only recent ones)
echo "🧹 Cleaning up old debug screenshots..."
find /tests/reports -name "debug_*.png" -type f -mtime +1 -delete 2>/dev/null || true

# Function to display test results summary
display_test_summary() {
    local exit_code=$1
    
    echo ""
    echo "=========================================="
    
    if [ $exit_code -eq 0 ]; then
        echo "   ✅ ALL TESTS PASSED!"
        echo "   🎉 Great job! All functionality is working correctly."
    else
        echo "   ❌ SOME TESTS FAILED"
        echo "   🔍 Check the detailed output above for failure reasons."
        echo "   📸 Screenshots saved in /tests/reports/ for failed tests."
    fi
    
    echo ""
    echo "   📊 HTML Report: /tests/reports/report.html"
    echo "   🔍 VNC Debug: http://localhost:7900 (password: secret)"
    echo "=========================================="
}

# Run the tests
echo ""
echo "=========================================="
echo "   Running E2E Tests"
echo "=========================================="
echo ""

# Run pytest with sugar plugin for beautiful output
pytest \
    --verbose \
    --tb=short \
    --html=/tests/reports/report.html \
    --self-contained-html \
    --sugar \
    /tests/test_erd_flows.py

TEST_EXIT_CODE=$?

# Display beautiful summary
display_test_summary $TEST_EXIT_CODE

exit $TEST_EXIT_CODE
