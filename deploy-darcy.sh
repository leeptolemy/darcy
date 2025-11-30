#!/bin/bash
# DARCY Auto-Deployment Script for Hetzner
# Run this ONCE and it installs everything!

set -e  # Exit on any error

echo "========================================="
echo "DARCY Automatic Deployment Starting..."
echo "========================================="

# Fix DNS
echo "Step 1/10: Fixing DNS..."
systemctl disable systemd-resolved 2>/dev/null || true
systemctl stop systemd-resolved 2>/dev/null || true
rm -f /etc/resolv.conf
echo "nameserver 8.8.8.8" > /etc/resolv.conf
echo "nameserver 1.1.1.1" >> /etc/resolv.conf
chattr +i /etc/resolv.conf
echo "✓ DNS fixed"

# Test internet
echo "Step 2/10: Testing internet connection..."
ping -c 2 8.8.8.8 > /dev/null && echo "✓ Internet working"

# Fix package manager
echo "Step 3/10: Fixing package manager..."
dpkg --configure -a
apt --fix-broken install -y > /dev/null
apt update > /dev/null
echo "✓ Package manager fixed"

# Install Node.js via snap
echo "Step 4/10: Installing Node.js..."
snap install node --classic --channel=18
echo "✓ Node.js installed: $(node --version)"

# Install other dependencies
echo "Step 5/10: Installing dependencies..."
apt install -y nginx unzip wget > /dev/null
echo "✓ Nginx installed"

# Install MongoDB
echo "Step 6/10: Installing MongoDB..."
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | gpg --dearmor -o /usr/share/keyrings/mongodb-server-7.0.gpg
echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-7.0.list
apt update > /dev/null
apt install -y mongodb-org > /dev/null
systemctl start mongod
systemctl enable mongod
echo "✓ MongoDB installed and running"

# Download DARCY from GitHub
echo "Step 7/10: Downloading DARCY code..."
cd /var/www
rm -rf darcy darcy.zip darcy-main 2>/dev/null || true

# Try git first
if git clone https://github.com/leeptolemy/darcy.git darcy 2>/dev/null; then
    echo "✓ Git clone succeeded"
else
    echo "Git failed, trying wget..."
    wget https://github.com/leeptolemy/darcy/archive/refs/heads/master.zip -O darcy.zip || \
    wget https://github.com/leeptolemy/darcy/archive/master.zip -O darcy.zip || \
    wget https://github.com/leeptolemy/darcy/archive/main.zip -O darcy.zip
    unzip -q darcy.zip
    mv darcy-* darcy
    echo "✓ Downloaded via ZIP"
fi

cd darcy

# Install backend dependencies
echo "Step 8/10: Installing backend dependencies..."
cd backend
pip3 install -r requirements.txt > /dev/null 2>&1
echo "✓ Backend dependencies installed"

# Create .env file
cat > .env << 'EOF'
MONGO_URL=mongodb://localhost:27017
DB_NAME=darcy_production
CORS_ORIGINS=*
EOF
echo "✓ Backend configured"

# Install frontend dependencies
echo "Step 9/10: Installing frontend dependencies..."
cd ../frontend
npm install --legacy-peer-deps > /dev/null 2>&1
echo "✓ Frontend dependencies installed"

# Build frontend
echo "Building frontend (this takes 3 minutes)..."
npm run build > /dev/null 2>&1
echo "✓ Frontend built"

# Setup backend service
echo "Step 10/10: Configuring services..."
cat > /etc/systemd/system/darcy-backend.service << 'EOF'
[Unit]
Description=DARCY Radar Backend
After=network.target mongod.service

[Service]
Type=simple
User=root
WorkingDirectory=/var/www/darcy/backend
Environment="MONGO_URL=mongodb://localhost:27017"
Environment="DB_NAME=darcy_production"
Environment="CORS_ORIGINS=*"
ExecStart=/usr/bin/python3 -m uvicorn server:app --host 0.0.0.0 --port 8001
Restart=always

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable darcy-backend
systemctl start darcy-backend
echo "✓ Backend service started"

# Configure Nginx
cat > /etc/nginx/sites-available/darcy << 'EOF'
server {
    listen 80;
    server_name darcy.schonegroup.com 65.21.250.169;
    
    location / {
        root /var/www/darcy/frontend/build;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://localhost:8001/api;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
EOF

ln -sf /etc/nginx/sites-available/darcy /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx
echo "✓ Nginx configured"

echo ""
echo "========================================="
echo "✅ DARCY DEPLOYMENT COMPLETE!"
echo "========================================="
echo ""
echo "Visit: http://65.21.250.169"
echo "Or: http://darcy.schonegroup.com (after DNS)"
echo ""
echo "Check status:"
echo "  systemctl status darcy-backend"
echo "  systemctl status nginx"
echo "========================================="
