# Quick Start Deployment Guide

**Deploy to AWS in 15 minutes**

## Prerequisites

- AWS Account with EC2 access
- OpenAI API Key ([Get one here](https://platform.openai.com/api-keys))
- Akool API Token ([Get one here](https://akool.com))
- SSH Key pair for AWS EC2

---

## Step-by-Step Deployment

### 1. Launch EC2 Instance (5 minutes)

1. Go to [AWS EC2 Console](https://console.aws.amazon.com/ec2/)
2. Click **Launch Instance**
3. Configure:
   - **Name**: `taskmanagement-chatbot`
   - **AMI**: Amazon Linux 2023
   - **Instance Type**: `t3.large` (or `t3.medium` for light usage)
   - **Key pair**: Select or create new
   - **Security Group**: Create new with these ports:
     - SSH (22) - Your IP only
     - HTTP (80) - 0.0.0.0/0
     - HTTPS (443) - 0.0.0.0/0
   - **Storage**: 30 GB
4. Click **Launch**
5. **Allocate Elastic IP** (optional but recommended):
   - EC2 → Elastic IPs → Allocate → Associate with your instance

### 2. Connect to Server (2 minutes)

```bash
chmod 400 your-key.pem
ssh -i your-key.pem ec2-user@YOUR_EC2_PUBLIC_IP
```

### 3. Setup Server (3 minutes)

```bash
# Run this single command to setup everything
curl -fsSL https://raw.githubusercontent.com/bhagirathinl/taskmanagement_chatbot/main/deployment/aws/setup-ec2.sh | bash

# Log out and log back in
exit
```

SSH back in:
```bash
ssh -i your-key.pem ec2-user@YOUR_EC2_PUBLIC_IP
```

### 4. Deploy Application (5 minutes)

```bash
# Clone repository
git clone https://github.com/bhagirathinl/taskmanagement_chatbot.git
cd taskmanagement_chatbot

# Configure environment
cp .env.production.example .env.production
nano .env.production
```

**Edit these values**:
```bash
MYSQL_ROOT_PASSWORD=YourStrongPassword123!
MYSQL_PASSWORD=YourDBPassword456!
DOMAIN=YOUR_EC2_PUBLIC_IP
OPENAI_API_KEY=sk-proj-your_key_here
VITE_OPENAPI_TOKEN=your_akool_token_here
VITE_TASK_API_BASE_URL=http://YOUR_EC2_PUBLIC_IP/api/tasks
```

Save (Ctrl+X, Y, Enter) and deploy:

```bash
chmod +x deployment/aws/deploy.sh
./deployment/aws/deploy.sh
```

Wait 2-3 minutes for all services to start.

### 5. Access Your Application

Open in browser:
- **Chatbot UI**: `http://YOUR_EC2_PUBLIC_IP`
- **Avatar UI**: `http://YOUR_EC2_PUBLIC_IP/streaming/avatar`
- **Health Check**: `http://YOUR_EC2_PUBLIC_IP/health`

---

## Testing Your Deployment

### Test Chatbot

1. Go to `http://YOUR_EC2_PUBLIC_IP`
2. Type: "Show me all tasks"
3. Should see task list from database

### Test Avatar

1. Go to `http://YOUR_EC2_PUBLIC_IP/streaming/avatar`
2. Configure avatar and voice
3. Click "Start Session"
4. Ask: "What are the overdue tasks?"

---

## Common Commands

```bash
# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Check status
docker-compose -f docker-compose.prod.yml ps

# Restart all
docker-compose -f docker-compose.prod.yml restart

# Stop all
docker-compose -f docker-compose.prod.yml down

# Update application
cd ~/taskmanagement_chatbot
git pull
./deployment/aws/deploy.sh
```

---

## Troubleshooting

**Can't access application?**
- Check Security Group allows HTTP (port 80)
- Verify containers are running: `docker-compose -f docker-compose.prod.yml ps`

**Database errors?**
- Check environment variables: `cat .env.production`
- View MySQL logs: `docker-compose -f docker-compose.prod.yml logs mysql`

**Out of memory?**
- Upgrade to `t3.xlarge` instance
- Or add swap: See full deployment guide

---

## Cost Estimate

- **t3.medium**: ~$30/month (light demo)
- **t3.large**: ~$60/month (recommended)
- **t3.xlarge**: ~$140/month (heavy usage)

Plus data transfer: ~$5-10/month

---

## Next Steps

1. **Add Domain & SSL**: See [AWS_DEPLOYMENT_GUIDE.md](AWS_DEPLOYMENT_GUIDE.md#domain--ssl-setup)
2. **Setup Monitoring**: Enable CloudWatch alarms
3. **Backup Database**: Schedule automated backups
4. **Production Hardening**: Implement security best practices

---

## Need Help?

Full documentation: [AWS_DEPLOYMENT_GUIDE.md](AWS_DEPLOYMENT_GUIDE.md)

GitHub Issues: https://github.com/bhagirathinl/taskmanagement_chatbot/issues

---

**🎉 Your demo is live! Share the URL and start demonstrating!**
