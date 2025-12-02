# Dynamic Nginx Configuration

This setup allows you to deploy the application with **any custom domain** without modifying the nginx configuration file directly.

## How It Works

The nginx configuration uses environment variables that are processed at container startup:

- **`nginx.conf.template`** - Template file with placeholder variables
- **`entrypoint.sh`** - Script that generates the actual nginx.conf from the template
- **Docker Compose** - Passes environment variables to the nginx container

## Configuration Variables

### BASE_DOMAIN

- **Description**: The main domain name for your application
- **Example**: `tattara.dsnsandbox.com`, `myapp.com`, `production.example.org`
- **Services**:
  - Frontend: `${BASE_DOMAIN}`
  - API: `api.${BASE_DOMAIN}`
  - AI: `ai.${BASE_DOMAIN}`

### CERT_DOMAIN

- **Description**: The domain used for SSL certificate paths
- **Example**: `tattara.dsnsandbox.com` (usually same as BASE_DOMAIN)
- **Default**: Uses BASE_DOMAIN if not specified

## Deployment Methods

### Method 1: Using Docker Compose with .env file

1. **Create a `.env` file** in the deployment directory:

```bash
cp nginx/.env.example .env
```

2. **Edit the `.env` file** with your domain:

```bash
BASE_DOMAIN=myapp.example.com
CERT_DOMAIN=myapp.example.com
```

3. **Deploy with Docker Compose**:

```bash
docker compose up -d
```

### Method 2: Inline Environment Variables

```bash
BASE_DOMAIN=myapp.example.com CERT_DOMAIN=myapp.example.com docker compose up -d
```

### Method 3: Using deployment script with custom domain

```bash
#!/bin/bash
export BASE_DOMAIN=$1
export CERT_DOMAIN=$2
docker compose up -d
```

Then run:

```bash
./deploy.sh myapp.example.com myapp.example.com
```

## SSL Certificate Setup

The configuration expects SSL certificates to be stored at:

```
/etc/letsencrypt/live/${CERT_DOMAIN}/fullchain.pem
/etc/letsencrypt/live/${CERT_DOMAIN}/privkey.pem
```

### Using Certbot with Wildcard Certificate

```bash
# Generate wildcard certificate for all subdomains
certbot certonly --manual \
  -d example.com \
  -d '*.example.com'

# If using Docker, mount the certbot volume
docker run --rm -it \
  -v ./certbot_data:/etc/letsencrypt \
  certbot/certbot certonly --standalone \
  -d myapp.example.com \
  -d '*.myapp.example.com'
```

## Example Deployments

### Example 1: Personal Development

```bash
BASE_DOMAIN=localhost
CERT_DOMAIN=localhost
```

### Example 2: Staging Environment

```bash
BASE_DOMAIN=staging.mycompany.com
CERT_DOMAIN=staging.mycompany.com
```

### Example 3: Production Environment

```bash
BASE_DOMAIN=app.mycompany.com
CERT_DOMAIN=app.mycompany.com
```

### Example 4: Client Deployment

```bash
BASE_DOMAIN=client-app.io
CERT_DOMAIN=client-app.io
```

## Domain Structure

With `BASE_DOMAIN=example.com`, your services will be accessible at:

```
Frontend:   https://example.com
API:        https://api.example.com
AI:         https://ai.example.com
```

## DNS Configuration

Ensure your DNS records point to your server:

```
example.com       A   203.0.113.1
*.example.com     A   203.0.113.1
```

Or if using separate services:

```
example.com       A   203.0.113.1      (Frontend)
api.example.com   A   203.0.113.1      (API)
ai.example.com    A   203.0.113.1      (AI)
```

## Troubleshooting

### Check Generated Configuration

```bash
# View the generated nginx config
docker compose exec nginx cat /etc/nginx/nginx.conf

# Validate nginx syntax
docker compose exec nginx nginx -t
```

### View Nginx Logs

```bash
docker compose logs -f nginx
```

### Verify Domain Substitution

```bash
# Check if variables were properly substituted
docker compose exec nginx grep "server_name" /etc/nginx/nginx.conf
```

## Security Notes

- Always use HTTPS in production
- Ensure DNS records are set up correctly before deployment
- Keep SSL certificates up to date
- Use strong passwords for your domain registrar account
- Consider using Certbot renewal hooks for automatic certificate updates

## Important Files

- `nginx.conf.template` - Template file (DO NOT edit domain names directly here, use env vars)
- `entrypoint.sh` - Initialization script
- `.env.example` - Example environment configuration
- `docker-compose.yml` - Docker Compose configuration
