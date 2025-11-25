#!/bin/bash

# CryptoQuant Deployment Status Checker
# This script checks if your deployment is successful

echo "🔍 CryptoQuant Deployment Status Check"
echo "======================================"

# Check if deployment URL is provided
if [ -z "$1" ]; then
    echo "Usage: ./check-deployment.sh <your-deployment-url>"
    echo "Example: ./check-deployment.sh https://cryptoquant.vercel.app"
    exit 1
fi

DEPLOYMENT_URL="$1"
API_URL="$DEPLOYMENT_URL/api"

echo "Checking deployment at: $DEPLOYMENT_URL"
echo ""

# Function to check endpoint
check_endpoint() {
    local url="$1"
    local description="$2"
    
    echo -n "Checking $description... "
    
    if response=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null); then
        if [ "$response" = "200" ]; then
            echo "✅ SUCCESS (HTTP $response)"
            return 0
        else
            echo "❌ FAILED (HTTP $response)"
            return 1
        fi
    else
        echo "❌ CONNECTION FAILED"
        return 1
    fi
}

# Function to check API response
check_api_response() {
    local url="$1"
    local description="$2"
    local expected_content="$3"
    
    echo -n "Checking $description... "
    
    if response=$(curl -s "$url" 2>/dev/null); then
        if echo "$response" | grep -q "$expected_content"; then
            echo "✅ SUCCESS"
            return 0
        else
            echo "❌ FAILED (Unexpected response)"
            echo "Response: $response"
            return 1
        fi
    else
        echo "❌ CONNECTION FAILED"
        return 1
    fi
}

# Main checks
echo "1. 🔧 Basic Connectivity"
echo "------------------------"

# Check main website
check_endpoint "$DEPLOYMENT_URL" "Main Website"
website_status=$?

# Check API health
check_endpoint "$API_URL/health" "API Health Check"
health_status=$?

# Check API response content
check_api_response "$API_URL/health" "API Response Content" "CryptoQuant API"
api_content_status=$?

echo ""
echo "2. 📊 API Functionality"
echo "-----------------------"

# Check market price API
check_endpoint "$API_URL/market/price/BTC/USDT" "Market Price API"
market_status=$?

# Check strategies API
check_endpoint "$API_URL/strategies" "Strategies API"
strategies_status=$?

echo ""
echo "3. 🎯 Frontend Features"
echo "-----------------------"

# Check if main page loads correctly
echo -n "Checking Frontend Loading... "
if response=$(curl -s "$DEPLOYMENT_URL" 2>/dev/null); then
    if echo "$response" | grep -q "CryptoQuant\|量化交易\|React"; then
        echo "✅ SUCCESS"
        frontend_status=0
    else
        echo "⚠️  PARTIAL (Page loads but content may be incomplete)"
        frontend_status=1
    fi
else
    echo "❌ FAILED"
    frontend_status=1
fi

echo ""
echo "4. 📈 Overall Status"
echo "-------------------"

# Calculate overall status
total_checks=6
success_count=0

[ $website_status -eq 0 ] && ((success_count++))
[ $health_status -eq 0 ] && ((success_count++))
[ $api_content_status -eq 0 ] && ((success_count++))
[ $market_status -eq 0 ] && ((success_count++))
[ $strategies_status -eq 0 ] && ((success_count++))
[ $frontend_status -eq 0 ] && ((success_count++))

success_rate=$((success_count * 100 / total_checks))

echo "Deployment Success Rate: $success_rate% ($success_count/$total_checks checks passed)"

echo ""
if [ $success_rate -ge 80 ]; then
    echo "🎉 DEPLOYMENT SUCCESSFUL!"
    echo "✅ Your CryptoQuant platform is online and working!"
    echo "🔗 Access your platform at: $DEPLOYMENT_URL"
elif [ $success_rate -ge 60 ]; then
    echo "⚠️  DEPLOYMENT PARTIAL"
    echo "🔧 Most features are working, but some issues detected"
    echo "📋 Check the failed tests above and fix accordingly"
else
    echo "❌ DEPLOYMENT FAILED"
    echo "🔧 Significant issues detected"
    echo "📋 Please check the deployment guide and fix the issues"
fi

echo ""
echo "📞 If you need help:"
echo "   1. Check Vercel console logs"
echo "   2. Verify environment variables"
echo "   3. Review deployment configuration"
echo "   4. Test locally first"

exit 0