# Deployment Configuration Guide

## Quick Start with Dynamic Domains

### 1. Create Environment Configuration

```bash
cd deployment
cp nginx/.env.example .env
```

### 2. Edit `.env` with Your Domain

```env
BASE_DOMAIN=your-domain.com
CERT_DOMAIN=your-domain.com
```

Replace `your-domain.com` with your actual domain.

### 3. Deploy

```bash
docker compose up -d
```

Your services will be accessible at:

- **Frontend**: `https://your-domain.com`
- **API**: `https://api.your-domain.com`
- **AI**: `https://ai.your-domain.com`

## Environment Variables

| Variable      | Purpose                | Example                  |
| ------------- | ---------------------- | ------------------------ |
| `BASE_DOMAIN` | Main domain name       | `tattara.dsnsandbox.com` |
| `CERT_DOMAIN` | SSL certificate domain | `tattara.dsnsandbox.com` |

## Important: Frontend Container Port

⚠️ **Note**: The frontend service exposes port `3001` internally but listens on port `3000`. Update `docker-compose.yml` if needed:

```yaml
frontend:
  expose:
    - "3000" # Internal port the app listens on
```

## Files Structure

```
deployment/
├── docker-compose.yml          # Main compose file
├── .env                        # Your environment config (create from .env.example)
├── nginx/
│   ├── .env.example           # Template for nginx config
│   ├── nginx.conf.template    # Dynamic nginx config (DO NOT edit domains here)
│   ├── entrypoint.sh          # Script to process template
│   └── README.md              # Detailed nginx documentation
├── docker-compose-ngnix.yml   # Legacy (use main compose instead)
└── docker-compose-prod.yml    # Legacy (use main compose instead)
```

## Certificate Setup

### For development (self-signed):

```bash
mkdir -p certbot_data/live/your-domain.com
# Create self-signed cert
```

### For production (Let's Encrypt):

```bash
docker run --rm -it \
  -v "$(pwd)/certbot_data:/etc/letsencrypt" \
  certbot/certbot certonly --standalone \
  -d your-domain.com \
  -d '*.your-domain.com' \
  --agree-tos \
  -m your-email@example.com
```

Then restart containers:

```bash
docker compose down
docker compose up -d
```

## Troubleshooting

### Check if configuration was generated correctly

```bash
docker compose exec nginx cat /etc/nginx/nginx.conf | grep "server_name"
```

### View nginx logs

```bash
docker compose logs nginx
```

### Validate nginx configuration

```bash
docker compose exec nginx nginx -t
```

### Restart nginx with new domain

```bash
# Update .env
nano .env

# Restart the container (it will regenerate config)
docker compose restart nginx
```

## Security Checklist

- [ ] SSL certificates installed
- [ ] DNS A records pointing to server
- [ ] Wildcard DNS configured (\*.your-domain.com)
- [ ] Firewall ports 80 and 443 open
- [ ] SSL certificate renewal setup (for Let's Encrypt)
- [ ] CORS configured if needed in backend services

## Scaling to Multiple Deployments

If deploying multiple instances:

```bash
# Production deployment
BASE_DOMAIN=prod.example.com CERT_DOMAIN=prod.example.com docker compose up -d

# Staging deployment
BASE_DOMAIN=staging.example.com CERT_DOMAIN=staging.example.com docker compose -f docker-compose.yml -p staging up -d

# Development deployment
BASE_DOMAIN=dev.example.com CERT_DOMAIN=dev.example.com docker compose -f docker-compose.yml -p dev up -d
```

This makes the setup truly plug-and-play for different environments and users! 🚀
