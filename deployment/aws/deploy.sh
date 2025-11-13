#!/bin/bash

#######################################
# AWS EC2 Deployment Script
# Deploy Task Management Chatbot Application
#######################################

set -e

echo "🚀 Starting deployment..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo -e "${RED}❌ Error: .env.production file not found${NC}"
    echo "Please copy .env.production.example to .env.production and configure it"
    exit 1
fi

# Load production environment variables
export $(cat .env.production | grep -v '#' | xargs)

echo -e "${GREEN}✅ Environment variables loaded${NC}"

# Stop existing containers
echo -e "${YELLOW}📦 Stopping existing containers...${NC}"
docker-compose -f docker-compose.prod.yml down

# Remove old images (optional - uncomment to force rebuild)
# docker-compose -f docker-compose.prod.yml build --no-cache

# Build and start containers
echo -e "${YELLOW}🔨 Building containers...${NC}"
docker-compose -f docker-compose.prod.yml build

echo -e "${YELLOW}🚀 Starting containers...${NC}"
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be healthy
echo -e "${YELLOW}⏳ Waiting for services to be healthy...${NC}"
sleep 10

# Check service health
echo -e "${YELLOW}🏥 Checking service health...${NC}"

if docker exec tasks_app curl -f http://localhost:3000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Tasks API is healthy${NC}"
else
    echo -e "${RED}❌ Tasks API health check failed${NC}"
fi

if docker exec chatbot_service curl -f http://localhost:4000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Chatbot API is healthy${NC}"
else
    echo -e "${RED}❌ Chatbot API health check failed${NC}"
fi

# Show running containers
echo -e "${GREEN}📋 Running containers:${NC}"
docker-compose -f docker-compose.prod.yml ps

# Show logs
echo -e "${YELLOW}📝 Recent logs:${NC}"
docker-compose -f docker-compose.prod.yml logs --tail=20

echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo "Access your application:"
echo "  Chatbot UI: http://$(curl -s ifconfig.me)"
echo "  Avatar UI: http://$(curl -s ifconfig.me)/streaming/avatar"
echo "  API Health: http://$(curl -s ifconfig.me)/health"
echo ""
echo "To view logs: docker-compose -f docker-compose.prod.yml logs -f [service_name]"
echo "To stop: docker-compose -f docker-compose.prod.yml down"
