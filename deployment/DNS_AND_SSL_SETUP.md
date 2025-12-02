# DNS and SSL Certificate Setup Guide

## Scenario: User Deploys Without DNS Configured

This guide covers what happens when you deploy Tattara with a domain that doesn't have DNS A records pointing to your server yet.

### What Works

- ✅ Docker containers start successfully
- ✅ Nginx starts and processes your domain configuration
- ✅ Services run internally and can communicate with each other
- ✅ You can access services via direct IP address

### What Doesn't Work

- ❌ Domain name resolution fails
- ❌ HTTPS/SSL certificates can't be obtained
- ❌ End users can't access your application via domain name
- ❌ Let's Encrypt certbot can't validate domain ownership

---

## Step-by-Step DNS Configuration

### 1. Get Your Server's IP Address

Find the IP address of your server where Tattara is deployed:

```bash
# On your deployment server
hostname -I
# Output example: 192.168.1.100 10.0.0.5
# Use the public IP if accessible from internet
```

Or from your cloud provider (Azure, AWS, DigitalOcean, etc.):

- Check the VM/instance details
- Look for "Public IP" or "External IP"

### 2. Add DNS A Records

Login to your domain registrar (GoDaddy, Namecheap, Route53, etc.) and add:

#### Option A: Simple Setup (Single Server)

```
Type    | Name                 | Value              | TTL
--------|----------------------|--------------------|---------
A       | yourdomain.com       | YOUR_SERVER_IP     | 3600
A       | *.yourdomain.com     | YOUR_SERVER_IP     | 3600
```

This creates:

- `yourdomain.com` → YOUR_SERVER_IP (Frontend)
- `api.yourdomain.com` → YOUR_SERVER_IP (API)
- `ai.yourdomain.com` → YOUR_SERVER_IP (AI Service)

#### Option B: Explicit Subdomains

```
Type    | Name                 | Value              | TTL
--------|----------------------|--------------------|---------
A       | yourdomain.com       | YOUR_SERVER_IP     | 3600
CNAME   | api                  | yourdomain.com     | 3600
CNAME   | ai                   | yourdomain.com     | 3600
```

#### Option C: Different Servers

If hosting subdomains on different servers:

```
Type    | Name                 | Value                  | TTL
--------|----------------------|------------------------|--------
A       | yourdomain.com       | FRONTEND_SERVER_IP     | 3600
A       | api                  | API_SERVER_IP          | 3600
A       | ai                   | AI_SERVER_IP           | 3600
```

### 3. Verify DNS Propagation

DNS changes take 5-30 minutes to propagate globally. Check status:

```bash
# Check if DNS is propagated
dig yourdomain.com

# Output should show:
# yourdomain.com.     3600    IN  A   YOUR_SERVER_IP

# Quick check
host yourdomain.com
# Output: yourdomain.com has address YOUR_SERVER_IP

# Check specific subdomains
dig api.yourdomain.com
dig ai.yourdomain.com

# Use online tools
# https://mxtoolbox.com/
# https://www.whatsmydns.net/
```

### 4. Wait and Verify

After DNS is configured, verify before proceeding to SSL:

```bash
# Test from your local machine
ping yourdomain.com
# Should return YOUR_SERVER_IP

# Or use curl
curl -v http://yourdomain.com
# Should connect (HTTP only, no cert yet)
```

---

## SSL Certificate Generation

### Prerequisites

✅ DNS A records are configured and resolving
✅ Port 80 is open and accessible from the internet
✅ Port 443 is open for later HTTPS

### Method 1: Let's Encrypt with Certbot (Recommended)

```bash
# SSH into your deployment server
ssh user@YOUR_SERVER_IP

# Navigate to deployment directory
cd /path/to/tattara/deployment

# Generate certificate (requires DNS to be active)
docker run --rm -it \
  -v "$(pwd)/certbot_data:/etc/letsencrypt" \
  certbot/certbot certonly --standalone \
  -d yourdomain.com \
  -d '*.yourdomain.com' \
  --agree-tos \
  --non-interactive \
  -m your-email@example.com
```

**Expected output:**

```
Successfully received certificate.
Certificate is saved at: /etc/letsencrypt/live/yourdomain.com/fullchain.pem
Key is saved at: /etc/letsencrypt/live/yourdomain.com/privkey.pem
```

### Method 2: Self-Signed Certificate (Development Only)

For testing without Let's Encrypt:

```bash
mkdir -p certbot_data/live/yourdomain.com

openssl req -x509 -newkey rsa:4096 \
  -keyout certbot_data/live/yourdomain.com/privkey.pem \
  -out certbot_data/live/yourdomain.com/fullchain.pem \
  -days 365 -nodes \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=yourdomain.com"
```

**Warning:** Browser will show security warnings. Use only for development!

### Method 3: Existing Certificate

If you have a certificate from another source:

```bash
mkdir -p certbot_data/live/yourdomain.com

# Copy your certificate files
cp /path/to/your/certificate.crt certbot_data/live/yourdomain.com/fullchain.pem
cp /path/to/your/private.key certbot_data/live/yourdomain.com/privkey.pem

# Set proper permissions
chmod 644 certbot_data/live/yourdomain.com/fullchain.pem
chmod 600 certbot_data/live/yourdomain.com/privkey.pem
```

### Step 5: Restart Nginx

After certificate is in place, restart nginx:

```bash
cd /path/to/tattara/deployment

# Restart the nginx container to apply certificate
docker compose restart nginx

# Verify certificate is loaded
docker compose exec nginx nginx -t
# Should output: successful
```

### Step 6: Test HTTPS Access

```bash
# Test from local machine
curl -I https://yourdomain.com
# Should return 200 or proxy response

curl -I https://api.yourdomain.com
# Should return 200 or 502 (nginx is working)

curl -I https://ai.yourdomain.com
# Should return 200 or 502 (nginx is working)

# Test with browser
https://yourdomain.com
https://api.yourdomain.com
https://ai.yourdomain.com
```

---

## Troubleshooting

### DNS Not Resolving

```bash
# Check if DNS is actually propagated
dig yourdomain.com +short
# Should return YOUR_SERVER_IP

# If empty or wrong IP:
# 1. Check you added records to the RIGHT domain registrar
# 2. Wait longer (can take 24 hours for full propagation)
# 3. Clear local DNS cache:
#    - macOS: sudo dscacheutil -flushcache
#    - Linux: sudo systemctl restart systemd-resolved
#    - Windows: ipconfig /flushdns
```

### Certificate Generation Failed

```bash
# Check if port 80 is accessible
curl -v http://yourdomain.com
# Should connect

# Verify firewall allows port 80 from internet
# Check cloud provider security groups/firewall rules
# Ensure port 80 is not blocked

# Check certbot logs
docker logs <certbot_container_id>
```

### "Connection Refused" Error

```bash
# Verify services are running
docker compose ps

# Check if nginx is actually running
docker compose logs nginx | tail -20

# Verify the entrypoint script ran
docker compose logs nginx | grep "Generating"
```

### "SSL Certificate Problem" or "Certificate Name Mismatch"

```bash
# Verify certificate has correct domain
openssl x509 -in certbot_data/live/yourdomain.com/fullchain.pem -text -noout | grep -A2 "Subject Alternative Name"

# Regenerate if needed
docker run --rm -it \
  -v "$(pwd)/certbot_data:/etc/letsencrypt" \
  certbot/certbot certonly --standalone \
  -d yourdomain.com \
  -d '*.yourdomain.com' \
  --force-renewal
```

### Nginx Shows Wrong Config

```bash
# Check if template was processed correctly
docker compose exec nginx cat /etc/nginx/nginx.conf | grep "server_name"

# Should show your domain, not ${BASE_DOMAIN}
# If showing placeholders, entrypoint.sh didn't run properly

# Check environment variables were passed
docker compose config | grep BASE_DOMAIN
```

---

## After Successful Deployment

### Certificate Renewal (Let's Encrypt)

Let's Encrypt certificates expire after 90 days. Set up renewal:

```bash
# Manual renewal
docker run --rm -it \
  -v "$(pwd)/certbot_data:/etc/letsencrypt" \
  certbot/certbot renew

# Automated renewal (cron job)
# Add to crontab: 0 2 * * * /path/to/tattara/deployment/renew-certs.sh
```

### Monitor Your Deployment

```bash
# View all logs
docker compose logs -f

# View nginx logs specifically
docker compose logs -f nginx

# Check certificate expiration
openssl x509 -in certbot_data/live/yourdomain.com/fullchain.pem -enddate -noout
# Output: notAfter=2025-03-01T10:34:56Z
```

### Security Checklist

After DNS and SSL are configured:

- [ ] DNS A records point to correct server
- [ ] SSL certificate is valid and not self-signed
- [ ] HTTPS works for all three domains
- [ ] HTTP redirects to HTTPS
- [ ] Firewall allows ports 80 and 443
- [ ] Certificate renewal is scheduled
- [ ] Services are responding (check logs)

---

## Quick Reference Commands

```bash
# Check server IP
hostname -I

# Test DNS resolution
dig yourdomain.com
host api.yourdomain.com

# Get certificate
docker run --rm -it -v "$(pwd)/certbot_data:/etc/letsencrypt" \
  certbot/certbot certonly --standalone \
  -d yourdomain.com -d '*.yourdomain.com' \
  --agree-tos -m email@example.com

# Restart nginx with new cert
docker compose restart nginx

# Verify nginx config
docker compose exec nginx nginx -t

# View logs
docker compose logs -f nginx

# Test HTTPS
curl -I https://yourdomain.com
```

---

## Need Help?

Check these resources:

1. **Nginx Configuration**: See `nginx/README.md`
2. **Docker Compose**: See `DEPLOYMENT_GUIDE.md`
3. **Let's Encrypt**: https://certbot.eff.org/
4. **DNS Tools**: https://mxtoolbox.com/
5. **Test HTTPS**: https://www.ssllabs.com/ssltest/
