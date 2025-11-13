# AWS EC2 Deployment Guide

Complete guide to deploy the Task Management Chatbot application on AWS EC2 for production demo.

## Table of Contents
- [Prerequisites](#prerequisites)
- [AWS Setup](#aws-setup)
- [Server Configuration](#server-configuration)
- [Application Deployment](#application-deployment)
- [Domain & SSL Setup (Optional)](#domain--ssl-setup)
- [Monitoring & Maintenance](#monitoring--maintenance)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Items
- [ ] AWS Account
- [ ] OpenAI API Key (for chatbot functionality)
- [ ] Akool API Token (for avatar functionality)
- [ ] SSH Key pair for EC2 access
- [ ] Domain name (optional, for production URL)

### Estimated Costs
- **EC2 Instance (t3.large)**: ~$60-75/month
- **Data Transfer**: ~$5-10/month
- **Total**: ~$70-85/month

> **Tip**: Use t3.medium ($30/month) for light demo loads, or t3.xlarge ($140/month) for heavy usage

---

## AWS Setup

### Step 1: Launch EC2 Instance

1. **Login to AWS Console**
   - Go to [AWS EC2 Console](https://console.aws.amazon.com/ec2/)

2. **Launch Instance**
   - Click "Launch Instance"
   - **Name**: `taskmanagement-chatbot-demo`

3. **Instance Configuration**:
   ```
   AMI: Amazon Linux 2023 (or Ubuntu 22.04 LTS)
   Instance Type: t3.large (2 vCPU, 8 GB RAM)

   Key pair: Create new or select existing

   Network Settings:
   - Auto-assign public IP: Enable
   - Firewall (Security Group): Create new

   Storage: 30 GB gp3 (General Purpose SSD)
   ```

4. **Security Group Configuration**:
   - **Name**: `chatbot-security-group`
   - **Inbound Rules**:
     ```
     SSH     | TCP | 22   | My IP (your IP address)
     HTTP    | TCP | 80   | 0.0.0.0/0
     HTTPS   | TCP | 443  | 0.0.0.0/0
     Custom  | TCP | 3000 | 0.0.0.0/0 (Tasks API - optional for testing)
     Custom  | TCP | 4000 | 0.0.0.0/0 (Chatbot API - optional for testing)
     ```

   > **Security Note**: For production, restrict SSH access to your IP only

5. **Click "Launch Instance"**

### Step 2: Allocate Elastic IP (Recommended)

1. Go to **EC2 → Elastic IPs**
2. Click **Allocate Elastic IP address**
3. Select the allocated IP
4. Click **Actions → Associate Elastic IP address**
5. Select your instance and associate

> **Why?** Elastic IP ensures your IP address doesn't change if you stop/start the instance

---

## Server Configuration

### Step 1: Connect to EC2 Instance

```bash
# Replace with your key file and instance IP
chmod 400 your-key.pem
ssh -i your-key.pem ec2-user@YOUR_EC2_PUBLIC_IP
```

For Ubuntu:
```bash
ssh -i your-key.pem ubuntu@YOUR_EC2_PUBLIC_IP
```

### Step 2: Run Setup Script

```bash
# Download setup script
curl -O https://raw.githubusercontent.com/bhagirathinl/taskmanagement_chatbot/main/deployment/aws/setup-ec2.sh

# Make it executable
chmod +x setup-ec2.sh

# Run setup
./setup-ec2.sh

# Log out and log back in for docker group changes
exit
```

Then SSH back in and verify:
```bash
docker --version
docker-compose --version
```

---

## Application Deployment

### Step 1: Clone Repository

```bash
cd ~
git clone https://github.com/bhagirathinl/taskmanagement_chatbot.git
cd taskmanagement_chatbot
```

### Step 2: Configure Environment Variables

```bash
# Copy production environment template
cp .env.production.example .env.production

# Edit with your actual values
nano .env.production
```

**Required Configuration**:
```bash
# Database (change these passwords!)
MYSQL_ROOT_PASSWORD=your_strong_root_password_here
MYSQL_DATABASE=chatbot_db
MYSQL_USER=chatbot_user
MYSQL_PASSWORD=your_strong_db_password_here

# Your EC2 Public IP or Domain
DOMAIN=xx.xx.xx.xx  # Replace with your Elastic IP or domain

# OpenAI API Key (get from https://platform.openai.com/api-keys)
OPENAI_API_KEY=sk-proj-your_key_here

# Akool API Token (get from https://akool.com)
VITE_OPENAPI_HOST=https://openapi.akool.com
VITE_OPENAPI_TOKEN=your_akool_token_here
VITE_SERVER_BASE=/streaming/avatar

# Task API URLs (update with your domain/IP)
API_BASE_URL=http://app:3000
VITE_TASK_API_BASE_URL=http://YOUR_EC2_IP/api/tasks

# Production settings
NODE_ENV=production
ENABLE_TTS=true
TTS_VOICE=nova
```

Save and exit (Ctrl+X, then Y, then Enter)

### Step 3: Deploy Application

```bash
# Make deployment script executable
chmod +x deployment/aws/deploy.sh

# Run deployment
./deployment/aws/deploy.sh
```

The script will:
- Build all Docker images
- Start all services
- Run health checks
- Display access URLs

### Step 4: Verify Deployment

Check running containers:
```bash
docker-compose -f docker-compose.prod.yml ps
```

All services should show status as "Up" or "Up (healthy)"

View logs:
```bash
# All logs
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f chatbot
```

### Step 5: Access Your Application

Open in browser:
```
Chatbot UI:    http://YOUR_EC2_PUBLIC_IP
Avatar UI:     http://YOUR_EC2_PUBLIC_IP/streaming/avatar
Health Check:  http://YOUR_EC2_PUBLIC_IP/health
```

---

## Domain & SSL Setup (Optional)

### Option 1: Using Let's Encrypt (Free SSL)

1. **Point your domain to EC2**:
   - Add an A record in your DNS settings
   - Point it to your Elastic IP

2. **Install Certbot**:
```bash
sudo yum install -y certbot python3-certbot-nginx
```

3. **Get SSL Certificate**:
```bash
# Replace with your domain
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

4. **Update nginx configuration**:
   - Edit `nginx/nginx.conf`
   - Uncomment the HTTPS server block
   - Update certificate paths

5. **Restart nginx**:
```bash
docker-compose -f docker-compose.prod.yml restart nginx
```

### Option 2: Using AWS Certificate Manager + ALB

For production-grade setup, use Application Load Balancer with ACM certificate. See AWS ALB documentation.

---

## Monitoring & Maintenance

### View Logs

```bash
# Real-time logs for all services
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f chatbot

# Last 100 lines
docker-compose -f docker-compose.prod.yml logs --tail=100
```

### Check Resource Usage

```bash
# CPU and Memory usage
docker stats

# Disk usage
df -h

# Docker disk usage
docker system df
```

### Database Backup

```bash
# Create backup directory
mkdir -p ~/backups

# Backup database
docker exec chatbot-mysql mysqldump -u root -p${MYSQL_ROOT_PASSWORD} chatbot_db > ~/backups/backup_$(date +%Y%m%d_%H%M%S).sql

# Restore from backup
docker exec -i chatbot-mysql mysql -u root -p${MYSQL_ROOT_PASSWORD} chatbot_db < ~/backups/backup_file.sql
```

### Update Application

```bash
cd ~/taskmanagement_chatbot

# Pull latest code
git pull origin main

# Rebuild and restart
./deployment/aws/deploy.sh
```

### Stop Application

```bash
docker-compose -f docker-compose.prod.yml down
```

### Restart Application

```bash
docker-compose -f docker-compose.prod.yml up -d
```

---

## Troubleshooting

### Issue: Can't access application

**Check**:
```bash
# Verify containers are running
docker-compose -f docker-compose.prod.yml ps

# Check nginx logs
docker-compose -f docker-compose.prod.yml logs nginx

# Test from inside EC2
curl http://localhost
```

**Solution**: Check Security Group allows HTTP (port 80)

### Issue: Database connection failed

**Check**:
```bash
# Check MySQL logs
docker-compose -f docker-compose.prod.yml logs mysql

# Test database connection
docker exec chatbot-mysql mysql -u root -p${MYSQL_ROOT_PASSWORD} -e "SELECT 1"
```

**Solution**: Verify environment variables in .env.production

### Issue: Out of memory

**Check**:
```bash
free -h
docker stats
```

**Solution**: Upgrade to larger instance type (t3.xlarge) or add swap space

### Issue: OpenAI API errors

**Check**:
```bash
# Check chatbot logs
docker-compose -f docker-compose.prod.yml logs chatbot | grep -i error
```

**Solution**: Verify OPENAI_API_KEY is correct and has credits

### Issue: CORS errors

**Check**:
```bash
# Check nginx logs
docker-compose -f docker-compose.prod.yml logs nginx

# Verify CORS headers
curl -I http://localhost/api/tasks
```

**Solution**: Verify DOMAIN is set correctly in .env.production

---

## Performance Optimization

### Enable Swap (for t3.medium instances)

```bash
sudo dd if=/dev/zero of=/swapfile bs=1M count=4096
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### Clean Up Docker

```bash
# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune

# Full cleanup
docker system prune -a --volumes
```

---

## Cost Optimization

### Use Spot Instances

For non-critical demos, use Spot Instances to save 70% on costs.

### Stop Instance When Not in Use

```bash
# Stop instance (data persists)
aws ec2 stop-instances --instance-ids i-1234567890abcdef0

# Start instance
aws ec2 start-instances --instance-ids i-1234567890abcdef0
```

### Use Smaller Instance

Start with t3.medium ($30/month) and scale up if needed.

---

## Security Best Practices

1. **Restrict SSH Access**
   - Security Group: Allow SSH only from your IP

2. **Use Secrets Manager**
   - Store API keys in AWS Secrets Manager
   - Use IAM roles instead of hardcoded credentials

3. **Enable CloudWatch Monitoring**
   - Monitor CPU, Memory, Disk usage
   - Set up alerts for high resource usage

4. **Regular Updates**
   ```bash
   sudo yum update -y
   docker-compose -f docker-compose.prod.yml pull
   ```

5. **Database Security**
   - Don't expose MySQL port (3306) externally
   - Use strong passwords
   - Regular backups

---

## Support

For issues or questions:
- GitHub Issues: https://github.com/bhagirathinl/taskmanagement_chatbot/issues
- AWS Support: https://console.aws.amazon.com/support/

---

## Quick Reference

```bash
# View status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f [service]

# Restart service
docker-compose -f docker-compose.prod.yml restart [service]

# Stop all
docker-compose -f docker-compose.prod.yml down

# Start all
docker-compose -f docker-compose.prod.yml up -d

# Rebuild and restart
./deployment/aws/deploy.sh
```

---

**🎉 Deployment Complete! Your application is now live on AWS!**
