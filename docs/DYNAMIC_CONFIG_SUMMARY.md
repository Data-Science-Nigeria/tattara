# Dynamic Nginx Configuration Summary

## What Changed

Your nginx configuration is now **100% plug-and-play** with dynamic domain support. Users can deploy with ANY domain without editing config files.

## Files Created/Modified

### New Files

- ✅ `nginx/nginx.conf.template` - Dynamic template with `${BASE_DOMAIN}` and `${CERT_DOMAIN}` placeholders
- ✅ `nginx/entrypoint.sh` - Script to generate nginx.conf at runtime
- ✅ `nginx/.env.example` - Example environment configuration
- ✅ `nginx/README.md` - Comprehensive nginx documentation
- ✅ `deploy.sh` - Interactive deployment script
- ✅ `DEPLOYMENT_GUIDE.md` - Quick start guide

### Modified Files

- ✅ `docker-compose.yml` - Updated to use template and pass env vars to nginx

### Deleted Files

- ✅ `nginx/nginx.conf` - Static config (replaced by template system)

## How It Works

```
User runs deploy.sh with domain
         ↓
.env file created/updated with BASE_DOMAIN
         ↓
Docker compose starts nginx container
         ↓
entrypoint.sh processes template with env vars
         ↓
Dynamic nginx.conf generated with correct subdomains
         ↓
Nginx starts with correct configuration
```

## Usage Examples

### Simple Deployment (Recommended)

```bash
cd deployment
./deploy.sh my-app.com
```

### With Custom Cert Domain

```bash
./deploy.sh my-app.com cert-domain.com
```

### Using .env file directly

```bash
cp nginx/.env.example .env
# Edit .env with your domain
docker compose up -d
```

### Staging vs Production

```bash
# Staging
BASE_DOMAIN=staging.example.com docker compose up -d

# Production
BASE_DOMAIN=prod.example.com docker compose up -d
```

## Service URLs

For domain `my-app.com`:

| Service  | URL                      |
| -------- | ------------------------ |
| Frontend | `https://my-app.com`     |
| API      | `https://api.my-app.com` |
| AI       | `https://ai.my-app.com`  |

## Key Features

✅ **Zero Config Changes Required**

- Users just set BASE_DOMAIN
- No manual editing of nginx.conf

✅ **Multi-Instance Deployments**

- Deploy multiple instances with different domains
- Same configuration code, different domains

✅ **Automatic Configuration Generation**

- Template processed at container startup
- Always in sync with environment variables

✅ **Validation & Safety**

- entrypoint.sh validates nginx syntax
- Script checks domain format
- Helpful error messages

✅ **SSL Ready**

- Supports wildcard certificates
- Certificate paths customizable via CERT_DOMAIN

## Environment Variables

```env
# Required
BASE_DOMAIN=your-domain.com

# Optional (defaults to BASE_DOMAIN if not set)
CERT_DOMAIN=your-domain.com
```

## Important Notes

1. **Docker Compose Integration**: The `docker-compose.yml` automatically passes these env vars to nginx
2. **Certificate Paths**: SSL certs must be at `/etc/letsencrypt/live/${CERT_DOMAIN}/`
3. **DNS Setup**: DNS A records must point to your server
4. **Template Variable Names**: Only `${BASE_DOMAIN}` and `${CERT_DOMAIN}` are replaced (these are case-sensitive)

## Troubleshooting

### Check if config was generated correctly

```bash
docker compose exec nginx cat /etc/nginx/nginx.conf | head -20
```

### Verify variables were substituted

```bash
docker compose exec nginx grep "server_name" /etc/nginx/nginx.conf
```

### View generation logs

```bash
docker compose logs nginx | grep "Generating"
```

## Migration from Old Setup

The old static `nginx.conf` has been replaced with the template system:

**Old way** ❌

- Edit `nginx.conf` directly
- Commit to git
- Deploy

**New way** ✅

- Set `BASE_DOMAIN` env var
- Run deploy script or docker compose
- No file edits needed

## Advanced Usage

### Multiple deployments from single repo

```bash
# Dev environment
DEPLOYMENT_PATH=/deployments/dev BASE_DOMAIN=dev.local docker compose up -d

# Staging environment
DEPLOYMENT_PATH=/deployments/staging BASE_DOMAIN=staging.example.com docker compose up -d

# Production environment
DEPLOYMENT_PATH=/deployments/prod BASE_DOMAIN=app.example.com docker compose up -d
```

### Programmatic deployment

```bash
#!/bin/bash
DOMAINS=("domain1.com" "domain2.com" "domain3.com")
for domain in "${DOMAINS[@]}"; do
    BASE_DOMAIN=$domain docker compose up -d
done
```

## Files Reference

### Template System

- **Source**: `nginx/nginx.conf.template` (contains placeholders)
- **Processing**: `nginx/entrypoint.sh` (uses `envsubst` to generate)
- **Output**: `/etc/nginx/nginx.conf` (inside container, generated at startup)

### Configuration

- **User Config**: `deployment/.env` (created from `nginx/.env.example`)
- **Docker Config**: `docker-compose.yml` (passes env vars to nginx service)

### Documentation

- **Nginx Details**: `nginx/README.md`
- **Quick Start**: `DEPLOYMENT_GUIDE.md`
- **Deployment Script**: `deploy.sh`

## Next Steps

1. ✅ Review the setup with `ls -la deployment/nginx/`
2. ✅ Read `DEPLOYMENT_GUIDE.md` for quick start
3. ✅ Test with `./deploy.sh your-domain.com`
4. ✅ Check nginx config: `docker compose exec nginx nginx -t`
5. ✅ Verify: `docker compose logs nginx`

Your application is now ready for **flexible, scalable deployments**! 🚀
