#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "================================================="
echo "   CalApp01 Server Deployment Setup Script"
echo "================================================="

# Ask for domain
read -p "Enter your domain name (e.g., app.yourdomain.com): " DOMAIN
if [ -z "$DOMAIN" ]; then
    echo "Domain is required. Exiting."
    exit 1
fi

# Ask for admin email
read -p "Enter admin email (for initial setup and SSL): " ADMIN_EMAIL
if [ -z "$ADMIN_EMAIL" ]; then
    echo "Admin email is required. Exiting."
    exit 1
fi

# 1. Install Docker if not installed
if ! command -v docker &> /dev/null
then
    echo "[1/4] Installing Docker..."
    curl -fsSL https://get.docker.com | sh
else
    echo "[1/4] Docker is already installed."
fi

# 2. Setup environment variables
echo "[2/4] Configuring environment variables..."
if [ ! -f .env ]; then
    cp .env.example .env
fi

# Generate strong secrets
JWT_ACCESS=$(openssl rand -hex 32)
JWT_REFRESH=$(openssl rand -hex 32)
PG_PASSWORD=$(openssl rand -hex 16)
ADMIN_PASSWORD=$(openssl rand -hex 12)

echo "      Generating VAPID keys for Push Notifications... (This may take a minute to pull node)"
docker run --rm node:18-alpine echo "Node image ready" > /dev/null
VAPID_OUTPUT=$(docker run --rm node:18-alpine sh -c "npx -y web-push generate-vapid-keys")

VAPID_PUB=$(echo "$VAPID_OUTPUT" | grep -A 1 "Public Key" | tail -n 1 | tr -d '\r' | tr -d ' ')
VAPID_PRIV=$(echo "$VAPID_OUTPUT" | grep -A 1 "Private Key" | tail -n 1 | tr -d '\r' | tr -d ' ')

# Apply Caddy specific domain variable
if ! grep -q "^APP_DOMAIN=" .env; then
    echo "APP_DOMAIN=${DOMAIN}" >> .env
else
    sed -i "s|^APP_DOMAIN=.*|APP_DOMAIN=${DOMAIN}|g" .env
fi

# Replace values in .env using sed
sed -i "s|^APP_URL=.*|APP_URL=https://${DOMAIN}|g" .env
sed -i "s|^CORS_ORIGIN=.*|CORS_ORIGIN=https://${DOMAIN}|g" .env
sed -i "s|^ADMIN_EMAIL=.*|ADMIN_EMAIL=${ADMIN_EMAIL}|g" .env

sed -i "s|^JWT_ACCESS_SECRET=.*|JWT_ACCESS_SECRET=${JWT_ACCESS}|g" .env
sed -i "s|^JWT_REFRESH_SECRET=.*|JWT_REFRESH_SECRET=${JWT_REFRESH}|g" .env
sed -i "s|^POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=${PG_PASSWORD}|g" .env
sed -i "s|^ADMIN_DEFAULT_PASSWORD=.*|ADMIN_DEFAULT_PASSWORD=${ADMIN_PASSWORD}|g" .env

sed -i "s|^VAPID_PUBLIC_KEY=.*|VAPID_PUBLIC_KEY=${VAPID_PUB}|g" .env
sed -i "s|^VAPID_PRIVATE_KEY=.*|VAPID_PRIVATE_KEY=${VAPID_PRIV}|g" .env
sed -i "s|^VAPID_EMAIL=.*|VAPID_EMAIL=mailto:${ADMIN_EMAIL}|g" .env

sed -i "s|^DATABASE_URL=.*|DATABASE_URL=postgresql://calapp:${PG_PASSWORD}@postgres:5432/calapp_db?schema=public|g" .env

# 3. Start the application
echo "[3/4] Starting Docker containers..."
docker compose up -d --build

# 4. Final instructions
echo "[4/4] Setup Complete!"
echo "================================================="
echo "Your application is deploying and should be available at:"
echo "🌐 https://${DOMAIN}"
echo ""
echo "Admin Account Details:"
echo "Email: ${ADMIN_EMAIL}"
echo "Password: ${ADMIN_PASSWORD}"
echo ""
echo "⚠️ IMPORTANT:"
echo "1. Please save the admin password securely."
echo "2. Edit the .env file later to configure your SMTP settings to enable email sending."
echo "================================================="
