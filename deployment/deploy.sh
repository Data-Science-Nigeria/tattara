#!/bin/bash
# deploy.sh - Example deployment script with dynamic domain configuration

set -e

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default values
BASE_DOMAIN="${1:-tattara.dsnsandbox.com}"
CERT_DOMAIN="${2:-$BASE_DOMAIN}"

echo -e "${YELLOW}=== Tattara Application Deployment ===${NC}"
echo ""
echo "Configuration:"
echo "  Base Domain: $BASE_DOMAIN"
echo "  Cert Domain: $CERT_DOMAIN"
echo ""
echo "Services will be available at:"
echo "  • Frontend:  https://$BASE_DOMAIN"
echo "  • API:       https://api.$BASE_DOMAIN"
echo "  • AI:        https://ai.$BASE_DOMAIN"
echo ""

# Validate domain format
if ! [[ "$BASE_DOMAIN" =~ ^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$ ]]; then
    echo -e "${RED}Error: Invalid domain format: $BASE_DOMAIN${NC}"
    exit 1
fi

# Check if deployment directory exists
DEPLOYMENT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ ! -f "$DEPLOYMENT_DIR/docker-compose.yml" ]; then
    echo -e "${RED}Error: docker-compose.yml not found in $DEPLOYMENT_DIR${NC}"
    exit 1
fi

# Create .env file if it doesn't exist
ENV_FILE="$DEPLOYMENT_DIR/.env"
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${YELLOW}Creating .env file...${NC}"
    cat > "$ENV_FILE" << EOF
# Tattara Deployment Configuration
BASE_DOMAIN=$BASE_DOMAIN
CERT_DOMAIN=$CERT_DOMAIN

# Backend Services
DATABASE_HOST=postgres
DATABASE_USERNAME=tattara_user
DATABASE_PASSWORD=change_me_in_production
DATABASE_NAME=tattara_db

# Redis
REDIS_PASSWORD=change_me_in_production

# Add other environment variables as needed
EOF
    echo -e "${GREEN}✓ Created .env file${NC}"
else
    echo -e "${YELLOW}Updating domains in .env file...${NC}"
    # Update domains in existing .env
    sed -i.bak "s/BASE_DOMAIN=.*/BASE_DOMAIN=$BASE_DOMAIN/" "$ENV_FILE"
    sed -i.bak "s/CERT_DOMAIN=.*/CERT_DOMAIN=$CERT_DOMAIN/" "$ENV_FILE"
    rm -f "$ENV_FILE.bak"
    echo -e "${GREEN}✓ Updated .env file${NC}"
fi

# Check for DNS configuration
echo -e "${YELLOW}Checking DNS configuration...${NC}"
DNS_IP=$(dig +short A $BASE_DOMAIN @8.8.8.8 2>/dev/null | tail -n1)
SERVER_IP=$(hostname -I | awk '{print $1}')

if [ -z "$DNS_IP" ]; then
    echo -e "${RED}⚠ WARNING: DNS A record not configured for $BASE_DOMAIN${NC}"
    echo ""
    echo "  The domain $BASE_DOMAIN does NOT have an A record pointing to this server."
    echo ""
    echo "  Required DNS configuration:"
    echo "    • A record:     $BASE_DOMAIN          → $SERVER_IP"
    echo "    • CNAME record: api.$BASE_DOMAIN     → $BASE_DOMAIN"
    echo "    • CNAME record: ai.$BASE_DOMAIN      → $BASE_DOMAIN"
    echo "    • OR use wildcard: *.$(echo $BASE_DOMAIN | cut -d. -f2-) → $SERVER_IP"
    echo ""
    echo "  Without DNS configuration:"
    echo "    ✗ SSL certificate generation will FAIL (certbot needs to reach your domain)"
    echo "    ✗ HTTPS access will not work"
    echo "    ✗ Browser errors for self-signed certificates"
    echo ""
    read -p "Do you want to continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${RED}Deployment cancelled${NC}"
        echo "Please configure DNS and run this script again."
        exit 1
    fi
    echo -e "${YELLOW}⚠ Continuing without DNS configuration...${NC}"
    echo "  Services will be accessible via IP: http://$SERVER_IP"
    echo "  But HTTPS and domain names will NOT work until DNS is configured."
    echo ""
elif [ "$DNS_IP" != "$SERVER_IP" ]; then
    echo -e "${YELLOW}⚠ WARNING: DNS A record points to different IP${NC}"
    echo "  Domain: $BASE_DOMAIN"
    echo "  DNS resolves to: $DNS_IP"
    echo "  Server IP: $SERVER_IP"
    echo ""
    read -p "Continue deployment anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${RED}Deployment cancelled${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✓ DNS A record correctly configured for $BASE_DOMAIN${NC}"
fi

# Check for SSL certificates
CERT_DIR="$DEPLOYMENT_DIR/certbot_data/live/$CERT_DOMAIN"
if [ ! -d "$CERT_DIR" ] || [ ! -f "$CERT_DIR/fullchain.pem" ]; then
    echo -e "${YELLOW}⚠ SSL Certificate not found at $CERT_DIR${NC}"
    echo ""
    echo "  You need to obtain a certificate before deploying."
    echo "  Options:"
    echo ""
    echo "  1. Let's Encrypt (RECOMMENDED - requires DNS to be configured):"
    echo "     docker run --rm -it -v \$(pwd)/certbot_data:/etc/letsencrypt certbot/certbot certonly --standalone \\"
    echo "       -d $BASE_DOMAIN -d '*.$BASE_DOMAIN' --agree-tos -m your-email@example.com"
    echo ""
    echo "  2. Self-signed certificate (for testing only):"
    echo "     mkdir -p certbot_data/live/$CERT_DOMAIN"
    echo "     openssl req -x509 -newkey rsa:4096 -keyout certbot_data/live/$CERT_DOMAIN/privkey.pem \\"
    echo "       -out certbot_data/live/$CERT_DOMAIN/fullchain.pem -days 365 -nodes"
    echo ""
    read -p "Continue deployment without HTTPS? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${RED}Deployment cancelled${NC}"
        exit 1
    fi
    echo -e "${YELLOW}⚠ Continuing without SSL certificate...${NC}"
    echo "  HTTP will be redirected, but SSL will fail without a certificate."
    echo ""
fi

# Change to deployment directory
cd "$DEPLOYMENT_DIR"

# Export variables
export BASE_DOMAIN
export CERT_DOMAIN

# Check docker and docker-compose
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed${NC}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${YELLOW}Note: docker-compose not found, using 'docker compose'${NC}"
    DOCKER_COMPOSE="docker compose"
else
    DOCKER_COMPOSE="docker-compose"
fi

# Pull latest images
echo -e "${YELLOW}Pulling latest images...${NC}"
$DOCKER_COMPOSE pull

# Start services
echo -e "${YELLOW}Starting services...${NC}"
$DOCKER_COMPOSE up -d

# Wait for services to be ready
echo -e "${YELLOW}Waiting for services to be ready...${NC}"
sleep 10

# Check nginx
if $DOCKER_COMPOSE exec nginx nginx -t 2>/dev/null; then
    echo -e "${GREEN}✓ Nginx configuration is valid${NC}"
else
    echo -e "${RED}✗ Nginx configuration has errors${NC}"
    $DOCKER_COMPOSE logs nginx
    exit 1
fi

# Check if services are running
if [ $($DOCKER_COMPOSE ps -q | wc -l) -lt 1 ]; then
    echo -e "${RED}Error: No containers are running${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}=== Deployment Successful ===${NC}"
echo ""
echo "Services are now available at:"
echo "  • Frontend:  https://$BASE_DOMAIN"
echo "  • API:       https://api.$BASE_DOMAIN"
echo "  • AI:        https://ai.$BASE_DOMAIN"
echo ""

# Show next steps based on DNS configuration
if [ -z "$DNS_IP" ]; then
    echo -e "${YELLOW}IMPORTANT: DNS Configuration Required${NC}"
    echo ""
    echo "Your domain is NOT yet configured. Complete these steps:"
    echo ""
    echo "1. Add DNS A records with your registrar:"
    echo "   • $BASE_DOMAIN → $SERVER_IP"
    echo "   • *.$(echo $BASE_DOMAIN | cut -d. -f2-) → $SERVER_IP (wildcard)"
    echo "   OR create individual CNAMEs for api and ai subdomains"
    echo ""
    echo "2. Wait for DNS propagation (5-30 minutes)"
    echo ""
    echo "3. Generate SSL certificate (after DNS is active):"
    echo "   docker run --rm -it -v \$(pwd)/certbot_data:/etc/letsencrypt certbot/certbot certonly --standalone \\"
    echo "     -d $BASE_DOMAIN -d '*.$BASE_DOMAIN' --agree-tos -m your-email@example.com"
    echo ""
    echo "4. Restart nginx to use the certificate:"
    echo "   $DOCKER_COMPOSE restart nginx"
    echo ""
    echo "5. Verify DNS:"
    echo "   dig $BASE_DOMAIN"
    echo "   dig api.$BASE_DOMAIN"
    echo ""
elif [ "$DNS_IP" != "$SERVER_IP" ]; then
    echo -e "${YELLOW}IMPORTANT: DNS Mismatch${NC}"
    echo ""
    echo "Your domain points to a different server:"
    echo "  • Domain: $BASE_DOMAIN"
    echo "  • Resolves to: $DNS_IP"
    echo "  • This server: $SERVER_IP"
    echo ""
    echo "Update your DNS A records to point to: $SERVER_IP"
    echo ""
else
    echo -e "${GREEN}✓ DNS is correctly configured${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. If you haven't already, generate SSL certificates:"
    echo "     docker run --rm -it -v \$(pwd)/certbot_data:/etc/letsencrypt certbot/certbot certonly --standalone \\"
    echo "       -d $BASE_DOMAIN -d '*.$BASE_DOMAIN' --agree-tos -m your-email@example.com"
    echo "     Then: $DOCKER_COMPOSE restart nginx"
    echo ""
    echo "  2. Verify everything is working:"
    echo "     curl -I https://$BASE_DOMAIN"
    echo ""
fi

echo ""
echo "Useful commands:"
echo "  • View logs:     $DOCKER_COMPOSE logs -f"
echo "  • View status:   $DOCKER_COMPOSE ps"
echo "  • Stop services: $DOCKER_COMPOSE down"
echo "  • Restart:       $DOCKER_COMPOSE restart"
echo ""
echo -e "${YELLOW}Documentation:${NC}"
echo "  • Main deployment: DEPLOYMENT_GUIDE.md"
echo "  • Nginx config:    nginx/README.md"
echo ""
