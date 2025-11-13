# SSL/HTTPS Setup Guide

Add SSL certificate to your deployment for secure HTTPS access.

## Prerequisites

- Deployed application on AWS EC2
- Domain name pointed to your EC2 Elastic IP
- SSH access to your EC2 instance

---

## Option 1: Let's Encrypt (Free SSL) - Recommended

### Step 1: Point Domain to EC2

1. Go to your domain registrar (GoDaddy, Namecheap, etc.)
2. Add DNS A Record:
   ```
   Type: A
   Name: @ (or your subdomain)
   Value: YOUR_EC2_ELASTIC_IP
   TTL: 300
   ```
3. Wait 5-10 minutes for DNS propagation
4. Verify: `nslookup yourdomain.com`

### Step 2: Install Certbot

SSH into your EC2 instance:

```bash
ssh -i your-key.pem ec2-user@YOUR_EC2_IP
```

Install Certbot:

**For Amazon Linux 2023 / RHEL / CentOS**:
```bash
sudo yum install -y certbot
```

**For Ubuntu**:
```bash
sudo apt update
sudo apt install -y certbot
```

### Step 3: Get SSL Certificate

```bash
# Stop nginx temporarily
cd ~/taskmanagement_chatbot
docker-compose -f docker-compose.prod.yml stop nginx

# Get certificate (replace with your domain)
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com --preferred-challenges http

# Follow the prompts:
# - Enter email address
# - Agree to terms
# - Decide on email sharing
```

Certificates will be saved to:
```
/etc/letsencrypt/live/yourdomain.com/fullchain.pem
/etc/letsencrypt/live/yourdomain.com/privkey.pem
```

### Step 4: Copy Certificates to Nginx

```bash
# Create SSL directory
mkdir -p ~/taskmanagement_chatbot/nginx/ssl

# Copy certificates
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ~/taskmanagement_chatbot/nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ~/taskmanagement_chatbot/nginx/ssl/key.pem

# Fix permissions
sudo chown $USER:$USER ~/taskmanagement_chatbot/nginx/ssl/*.pem
chmod 644 ~/taskmanagement_chatbot/nginx/ssl/cert.pem
chmod 600 ~/taskmanagement_chatbot/nginx/ssl/key.pem
```

### Step 5: Update Nginx Configuration

Edit nginx configuration:
```bash
cd ~/taskmanagement_chatbot
nano nginx/nginx.conf
```

Find and uncomment the HTTPS server block (around line 110):

```nginx
# Uncomment and update this section:
server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;  # Update with your domain

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    client_max_body_size 10M;

    # Copy all location blocks from HTTP server (lines 45-100)
    location / {
        limit_req zone=general_limit burst=20 nodelay;
        proxy_pass http://chatbot_ui;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /streaming/avatar {
        limit_req zone=general_limit burst=20 nodelay;
        proxy_pass http://avatar_ui;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /api/tasks {
        limit_req zone=api_limit burst=10 nodelay;
        rewrite ^/api/tasks/(.*)$ /$1 break;
        proxy_pass http://tasks_api;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api/chatbot {
        limit_req zone=api_limit burst=10 nodelay;
        rewrite ^/api/chatbot/(.*)$ /$1 break;
        proxy_pass http://chatbot_api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }

    location ~ /\. {
        deny all;
    }

    location ~ /\.env {
        deny all;
    }
}
```

Also add HTTP to HTTPS redirect to the HTTP server block:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;  # Update with your domain

    # Redirect all HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}
```

Save and exit (Ctrl+X, Y, Enter)

### Step 6: Update Environment Variables

```bash
nano .env.production
```

Update DOMAIN:
```bash
DOMAIN=https://yourdomain.com
VITE_TASK_API_BASE_URL=https://yourdomain.com/api/tasks
```

Save and exit.

### Step 7: Restart Services

```bash
./deployment/aws/deploy.sh
```

### Step 8: Test HTTPS

Open in browser:
```
https://yourdomain.com
https://yourdomain.com/streaming/avatar
```

Verify SSL certificate:
- Click the padlock icon in browser
- Check certificate is valid

### Step 9: Auto-Renewal Setup

Let's Encrypt certificates expire every 90 days. Set up auto-renewal:

```bash
# Test renewal
sudo certbot renew --dry-run

# Setup cron job for auto-renewal
sudo crontab -e
```

Add this line:
```cron
0 0 * * * certbot renew --quiet --post-hook "cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem /home/ec2-user/taskmanagement_chatbot/nginx/ssl/cert.pem && cp /etc/letsencrypt/live/yourdomain.com/privkey.pem /home/ec2-user/taskmanagement_chatbot/nginx/ssl/key.pem && cd /home/ec2-user/taskmanagement_chatbot && docker-compose -f docker-compose.prod.yml restart nginx"
```

Save and exit.

---

## Option 2: AWS Certificate Manager (ACM) + Application Load Balancer

For production-grade setup with auto-renewal and better performance.

### Step 1: Request Certificate in ACM

1. Go to [AWS Certificate Manager](https://console.aws.amazon.com/acm/)
2. Click **Request certificate**
3. Choose **Request a public certificate**
4. Enter domain names:
   ```
   yourdomain.com
   *.yourdomain.com
   ```
5. Choose **DNS validation**
6. Add CNAME records to your DNS (provided by AWS)
7. Wait for validation (~5-30 minutes)

### Step 2: Create Application Load Balancer

1. Go to **EC2 → Load Balancers**
2. Click **Create Load Balancer**
3. Choose **Application Load Balancer**
4. Configure:
   ```
   Name: chatbot-alb
   Scheme: Internet-facing
   IP address type: IPv4

   Listeners:
   - HTTP (80)
   - HTTPS (443)

   Availability Zones: Select 2+ zones
   ```

5. **Configure Security Groups**:
   - Create new: `alb-security-group`
   - Allow HTTP (80) and HTTPS (443) from 0.0.0.0/0

6. **Configure HTTPS Listener**:
   - Certificate: Select your ACM certificate
   - Security policy: ELBSecurityPolicy-TLS-1-2-2017-01

7. **Configure Target Group**:
   ```
   Name: chatbot-targets
   Type: Instance
   Protocol: HTTP
   Port: 80
   Health check: /health
   ```

8. **Register Targets**: Select your EC2 instance

9. **Create**

### Step 3: Update DNS

Point your domain A record to the ALB DNS name (use ALIAS record if on Route53)

### Step 4: Configure HTTP to HTTPS Redirect

1. Go to ALB → Listeners
2. Edit HTTP:80 listener
3. Change action to:
   ```
   Redirect to: HTTPS
   Port: 443
   Status code: 301
   ```

---

## Option 3: Cloudflare (Free SSL + CDN)

### Step 1: Add Site to Cloudflare

1. Sign up at [Cloudflare](https://cloudflare.com)
2. Add your site
3. Update nameservers at your domain registrar

### Step 2: Configure DNS

Add A record pointing to your EC2 IP with proxy enabled (orange cloud)

### Step 3: SSL Settings

1. Go to SSL/TLS → Overview
2. Select **Full** or **Full (strict)**
3. Enable **Always Use HTTPS**

### Step 4: Configure Nginx for Cloudflare

Update `nginx/nginx.conf`:

```nginx
# Add these to the http block
set_real_ip_from 173.245.48.0/20;
set_real_ip_from 103.21.244.0/22;
set_real_ip_from 103.22.200.0/22;
set_real_ip_from 103.31.4.0/22;
set_real_ip_from 141.101.64.0/18;
set_real_ip_from 108.162.192.0/18;
set_real_ip_from 190.93.240.0/20;
set_real_ip_from 188.114.96.0/20;
set_real_ip_from 197.234.240.0/22;
set_real_ip_from 198.41.128.0/17;
set_real_ip_from 162.158.0.0/15;
set_real_ip_from 104.16.0.0/13;
set_real_ip_from 104.24.0.0/14;
set_real_ip_from 172.64.0.0/13;
set_real_ip_from 131.0.72.0/22;
real_ip_header CF-Connecting-IP;
```

Restart nginx:
```bash
docker-compose -f docker-compose.prod.yml restart nginx
```

Your site now has free SSL via Cloudflare!

---

## Verification

### Test SSL Configuration

```bash
# Test SSL certificate
curl -I https://yourdomain.com

# Check SSL grade
# Visit: https://www.ssllabs.com/ssltest/analyze.html?d=yourdomain.com
```

### Verify HTTPS Redirect

```bash
# Should redirect to HTTPS
curl -I http://yourdomain.com
```

### Check Certificate Expiry

```bash
# For Let's Encrypt
sudo certbot certificates

# From browser
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com
```

---

## Troubleshooting

### Certificate Not Working

**Issue**: Browser shows "Not Secure" or certificate error

**Check**:
```bash
# Verify certificate files exist
ls -la ~/taskmanagement_chatbot/nginx/ssl/

# Check nginx logs
docker-compose -f docker-compose.prod.yml logs nginx
```

**Solution**: Verify certificate paths in nginx.conf match actual file locations

### Port 443 Not Accessible

**Check Security Group**: Ensure port 443 is open in EC2 Security Group

### Auto-Renewal Failed

**Check**:
```bash
# Test renewal
sudo certbot renew --dry-run

# Check renewal logs
sudo cat /var/log/letsencrypt/letsencrypt.log
```

---

## Best Practices

1. **Always use HTTPS in production**
2. **Enable HSTS** (HTTP Strict Transport Security):
   ```nginx
   add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
   ```

3. **Monitor certificate expiry**
4. **Use strong TLS versions** (1.2+)
5. **Regular security updates**

---

## Next Steps

- Setup monitoring for SSL expiry
- Configure WAF (Web Application Firewall)
- Enable rate limiting
- Setup backup certificates

---

**🔒 Your application is now secure with HTTPS!**
