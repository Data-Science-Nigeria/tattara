# Example Deployments

This document shows real-world deployment scenarios using the dynamic nginx configuration.

## Scenario 1: Solo Developer Testing

```bash
# Developer wants to test locally with a custom domain
cd deployment
BASE_DOMAIN=localhost docker compose up -d

# Services available at:
# http://localhost (Frontend)
# http://api.localhost (API) - Note: may not work without proper DNS
```

## Scenario 2: Small Team Staging Deployment

```bash
# Team deploying to staging server
cd deployment
./deploy.sh staging.ourcompany.com

# Services available at:
# https://staging.ourcompany.com (Frontend)
# https://api.staging.ourcompany.com (API)
# https://ai.staging.ourcompany.com (AI)
```

## Scenario 3: Production Deployment by Client

Client receives deployment package and runs:

```bash
# Client has their own domain
cd deployment
./deploy.sh client-app.io

# Services available at:
# https://client-app.io (Frontend)
# https://api.client-app.io (API)
# https://ai.client-app.io (AI)

# No need to edit any config files!
# No need to understand the infrastructure
```

## Scenario 4: Multi-Tenant SaaS

Deploy same application for multiple clients:

```bash
# Client 1
BASE_DOMAIN=client1.saas.io docker compose -p client1 up -d

# Client 2
BASE_DOMAIN=client2.saas.io docker compose -p client2 up -d

# Client 3
BASE_DOMAIN=client3.saas.io docker compose -p client3 up -d

# Each client has isolated services with their own domain
```

## Scenario 5: CI/CD Pipeline

GitHub Actions deployment with custom domain:

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

env:
  BASE_DOMAIN: ${{ secrets.DEPLOYMENT_DOMAIN }}

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy
        run: |
          export BASE_DOMAIN=${{ secrets.DEPLOYMENT_DOMAIN }}
          cd deployment
          docker compose pull
          docker compose up -d
```

User just sets `DEPLOYMENT_DOMAIN` secret in GitHub and it deploys to that domain!

## Scenario 6: Blue-Green Deployment

Run two versions simultaneously with different domains:

```bash
# Blue environment (stable)
BASE_DOMAIN=blue.example.com docker compose -p blue up -d

# Green environment (new version)
BASE_DOMAIN=green.example.com docker compose -p green up -d

# Test green, then switch DNS to point to green
# No downtime!
```

## Scenario 7: Regional Deployments

Deploy to different regions with region-specific domains:

```bash
# US Region
BASE_DOMAIN=app-us.company.com docker compose -p us up -d

# EU Region
BASE_DOMAIN=app-eu.company.com docker compose -p eu up -d

# APAC Region
BASE_DOMAIN=app-apac.company.com docker compose -p apac up -d

# Users in each region use their regional domain
# Lower latency, better compliance
```

## Scenario 8: Internal vs External Deployment

```bash
# Internal testing (local IP)
BASE_DOMAIN=internal.local docker compose up -d

# Customer production (public domain)
BASE_DOMAIN=customer.io docker compose -p prod up -d

# Same code, different access levels
```

## Scenario 9: Automated Testing Environment

```bash
#!/bin/bash
# test-deploy.sh

DOMAINS=(
  "test1.example.com"
  "test2.example.com"
  "test3.example.com"
)

for domain in "${DOMAINS[@]}"; do
  echo "Testing deployment with domain: $domain"
  BASE_DOMAIN=$domain docker compose -p "test-${domain}" up -d

  # Run tests
  sleep 5
  curl -I https://$domain

  # Cleanup
  docker compose -p "test-${domain}" down -v
done

echo "All test deployments successful!"
```

## Scenario 10: Development with Hot Reload

```bash
# Developer wants to test changes
cd deployment

# Set custom domain for development
BASE_DOMAIN=myname-dev.local ./deploy.sh

# Services available at:
# https://myname-dev.local (Frontend - with hot reload)
# https://api.myname-dev.local (API)
# https://ai.myname-dev.local (AI)

# Each developer can have their own instance
# No domain conflicts
# No port conflicts (different nginx instances)
```

## Quick Reference Commands

### View current configuration

```bash
docker compose exec nginx cat /etc/nginx/nginx.conf | grep "server_name"
```

### Verify domains are correctly substituted

```bash
BASE_DOMAIN=mydom.com docker compose config | grep -A 5 "COMPOSE"
```

### Test deployment script

```bash
./deploy.sh example.com --dry-run  # If implemented
```

### Scale services for testing

```bash
docker compose up -d --scale app=3 --scale ai=2
```

### Export configuration for backup

```bash
docker compose exec nginx cat /etc/nginx/nginx.conf > nginx.conf.backup
```

## Environment Variables in One Place

Create a `.env` file once:

```env
# deployment/.env
BASE_DOMAIN=my-app.com
CERT_DOMAIN=my-app.com

# Backend
DATABASE_HOST=postgres
DATABASE_USERNAME=user
DATABASE_PASSWORD=secure_password
DATABASE_NAME=tattara

# Redis
REDIS_PASSWORD=secure_password

# Container images
COMPOSE_APP_IMAGE=ghcr.io/company/tattara/app:latest
COMPOSE_AI_IMAGE=ghcr.io/company/tattara/ai:latest
COMPOSE_FRONTEND_IMAGE=ghcr.io/company/tattara/frontend:latest
```

Then deploy anywhere:

```bash
docker compose up -d
```

## Benefits Summary

✅ **No Configuration Changes Needed**

- User provides domain, everything else is automatic

✅ **Reproducible Deployments**

- Same setup, any domain, anytime

✅ **Easy Team Collaboration**

- Team members deploy with different domains
- No git conflicts on config files

✅ **Enterprise Ready**

- Multi-tenant support
- Regional deployments
- Blue-green deployments
- Disaster recovery

✅ **Developer Friendly**

- Simple commands
- Clear error messages
- Helpful documentation
- Interactive deploy script

✅ **Production Ready**

- Validated nginx configuration
- SSL certificate support
- Health checks
- Proper logging
