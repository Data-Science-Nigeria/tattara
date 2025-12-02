#!/bin/sh
# entrypoint.sh - Process nginx config template with environment variables

set -e

# Default values if not provided
BASE_DOMAIN=${BASE_DOMAIN:-tattara.dsnsandbox.com}
CERT_DOMAIN=${CERT_DOMAIN:-$BASE_DOMAIN}

echo "Generating nginx configuration..."
echo "BASE_DOMAIN: $BASE_DOMAIN"
echo "CERT_DOMAIN: $CERT_DOMAIN"

# Create the nginx config from template
envsubst '${BASE_DOMAIN},${CERT_DOMAIN}' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf

# Verify the configuration
echo "Validating nginx configuration..."
nginx -t

# Start nginx
echo "Starting nginx..."
exec nginx -g "daemon off;"
