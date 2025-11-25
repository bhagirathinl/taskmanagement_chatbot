#!/bin/bash

#######################################
# AWS Free Tier (t2.micro/t3.micro) Setup Script
# Installs Docker + Adds 2GB Swap Space
#######################################

set -e

echo "🆓 Setting up AWS Free Tier instance..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Update system
echo -e "${YELLOW}📦 Updating system packages...${NC}"
sudo yum update -y

# Install Docker
echo -e "${YELLOW}🐳 Installing Docker...${NC}"
sudo yum install -y docker

# Start Docker service
sudo systemctl start docker
sudo systemctl enable docker

# Add current user to docker group
sudo usermod -a -G docker ec2-user

# Install Docker Compose
echo -e "${YELLOW}🔨 Installing Docker Compose...${NC}"
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Git
echo -e "${YELLOW}📚 Installing Git...${NC}"
sudo yum install -y git

# Install useful tools
echo -e "${YELLOW}🛠️ Installing additional tools...${NC}"
sudo yum install -y htop vim curl wget

# Add 2GB Swap Space (CRITICAL for 1GB RAM instance)
echo -e "${YELLOW}💾 Creating 2GB swap space (critical for free tier)...${NC}"

# Check if swap already exists
if [ $(swapon --show | wc -l) -eq 0 ]; then
    sudo dd if=/dev/zero of=/swapfile bs=1M count=2048
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    echo -e "${GREEN}✅ Swap space created and enabled${NC}"
else
    echo -e "${GREEN}✅ Swap space already exists${NC}"
fi

# Verify swap
echo -e "${YELLOW}📊 Memory status:${NC}"
free -h

# Create directories
echo -e "${YELLOW}📁 Creating application directories...${NC}"
mkdir -p ~/apps
cd ~/apps

# Display versions
echo ""
echo -e "${GREEN}✅ Installation complete!${NC}"
echo ""
echo "Installed versions:"
docker --version
docker-compose --version
git --version
echo ""
echo "Memory available:"
free -h
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT: Log out and log back in for docker group changes to take effect${NC}"
echo ""
echo "Next steps:"
echo "1. Log out: exit"
echo "2. Log back in: ssh -i your-key.pem ec2-user@YOUR_EC2_IP"
echo "3. Clone repository: git clone https://github.com/bhagirathinl/taskmanagement_chatbot.git"
echo "4. cd taskmanagement_chatbot"
echo "5. Copy .env.production.example to .env.production and configure it"
echo "6. Run: docker-compose -f docker-compose.freetier.yml up -d"
echo ""
echo -e "${GREEN}🆓 Your free tier instance is ready!${NC}"
