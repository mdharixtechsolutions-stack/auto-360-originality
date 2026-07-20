#!/bin/bash
# ============================================================
# Auto360 VPS Deployment Script
# Run this INSIDE your VPS via SSH: bash deploy.sh
# ============================================================

set -e
echo "======================================================"
echo "  Auto360 - VPS Deployment Script"
echo "======================================================"

# ── Step 1: Update System ──────────────────────────────────
echo ""
echo "📦 [1/7] Updating system packages..."
apt update -y && apt upgrade -y

# ── Step 2: Install Node.js 20 ────────────────────────────
echo ""
echo "⬇️  [2/7] Installing Node.js 20 LTS..."
if ! command -v node &> /dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt install -y nodejs
else
  echo "  Node.js already installed: $(node -v)"
fi

# ── Step 3: Install PM2 & Nginx ───────────────────────────
echo ""
echo "⚙️  [3/7] Installing PM2 and Nginx..."
npm install -g pm2 2>/dev/null || true
apt install -y nginx

# ── Step 4: Clone / Update repo ───────────────────────────
echo ""
echo "📂 [4/7] Cloning/updating app from GitHub..."
if [ -d "/var/www/auto360" ]; then
  echo "  Repo already exists — pulling latest changes..."
  cd /var/www/auto360
  git pull origin main
else
  cd /var/www
  git clone https://github.com/rmukesh19/auto360.git
  cd /var/www/auto360
fi

# ── Step 5: Create .env file ──────────────────────────────
echo ""
echo "🔐 [5/7] Setting up environment variables..."
if [ ! -f ".env" ]; then
  echo "  Creating .env file..."
  cat > .env << 'ENVEOF'
GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE
APP_URL=https://360auto.harixtechsolutions.com
ADMIN_SECRET_CODE=HarixTechAdmin2026
JWT_SECRET=auto360_jwt_secret_2026_secure
ENVEOF
  echo ""
  echo "  ⚠️  IMPORTANT: Edit .env and add your real GEMINI_API_KEY!"
  echo "  Run: nano /var/www/auto360/.env"
else
  echo "  .env already exists — skipping."
fi

# ── Step 6: Install deps & Build ──────────────────────────
echo ""
echo "🔨 [6/7] Installing dependencies and building..."
npm install
npm run build
echo "  ✅ Build complete!"

# ── Step 7: Start with PM2 ────────────────────────────────
echo ""
echo "🚀 [7/7] Starting app with PM2..."
pm2 stop auto360 2>/dev/null || true
pm2 delete auto360 2>/dev/null || true
NODE_ENV=production pm2 start dist/server.cjs --name "auto360"
pm2 save
pm2 startup | tail -1 | bash 2>/dev/null || true

# ── Configure Nginx ───────────────────────────────────────
echo ""
echo "🌐 Configuring Nginx reverse proxy..."
cat > /etc/nginx/sites-available/auto360 << 'NGINXEOF'
server {
    listen 80;
    server_name 360auto.harixtechsolutions.com _;

    # Increase upload size for file uploads
    client_max_body_size 50M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
    }
}
NGINXEOF

# Enable site
rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/auto360 /etc/nginx/sites-enabled/auto360

# Test and reload nginx
nginx -t && systemctl restart nginx && systemctl enable nginx

# ── Done ──────────────────────────────────────────────────
echo ""
echo "======================================================"
echo "  ✅ DEPLOYMENT COMPLETE!"
echo "======================================================"
echo ""
echo "  🌍 App running at:  http://200.97.165.83"
echo "  🌍 Domain:          http://360auto.harixtechsolutions.com"
echo "  🔑 Login:           admin / Admin@123"
echo ""
echo "  📋 Useful commands:"
echo "     pm2 status              → check app status"
echo "     pm2 logs auto360        → view app logs"
echo "     pm2 restart auto360     → restart app"
echo "     systemctl status nginx  → check nginx"
echo ""
echo "  ⚠️  Remember to update your GEMINI_API_KEY in .env:"
echo "     nano /var/www/auto360/.env"
echo "     pm2 restart auto360"
echo "======================================================"
