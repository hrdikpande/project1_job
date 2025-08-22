#!/bin/bash

# Railway Deployment Script for Task & Checklist Manager
# This script helps you deploy your application to Railway

echo "🚀 Railway Deployment Script for Task & Checklist Manager"
echo "=================================================="

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI is not installed. Installing now..."
    npm install -g @railway/cli
fi

# Check if user is logged in
if ! railway whoami &> /dev/null; then
    echo "🔐 Please login to Railway..."
    railway login
fi

# Initialize Railway project if not already done
if [ ! -f ".railway" ]; then
    echo "📁 Initializing Railway project..."
    railway init
fi

# Set environment variables
echo "🔧 Setting environment variables..."
railway variables set NODE_ENV=production
railway variables set PORT=3000
railway variables set DB_PATH=/tmp/taskmanager.db
railway variables set JWT_SECRET=$(openssl rand -base64 32)

# Get the project URL
PROJECT_URL=$(railway status --json | jq -r '.project.domain')
if [ "$PROJECT_URL" != "null" ]; then
    echo "🌐 Setting FRONTEND_URL to: https://$PROJECT_URL"
    railway variables set FRONTEND_URL=https://$PROJECT_URL
else
    echo "⚠️  Could not determine project URL. Please set FRONTEND_URL manually in Railway dashboard."
fi

# Deploy the application
echo "🚀 Deploying to Railway..."
railway up

echo "✅ Deployment completed!"
echo "🌐 Your app should be available at: https://$PROJECT_URL"
echo "📊 Check the deployment status at: https://railway.app/dashboard"

# Show logs
echo "📋 Recent logs:"
railway logs --tail 10
