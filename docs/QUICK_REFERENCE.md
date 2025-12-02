# Quick Reference - Dynamic Nginx Configuration

## TL;DR (Fastest Way to Deploy)

```bash
cd deployment
./deploy.sh your-domain.com
```

Done! 🎉

## Common Commands

| What                          | Command                                               |
| ----------------------------- | ----------------------------------------------------- |
| **Deploy with custom domain** | `./deploy.sh example.com`                             |
| **Deploy with cert domain**   | `./deploy.sh example.com example.com`                 |
| **View nginx config**         | `docker compose exec nginx cat /etc/nginx/nginx.conf` |
| **Check nginx syntax**        | `docker compose exec nginx nginx -t`                  |
| **View nginx logs**           | `docker compose logs nginx`                           |
| **Update domain**             | Edit `.env` and run `docker compose restart nginx`    |
| **Stop all services**         | `docker compose down`                                 |
| **View all services**         | `docker compose ps`                                   |

## Environment Variables

```env
BASE_DOMAIN=your-domain.com      # Main domain (required)
CERT_DOMAIN=your-domain.com      # SSL cert domain (optional, defaults to BASE_DOMAIN)
```

## Service URLs (Example: `my-app.com`)

```
Frontend:  https://my-app.com
API:       https://api.my-app.com
AI:        https://ai.my-app.com
```

## Generated Service Configuration

Each service gets its own nginx server block:

```
my-app.com               → frontend:3000
api.my-app.com           → app:3000
ai.my-app.com            → ai:8000
```

## File Locations

```
deployment/
├── .env                          # Your configuration (create from .env.example)
├── docker-compose.yml            # Main deployment file
├── deploy.sh                     # Deployment script
├── DEPLOYMENT_GUIDE.md           # Full setup instructions
├── DYNAMIC_CONFIG_SUMMARY.md     # System overview
├── EXAMPLE_DEPLOYMENTS.md        # Real-world examples
└── nginx/
    ├── nginx.conf.template       # Config template (has variables)
    ├── entrypoint.sh             # Script to process template
    └── .env.example              # Example env config
```

## Initial Setup (One Time)

```bash
cd deployment
cp nginx/.env.example .env
# Edit .env with your domain
docker compose up -d
```

## How It Works (Simple Version)

1. User sets `BASE_DOMAIN` environment variable
2. Docker container starts with entrypoint script
3. Script reads `nginx.conf.template` and replaces variables
4. Generates actual `nginx.conf` with your domain
5. Nginx starts serving traffic

## Troubleshooting

### Issue: "Upstream not reachable"

```bash
# Check if backend services are running
docker compose ps

# Should see: app, ai, frontend, nginx all running
```

### Issue: "SSL certificate not found"

```bash
# Certificates must be at:
# ./certbot_data/live/your-domain.com/fullchain.pem
# ./certbot_data/live/your-domain.com/privkey.pem

# Request certificate:
docker run --rm -it \
  -v $(pwd)/certbot_data:/etc/letsencrypt \
  certbot/certbot certonly --standalone \
  -d your-domain.com \
  -d '*.your-domain.com'
```

### Issue: "DNS not resolving"

```bash
# Check your DNS records:
nslookup your-domain.com
dig your-domain.com

# Should return your server IP address
```

### Issue: "Port 80/443 already in use"

```bash
# Kill existing process or change port in docker-compose.yml
lsof -i :80
lsof -i :443

# Or use different ports:
# ports:
#   - "8080:80"
#   - "8443:443"
```

## Multiple Deployments on Same Server

```bash
# Deployment 1
BASE_DOMAIN=prod.com docker compose -p prod up -d

# Deployment 2
BASE_DOMAIN=staging.com docker compose -p staging up -d

# They won't conflict because each has unique project name
```

## Testing Before Production

```bash
# Test with subdomain
./deploy.sh test.your-domain.com

# Verify in logs
docker compose logs nginx | grep "Generating nginx"

# Check configuration
docker compose exec nginx cat /etc/nginx/nginx.conf | head -30

# Test connectivity
curl -I https://test.your-domain.com
```

## Security Reminders

- [ ] Use HTTPS (setup certificates before deploying)
- [ ] Firewall open: ports 80 and 443
- [ ] DNS A records pointing to server
- [ ] Keep certificates updated
- [ ] Monitor nginx logs for errors
- [ ] Set strong passwords in .env

## Advanced: Scale Across Regions

```bash
# US
BASE_DOMAIN=app-us.io docker compose -p us up -d

# EU
BASE_DOMAIN=app-eu.io docker compose -p eu up -d

# APAC
BASE_DOMAIN=app-apac.io docker compose -p apac up -d
```

Each region has independent, isolated infrastructure.

## One More Thing: Frontend Port

⚠️ **Frontend exposes port 3000 (not 3001!)**

The frontend container:

- Listens on port 3000 internally
- The nginx config correctly routes to port 3000
- If you change frontend port, update docker-compose.yml

## Need Help?

1. Read: `DEPLOYMENT_GUIDE.md` - Detailed setup
2. Examples: `EXAMPLE_DEPLOYMENTS.md` - Real scenarios
3. Summary: `DYNAMIC_CONFIG_SUMMARY.md` - System overview
4. Logs: `docker compose logs -f nginx` - Real-time debugging

---

**You're all set! 🚀**

Deployment is now as simple as:

```bash
./deploy.sh your-domain.com
```

No config file editing. No git commits. Just domain → deploy.
