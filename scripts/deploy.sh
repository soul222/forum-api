#!/bin/bash
set -e

APP_NAME="forum-api"
APP_DIR="/var/www/forum-api"

echo "Starting deployment for $APP_NAME..."

cd $APP_DIR

echo "Installing dependencies..."
npm ci --production

echo "Running database migrations..."
npm run migrate up || echo "Migration warning - may already be up to date"

echo "Managing PM2 application..."
if pm2 describe $APP_NAME > /dev/null 2>&1; then
    echo "Restarting existing app..."
    pm2 restart $APP_NAME
else
    echo "Starting new app..."
    pm2 start src/app.js --name $APP_NAME
fi

echo "Configuring PM2 autostart..."
pm2 save
sudo env PATH=$PATH:/usr/bin /usr/local/lib/node_modules/pm2/bin/pm2 startup systemd -u ubuntu --hp /home/ubuntu > /dev/null 2>&1 || true

if [ -f /etc/nginx/sites-enabled/forum-api ]; then
    echo "Reloading Nginx..."
    sudo systemctl reload nginx || echo "Nginx reload failed - may not be configured yet"
fi

echo "Running health check..."
sleep 3
if curl -f http://localhost:5000 > /dev/null 2>&1; then
    echo "Deployment completed successfully!"
else
    echo "Warning: Health check failed, but deployment completed"
fi

echo "PM2 Status:"
pm2 list