#!/bin/bash
# -----------------------------------------------------------------------------
# setup-ssl.sh - Script to configure NGINX reverse proxy and Certbot on EC2
# -----------------------------------------------------------------------------
# INSTRUCTIONS:
# 1. SSH into your EC2 instance.
# 2. Open this script and change the YOUR_DOMAIN variable below to your actual domain name.
# 3. Ensure you have created an A-Record in your DNS provider pointing to your EC2 public IP.
# 4. Run: chmod +x setup-ssl.sh
# 5. Run: sudo ./setup-ssl.sh
# -----------------------------------------------------------------------------

YOUR_DOMAIN="syncmind.duckdns.org"
EMAIL="admin@$YOUR_DOMAIN"

if [ "$YOUR_DOMAIN" = "yourdomain.com" ]; then
  echo "Error: Please edit this script and set YOUR_DOMAIN to your actual domain name."
  exit 1
fi

echo "==================================================="
echo " Starting NGINX & SSL Setup for $YOUR_DOMAIN"
echo "==================================================="

# 1. Update and install NGINX and Certbot
echo "[1/4] Installing NGINX and Certbot..."
sudo apt-get update
sudo apt-get install -y nginx certbot python3-certbot-nginx

# 2. Create NGINX Configuration
echo "[2/4] Creating NGINX reverse proxy configuration..."
cat <<EOF | sudo tee /etc/nginx/sites-available/syncmind
server {
    listen 80;
    server_name $YOUR_DOMAIN;

    location / {
        proxy_pass http://localhost:3000; # Points to Frontend running on port 3000 (Docker)
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }

    location /api/auth/ {
        proxy_pass http://localhost:5001/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    }

    location /api/project/ {
        proxy_pass http://localhost:5002/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    }
}
EOF

# 3. Enable NGINX site and test
echo "[3/4] Enabling site and testing NGINX configuration..."
sudo ln -sf /etc/nginx/sites-available/syncmind /etc/nginx/sites-enabled/
# Remove default nginx config to prevent conflicts
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t

# Restart NGINX to apply initial HTTP config before Certbot
sudo systemctl restart nginx

# 4. Generate SSL Certificates using Certbot
echo "[4/4] Obtaining SSL certificate from Let's Encrypt..."
sudo certbot --nginx -d $YOUR_DOMAIN --non-interactive --agree-tos -m $EMAIL --redirect

echo "==================================================="
echo " Setup Complete! NGINX is now serving HTTPS."
echo " Ensure your frontend and docker containers are running."
echo "==================================================="
