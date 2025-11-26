# AWS Free Tier Deployment (Demo)

Deploy your Task Management Chatbot on AWS **100% FREE** using the free tier!

## 🆓 What You Get for Free

**AWS Free Tier (First 12 Months)**:
- ✅ t2.micro or t3.micro EC2 instance (1 vCPU, 1 GB RAM)
- ✅ 750 hours/month (enough to run 24/7)
- ✅ 30 GB EBS storage
- ✅ 15 GB data transfer out per month
- ✅ **Total Cost: $0/month** (within limits)

> **Perfect for**: Demos, testing, learning, portfolio projects

---

## ⚠️ Free Tier Limitations

Due to 1GB RAM limit, you can run:
- **Option 1**: Tasks API + Chatbot + Chatbot UI (recommended for demo)
- **Option 2**: Tasks API + Simple Avatar UI (if you prefer avatar demo)

**Cannot run both** chatbot and avatar simultaneously on free tier.

---

## 🚀 Quick Deploy (20 minutes)

### Step 1: Launch Free Tier EC2 Instance

1. Go to [AWS EC2 Console](https://console.aws.amazon.com/ec2/)
2. Click **Launch Instance**
3. Configure:

   ```
   Name: taskmanagement-chatbot-demo

   AMI: Amazon Linux 2023 AMI (Free tier eligible)

   Instance Type: t2.micro or t3.micro (Free tier eligible)
   ⚠️ Make sure it says "Free tier eligible"

   Key pair: Create new or select existing

   Network Settings:
   - Auto-assign public IP: Enable
   - Firewall (Security Group): Create new
     - SSH (22) - Your IP only
     - HTTP (80) - 0.0.0.0/0
     - Custom TCP (4000) - 0.0.0.0/0 (for chatbot API)

   Storage: 30 GB gp3 (Free tier eligible)
   ```

4. Click **Launch Instance**

### Step 2: Connect to Instance

```bash
chmod 400 your-key.pem
ssh -i your-key.pem ec2-user@YOUR_EC2_PUBLIC_IP
```

### Step 3: Setup Server & Add Swap

Free tier has only 1GB RAM, so we'll add swap space:

```bash
# Download and run setup
curl -fsSL https://raw.githubusercontent.com/bhagirathinl/taskmanagement_chatbot/main/deployment/aws/setup-freetier.sh | bash

# Log out and log back in
exit
```

SSH back in:
```bash
ssh -i your-key.pem ec2-user@YOUR_EC2_PUBLIC_IP
```

### Step 4: Clone & Configure

```bash
# Clone repository
git clone https://github.com/bhagirathinl/taskmanagement_chatbot.git
cd taskmanagement_chatbot

# Copy free tier environment template
cp .env.production.example .env.production

# Edit configuration
nano .env.production
```

**Minimal Configuration for Free Tier**:
```bash
# Database (use simple passwords for demo)
MYSQL_ROOT_PASSWORD=DemoRoot123
MYSQL_DATABASE=chatbot_db
MYSQL_USER=chatbot_user
MYSQL_PASSWORD=DemoPass123

# Your EC2 Public IP
DOMAIN=YOUR_EC2_PUBLIC_IP

# OpenAI API Key (get from https://platform.openai.com/api-keys)
OPENAI_API_KEY=sk-proj-your_key_here

# Disable TTS to save memory
ENABLE_TTS=false

# For Simple Avatar UI (if you choose Option 2)
# AKOOL_API_TOKEN=your_akool_api_token_here
# AVATAR_ID=dvp_Alinna_realisticbg_20241224
# VOICE_ID=21m00Tcm4TlvDq8ikWAM
```

Save (Ctrl+X, Y, Enter)

### Step 5: Choose Your Demo Mode

**Option 1: Chatbot Demo** (Recommended - Uses less memory)
```bash
# Deploy chatbot version
docker-compose -f docker-compose.freetier.yml up -d
```

**Option 2: Simple Avatar Demo**
```bash
# Edit docker-compose.freetier.yml
nano docker-compose.freetier.yml

# Comment out chatbot services (add # at start of chatbot and chatbot-ui sections)
# Uncomment simple-avatar-backend and simple-avatar-frontend sections
# Save and exit

# Deploy avatar version
docker-compose -f docker-compose.freetier.yml up -d
```

### Step 6: Wait for Services to Start

```bash
# This may take 5-10 minutes on free tier
# Watch the logs
docker-compose -f docker-compose.freetier.yml logs -f

# Wait until you see:
# "✅ Connected to MySQL"
# "🚀 Chatbot service running on port 4000"
```

Press Ctrl+C to exit logs

### Step 7: Access Your Demo

**For Chatbot Demo**:
- Open: `http://YOUR_EC2_PUBLIC_IP`
- Try: "Show me all tasks"

**For Avatar Demo**:
- Open: `http://YOUR_EC2_PUBLIC_IP`
- Avatar will auto-start and you can begin chatting

---

## 💡 Free Tier Optimization Tips

### 1. Add Swap Space (Already done in setup script)
```bash
# Verify swap is active
free -h
# Should show ~2GB swap
```

### 2. Monitor Resource Usage
```bash
# Check memory
free -h

# Check Docker stats
docker stats

# Check disk space
df -h
```

### 3. Restart if Memory Issues
```bash
cd ~/taskmanagement_chatbot
docker-compose -f docker-compose.freetier.yml restart
```

### 4. Stop When Not Using
```bash
# Stop to save resources
docker-compose -f docker-compose.freetier.yml stop

# Start when needed
docker-compose -f docker-compose.freetier.yml start
```

---

## 🔧 Common Commands

```bash
# View logs
docker-compose -f docker-compose.freetier.yml logs -f

# Check status
docker-compose -f docker-compose.freetier.yml ps

# Restart all
docker-compose -f docker-compose.freetier.yml restart

# Stop all
docker-compose -f docker-compose.freetier.yml down

# Start all
docker-compose -f docker-compose.freetier.yml up -d
```

---

## 🐛 Troubleshooting

### Out of Memory Errors

**Check swap**:
```bash
free -h
```

**If swap not active**:
```bash
curl -fsSL https://raw.githubusercontent.com/bhagirathinl/taskmanagement_chatbot/main/deployment/aws/setup-swap.sh | bash
```

**Restart services**:
```bash
docker-compose -f docker-compose.freetier.yml restart
```

### Containers Keep Restarting

**Check logs**:
```bash
docker-compose -f docker-compose.freetier.yml logs mysql
docker-compose -f docker-compose.freetier.yml logs app
docker-compose -f docker-compose.freetier.yml logs chatbot
```

**Solution**: Wait longer (5-10 minutes). Free tier is slow to start.

### Can't Access Application

**Check Security Group**:
- Port 80 (HTTP) should be open to 0.0.0.0/0
- Port 4000 should be open for chatbot API

**Check if running**:
```bash
docker-compose -f docker-compose.freetier.yml ps
# All should show "Up"
```

### Disk Space Full

**Clean up Docker**:
```bash
docker system prune -a --volumes
```

---

## 📊 Performance Expectations

On free tier (t2.micro/t3.micro):
- ⏱️ **Startup Time**: 5-10 minutes
- 🐌 **Response Time**: 2-5 seconds (slower than paid tiers)
- 👥 **Concurrent Users**: 1-2 users max
- 📝 **Perfect for**: Personal demos, testing, portfolio

> **Tip**: For production or faster performance, upgrade to t3.small ($15/month)

---

## 💰 Staying Within Free Tier

### Free Tier Limits (First 12 Months)

✅ **Included Free**:
- 750 hours/month EC2 (t2.micro or t3.micro)
- 30 GB EBS storage
- 15 GB data transfer OUT

⚠️ **Avoid Charges**:
- Don't use instance types other than t2.micro/t3.micro
- Don't exceed 30 GB storage
- Don't exceed 15 GB/month data transfer
- Stop instance when not demoing

### Monitor Your Usage

1. Go to [AWS Billing Dashboard](https://console.aws.amazon.com/billing/)
2. Check "Free Tier Usage"
3. Set up billing alerts

---

## 🎯 Demo Checklist

Before your demo:
- [ ] Instance is running
- [ ] All containers are healthy: `docker-compose -f docker-compose.freetier.yml ps`
- [ ] Can access application via browser
- [ ] Database has sample data
- [ ] OpenAI API key has credits
- [ ] Security Group allows HTTP (port 80)

---

## 🔄 Switch Between Chatbot & Avatar

### Switch to Simple Avatar:
```bash
cd ~/taskmanagement_chatbot

# Stop current setup
docker-compose -f docker-compose.freetier.yml down

# Edit config
nano docker-compose.freetier.yml
# Comment out chatbot and chatbot-ui sections
# Uncomment simple-avatar-backend and simple-avatar-frontend sections

# Start avatar version
docker-compose -f docker-compose.freetier.yml up -d
```

### Switch Back to Chatbot:
```bash
cd ~/taskmanagement_chatbot
docker-compose -f docker-compose.freetier.yml down
nano docker-compose.freetier.yml
# Comment simple-avatar sections, uncomment chatbot sections
docker-compose -f docker-compose.freetier.yml up -d
```

---

## 📅 After 12 Months (Free Tier Expires)

Options when free tier ends:
1. **Pay**: ~$8-10/month for t2.micro
2. **Upgrade**: t3.small ($15/month) for better performance
3. **Delete**: Stop instance to avoid charges
4. **New Account**: Create new AWS account (not recommended)

---

## 🎓 Cost Optimization Tips

1. **Stop When Not Using**:
   ```bash
   # Stop instance (no charges while stopped)
   aws ec2 stop-instances --instance-ids i-xxxxx

   # Or from AWS Console: EC2 → Instances → Stop
   ```

2. **Delete When Done**:
   ```bash
   # From AWS Console:
   # EC2 → Instances → Terminate
   # EC2 → Volumes → Delete
   ```

3. **Use Elastic IP** (Optional):
   - Free if associated with running instance
   - $0.005/hour if NOT associated
   - Release when not needed

---

## 📞 Support & Resources

- **Setup Issues**: [GitHub Issues](https://github.com/bhagirathinl/taskmanagement_chatbot/issues)
- **AWS Free Tier**: [AWS Free Tier FAQ](https://aws.amazon.com/free/free-tier-faqs/)
- **Billing Alerts**: [AWS Billing Dashboard](https://console.aws.amazon.com/billing/)

---

## 🎉 Success!

You now have a **FREE** demo running on AWS!

**Share your demo**:
- Chatbot: `http://YOUR_EC2_IP`
- Avatar: `http://YOUR_EC2_IP` (when running simple-avatar config)

**Demo Tips**:
- Test queries: "Show all tasks", "What are overdue tasks?", "Show task 1"
- Keep instance running during demo period
- Stop when not needed to save resources

---

## ⬆️ Upgrade Path

When you need better performance:

| Instance | vCPU | RAM | Cost/Month | Performance |
|----------|------|-----|------------|-------------|
| t2.micro | 1 | 1GB | FREE → $8 | Demo only |
| t3.small | 2 | 2GB | $15 | Light production |
| t3.medium | 2 | 4GB | $30 | Production |
| t3.large | 2 | 8GB | $60 | High traffic |

---

**🎊 Your free demo is live! Enjoy!**
