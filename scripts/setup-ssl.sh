#!/bin/bash
# SSL Certificate setup script
# Run this ONCE after initial deployment when domain is ready

set -e

DOMAIN="${1:-forumapi.my.id}"

echo "Setting up SSL for domain: $DOMAIN"

echo "Installing Certbot..."
sudo apt update
sudo apt install -y certbot python3-certbot-nginx

if [ ! -f /etc/nginx/sites-enabled/forum-api ]; then
    echo "Error: NGINX configuration not found!"
    echo "Please setup NGINX first before running SSL setup"
    exit 1
fi

echo "Generating SSL certificate..."
sudo certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN --redirect

# Setup auto-renewal cron job
echo "Setting up auto-renewal..."
(crontab -l 2>/dev/null | grep -v certbot; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -


echo "Testing renewal process..."
sudo certbot renew --dry-run

echo "SSL setup complete!"
echo "Certificate will auto-renew daily at 12:00"