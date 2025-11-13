# Production Deployment Guide

Complete production-ready deployment configuration for the Task Management Chatbot application.

## 📋 Overview

This application is production-ready with:
- ✅ Multi-stage Docker builds for optimized images
- ✅ Nginx reverse proxy with SSL support
- ✅ Security hardening (rate limiting, security headers)
- ✅ Health checks and monitoring
- ✅ Production environment configuration
- ✅ Automated deployment scripts
- ✅ Database backup strategies

---

## 🚀 Quick Deploy

**Want to deploy quickly?** Follow the [Quick Start Guide](deployment/QUICK_START.md)

**Time to deploy**: ~15 minutes

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [Quick Start](deployment/QUICK_START.md) | Deploy in 15 minutes |
| [AWS Deployment Guide](deployment/AWS_DEPLOYMENT_GUIDE.md) | Complete AWS EC2 setup |
| [SSL Setup](deployment/SSL_SETUP.md) | HTTPS configuration |

---

## 🏗️ Architecture

```
┌─────────────┐
│   Internet  │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│  Nginx (Port 80)│  ← Reverse Proxy, Rate Limiting, SSL
└────────┬────────┘
         │
    ┌────┴────┬─────────┬──────────┐
    │         │         │          │
    ▼         ▼         ▼          ▼
┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│Chatbot │ │Avatar  │ │Chatbot │ │ Tasks  │
│  UI    │ │  UI    │ │Service │ │  API   │
└────────┘ └────────┘ └───┬────┘ └───┬────┘
                           │          │
                           └────┬─────┘
                                │
                                ▼
                          ┌──────────┐
                          │  MySQL   │
                          │ Database │
                          └──────────┘
```

---

## 🔧 Production Features

### Security
- Non-root Docker containers
- Rate limiting (10 req/s for APIs, 50 req/s general)
- Security headers (X-Frame-Options, X-XSS-Protection, etc.)
- CORS configuration
- SSL/TLS support
- Environment variable isolation

### Performance
- Multi-stage Docker builds (smaller images)
- Gzip compression
- Static asset caching
- Connection pooling for database
- Health checks for auto-recovery

### Monitoring
- Health check endpoints
- Structured logging
- Resource usage tracking
- Database health monitoring

### Reliability
- Automatic container restart
- Database connection retry logic
- Graceful shutdown
- Volume persistence for data

---

## 📦 What's Included

```
├── .env.production.example          # Production environment template
├── docker-compose.prod.yml          # Production Docker Compose
├── nginx/
│   ├── nginx.conf                   # Nginx configuration
│   └── ssl/                         # SSL certificates directory
├── deployment/
│   ├── QUICK_START.md              # 15-minute deployment guide
│   ├── AWS_DEPLOYMENT_GUIDE.md     # Complete AWS guide
│   ├── SSL_SETUP.md                # HTTPS setup guide
│   └── aws/
│       ├── setup-ec2.sh            # EC2 setup script
│       └── deploy.sh               # Deployment script
├── app/Dockerfile.prod             # Production Dockerfile (Tasks API)
├── chatbot/Dockerfile.prod         # Production Dockerfile (Chatbot)
├── chatbot-ui/Dockerfile.prod      # Production Dockerfile (UI)
└── avatar-ui/Dockerfile.prod       # Production Dockerfile (Avatar)
```

---

## 🎯 Deployment Options

### Option 1: AWS EC2 (Recommended for Demo)
**Best for**: Quick deployment, full control, cost-effective

- **Cost**: ~$60-75/month (t3.large)
- **Setup Time**: 15 minutes
- **Difficulty**: Easy
- **Guide**: [AWS Deployment Guide](deployment/AWS_DEPLOYMENT_GUIDE.md)

### Option 2: AWS ECS/Fargate
**Best for**: Auto-scaling, managed infrastructure

- **Cost**: ~$80-120/month
- **Setup Time**: 30-45 minutes
- **Difficulty**: Medium
- **Scaling**: Automatic

### Option 3: DigitalOcean Droplet
**Best for**: Simplicity, fixed pricing

- **Cost**: ~$24-48/month
- **Setup Time**: 20 minutes
- **Difficulty**: Easy
- **Similar to**: AWS EC2 deployment

### Option 4: Railway/Render
**Best for**: Zero DevOps, GitHub integration

- **Cost**: ~$30-50/month
- **Setup Time**: 10 minutes
- **Difficulty**: Very Easy
- **Auto-deploy**: From GitHub

---

## 💰 Cost Estimates

### AWS EC2
| Instance Type | vCPU | RAM | Cost/Month | Use Case |
|---------------|------|-----|------------|----------|
| t3.medium     | 2    | 4GB | ~$30       | Light demo |
| t3.large      | 2    | 8GB | ~$60       | **Recommended** |
| t3.xlarge     | 4    | 16GB| ~$140      | Heavy usage |

### Additional Costs
- Data Transfer: ~$5-10/month
- Elastic IP: Free (when attached)
- EBS Storage: ~$3/month (30GB)
- **Total**: ~$70-85/month for recommended setup

---

## 🔐 Security Checklist

Before deploying to production:

- [ ] Change all default passwords in `.env.production`
- [ ] Use strong passwords (16+ characters, mixed case, numbers, symbols)
- [ ] Restrict SSH access to your IP only
- [ ] Don't expose database port (3306) externally
- [ ] Enable SSL/HTTPS (use Let's Encrypt)
- [ ] Set up automatic security updates
- [ ] Configure firewall rules
- [ ] Use secrets manager for API keys (AWS Secrets Manager)
- [ ] Enable CloudWatch monitoring
- [ ] Set up log rotation
- [ ] Regular database backups
- [ ] Keep Docker images updated

---

## 📊 Monitoring & Maintenance

### Health Checks

```bash
# Application health
curl http://your-domain.com/health

# Individual services
docker-compose -f docker-compose.prod.yml ps
```

### Logs

```bash
# All logs
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f chatbot

# Last 100 lines
docker-compose -f docker-compose.prod.yml logs --tail=100
```

### Resource Monitoring

```bash
# Container stats
docker stats

# Disk usage
df -h

# Docker disk usage
docker system df
```

### Database Backup

```bash
# Create backup
docker exec chatbot-mysql mysqldump -u root -p${MYSQL_ROOT_PASSWORD} chatbot_db > backup_$(date +%Y%m%d).sql

# Restore backup
docker exec -i chatbot-mysql mysql -u root -p${MYSQL_ROOT_PASSWORD} chatbot_db < backup_file.sql
```

---

## 🔄 Updates & Maintenance

### Update Application

```bash
cd ~/taskmanagement_chatbot
git pull origin main
./deployment/aws/deploy.sh
```

### Update System Packages

```bash
# Amazon Linux / RHEL / CentOS
sudo yum update -y

# Ubuntu
sudo apt update && sudo apt upgrade -y
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

## 🆘 Troubleshooting

### Application Not Accessible

1. Check containers are running:
   ```bash
   docker-compose -f docker-compose.prod.yml ps
   ```

2. Check nginx logs:
   ```bash
   docker-compose -f docker-compose.prod.yml logs nginx
   ```

3. Verify Security Group allows port 80/443

### Database Connection Errors

1. Check MySQL is healthy:
   ```bash
   docker-compose -f docker-compose.prod.yml logs mysql
   ```

2. Verify environment variables:
   ```bash
   cat .env.production | grep MYSQL
   ```

3. Test database connection:
   ```bash
   docker exec chatbot-mysql mysql -u root -p${MYSQL_ROOT_PASSWORD} -e "SELECT 1"
   ```

### Out of Memory

1. Check resource usage:
   ```bash
   free -h
   docker stats
   ```

2. Solutions:
   - Upgrade to larger instance (t3.xlarge)
   - Add swap space
   - Optimize application

### SSL Certificate Issues

See [SSL Setup Guide](deployment/SSL_SETUP.md#troubleshooting)

---

## 🎓 Best Practices

### 1. Environment Management
- Use `.env.production` for production
- Never commit `.env` files to git
- Use AWS Secrets Manager for sensitive data

### 2. Database
- Regular backups (automated daily)
- Test restore procedures
- Monitor disk space
- Use connection pooling

### 3. Monitoring
- Set up CloudWatch alarms
- Monitor error rates
- Track response times
- Set up log aggregation

### 4. Security
- Regular security updates
- Rotate credentials periodically
- Use SSL/TLS
- Implement rate limiting
- Regular security audits

### 5. Performance
- Use CDN for static assets (CloudFront)
- Implement caching strategies
- Optimize database queries
- Monitor and scale as needed

---

## 🚦 Production Readiness Checklist

### Infrastructure
- [ ] EC2 instance launched with Elastic IP
- [ ] Security Groups configured
- [ ] SSH key pair secured
- [ ] Domain name configured (optional)
- [ ] SSL certificate installed (recommended)

### Application
- [ ] Environment variables configured
- [ ] All services deployed and healthy
- [ ] Database initialized with schema
- [ ] Health checks passing
- [ ] Logs accessible and monitoring

### Security
- [ ] Firewall rules configured
- [ ] Strong passwords set
- [ ] API keys secured
- [ ] SSL/HTTPS enabled
- [ ] Rate limiting active

### Monitoring
- [ ] Health check endpoints working
- [ ] Log aggregation setup
- [ ] Resource monitoring enabled
- [ ] Alerts configured

### Backup & Recovery
- [ ] Database backup script ready
- [ ] Backup schedule configured
- [ ] Recovery procedure documented
- [ ] Disaster recovery plan

---

## 📞 Support

- **Documentation**: [deployment/](deployment/)
- **Issues**: [GitHub Issues](https://github.com/bhagirathinl/taskmanagement_chatbot/issues)
- **AWS Support**: [AWS Console](https://console.aws.amazon.com/support/)

---

## 📝 License

This project is licensed under the MIT License.

---

**🎉 Ready to deploy? Start with the [Quick Start Guide](deployment/QUICK_START.md)!**
