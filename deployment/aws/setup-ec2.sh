#!/bin/bash

#######################################
# AWS EC2 Instance Setup Script
# Install Docker and dependencies
#######################################

set -e

echo "🔧 Setting up EC2 instance for Docker deployment..."

# Update system
echo "📦 Updating system packages..."
sudo yum update -y

# Install Docker
echo "🐳 Installing Docker..."
sudo yum install -y docker

# Start Docker service
sudo systemctl start docker
sudo systemctl enable docker

# Add current user to docker group
sudo usermod -a -G docker ec2-user

# Install Docker Compose
echo "🔨 Installing Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Git
echo "📚 Installing Git..."
sudo yum install -y git

# Install useful tools
echo "🛠️ Installing additional tools..."
sudo yum install -y htop vim curl wget

# Configure firewall (if using)
echo "🔥 Configuring firewall..."
# Uncomment if you need to configure firewall
# sudo firewall-cmd --permanent --add-service=http
# sudo firewall-cmd --permanent --add-service=https
# sudo firewall-cmd --reload

# Create directories
echo "📁 Creating application directories..."
mkdir -p ~/apps
cd ~/apps

# Display versions
echo ""
echo "✅ Installation complete!"
echo ""
echo "Installed versions:"
docker --version
docker-compose --version
git --version
echo ""
echo "⚠️  IMPORTANT: Log out and log back in for docker group changes to take effect"
echo ""
echo "Next steps:"
echo "1. Log out and log back in (or run: newgrp docker)"
echo "2. Clone your repository: git clone https://github.com/bhagirathinl/taskmanagement_chatbot.git"
echo "3. cd taskmanagement_chatbot"
echo "4. Copy .env.production.example to .env.production and configure it"
echo "5. Run: ./deployment/aws/deploy.sh"
