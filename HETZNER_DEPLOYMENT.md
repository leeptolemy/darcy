# DARCY Deployment on Hetzner VPS - Simple Guide

## VPS Recommendation for DARCY

### **Choose This Plan:**

**Hetzner Cloud - CX22 (Cost-Optimized)**
- **vCPU:** 2 cores (shared)
- **RAM:** 4 GB
- **Storage:** 40 GB SSD
- **Traffic:** 20 TB/month
- **Price:** €3.49/month (~$3.80 USD)
- **Perfect for:** DARCY with light to medium radar traffic

**Why this plan:**
✅ Enough RAM for FastAPI + React + MongoDB
✅ Enough storage for application + data
✅ Very affordable
✅ Can upgrade later if needed

**If you expect heavy traffic (1000+ detections/day):**
- Upgrade to **CX33**: 4 vCPU, 8GB RAM, €5.49/month

---

## Step-by-Step Deployment (30 Minutes)

### **Part 1: Create Hetzner Account & Server (10 minutes)**

#### Step 1: Sign Up
1. Go to: https://www.hetzner.com/cloud
2. Click **"Sign Up"** or **"Console"**
3. Create account with email
4. Verify email
5. Add payment method (credit card or PayPal)

#### Step 2: Create Server
1. Log into Hetzner Cloud Console
2. Click **"New Project"**
3. Name it: **"DARCY Radar"**
4. Click **"Add Server"**
5. **Location:** Choose closest to you:
   - Nuremberg, Germany (recommended for Europe)
   - Helsinki, Finland
   - Ashburn, USA (if in US)
6. **Image:** Ubuntu 22.04 (click it)
7. **Type:** Standard → **CX22** (€3.49/month)
8. **Networking:** Leave defaults (IPv4 + IPv6)
9. **SSH Key:** Skip for now (we'll use password)
10. **Name:** darcy-server
11. Click **"Create & Buy Now"**
12. Wait 30 seconds
13. **Server is ready!**

#### Step 3: Get Server Details
- **IP Address:** Shows in server list (e.g., 95.217.123.45)
- **Root Password:** Sent to your email
- **Copy both!**

---

### **Part 2: Connect to Server (2 minutes)**

#### On Windows (Using PuTTY):

**Download PuTTY:**
1. Go to: https://www.putty.org/
2. Download `putty.exe`
3. Run it (no install needed)

**Connect:**
1. Open PuTTY
2. **Host Name:** Paste your server IP (e.g., 95.217.123.45)
3. **Port:** 22
4. Click **"Open"**
5. Security alert appears → Click **"Accept"**
6. **login as:** Type `root`
7. **Password:** Paste root password from email (right-click to paste)
8. Press Enter
9. **You're in!** You'll see: `root@darcy-server:~#`

---

### **Part 3: Install Dependencies (10 minutes)**

**Copy and paste these commands ONE BY ONE in PuTTY:**

#### Update System:
```bash
apt update && apt upgrade -y
```
*Press Enter, wait 2 minutes*

#### Install Node.js:
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs
```
*Press Enter, wait 1 minute*

#### Install Python:
```bash
apt install -y python3 python3-pip python3-venv
```
*Press Enter, wait 1 minute*

#### Install MongoDB:
```bash
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | gpg --dearmor -o /usr/share/keyrings/mongodb-server-7.0.gpg
echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-7.0.list
apt update
apt install -y mongodb-org
systemctl start mongod
systemctl enable mongod
```
*Press Enter, wait 2 minutes*

#### Install Nginx:
```bash
apt install -y nginx
```
*Press Enter, wait 1 minute*

#### Install Git:
```bash
apt install -y git
```
*Press Enter, wait 30 seconds*

---

### **Part 4: Deploy DARCY (5 minutes)**

#### Clone Repository:
```bash
cd /var/www
git clone https://github.com/YOUR_USERNAME/darcy-radar-system.git darcy
cd darcy
```

#### Setup Backend:
```bash
cd backend
pip3 install -r requirements.txt
```
*Wait 3 minutes*

#### Create .env File:
```bash
cat > .env << EOF
MONGO_URL=mongodb://localhost:27017
DB_NAME=darcy_production
CORS_ORIGINS=*
EOF
```

#### Setup Frontend:
```bash
cd ../frontend
npm install --legacy-peer-deps
```
*Wait 5 minutes*

#### Build Frontend:
```bash
npm run build
```
*Wait 2 minutes*

---

### **Part 5: Configure Nginx (2 minutes)**

#### Create Nginx Config:
```bash
cat > /etc/nginx/sites-available/darcy << 'EOF'
server {
    listen 80;
    server_name darcy.schonegroup.com;

    # Frontend
    location / {
        root /var/www/darcy/frontend/build;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:8001/api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF
```

#### Enable Site:
```bash
ln -s /etc/nginx/sites-available/darcy /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

---

### **Part 6: Start DARCY Backend (1 minute)**

#### Create Systemd Service:
```bash
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
```

#### Start Service:
```bash
systemctl daemon-reload
systemctl enable darcy-backend
systemctl start darcy-backend
```

#### Check Status:
```bash
systemctl status darcy-backend
```

**Should see:** "Active: active (running)" in green ✅

---

### **Part 7: Point Your Domain (5 minutes)**

#### In Namecheap:
1. Log in to Namecheap
2. Domain List → schonegroup.com → Manage
3. Advanced DNS
4. Add A Record:
   - **Type:** A Record
   - **Host:** darcy
   - **Value:** [Your Hetzner Server IP - e.g., 95.217.123.45]
   - **TTL:** 300
5. Save

#### Wait 5-10 Minutes for DNS
Then visit: **http://darcy.schonegroup.com**

**DARCY loads!** ✅

---

### **Part 8: Add SSL Certificate (5 minutes)**

**In PuTTY (on your server):**

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d darcy.schonegroup.com
```

**Follow prompts:**
- Email: your@email.com
- Agree to terms: Y
- Share email: N
- Redirect HTTP to HTTPS: Y (choose option 2)

**Done! Now visit:** **https://darcy.schonegroup.com**

**Secure DARCY with SSL!** 🔒✅

---

## **Complete Command Sequence (Copy This)**

**In PuTTY, run all these commands in order:**

```bash
# Install dependencies
apt update && apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs python3 python3-pip git nginx
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | gpg --dearmor -o /usr/share/keyrings/mongodb-server-7.0.gpg
echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-7.0.list
apt update && apt install -y mongodb-org
systemctl start mongod && systemctl enable mongod

# Clone and setup
cd /var/www
git clone https://github.com/YOUR_USERNAME/darcy-radar-system.git darcy
cd darcy/backend
pip3 install -r requirements.txt
cat > .env << EOF
MONGO_URL=mongodb://localhost:27017
DB_NAME=darcy_production
CORS_ORIGINS=*
EOF

cd ../frontend
npm install --legacy-peer-deps
npm run build

# Configure Nginx
cat > /etc/nginx/sites-available/darcy << 'EOF'
server {
    listen 80;
    server_name darcy.schonegroup.com;
    location / {
        root /var/www/darcy/frontend/build;
        try_files $uri $uri/ /index.html;
    }
    location /api {
        proxy_pass http://localhost:8001/api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

ln -s /etc/nginx/sites-available/darcy /etc/nginx/sites-enabled/
nginx -t && systemctl restart nginx

# Start backend service
cat > /etc/systemd/system/darcy-backend.service << 'EOF'
[Unit]
Description=DARCY Radar Backend
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/var/www/darcy/backend
Environment="MONGO_URL=mongodb://localhost:27017"
ExecStart=/usr/bin/python3 -m uvicorn server:app --host 0.0.0.0 --port 8001
Restart=always

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable darcy-backend
systemctl start darcy-backend
systemctl status darcy-backend

# Install SSL
apt install -y certbot python3-certbot-nginx
certbot --nginx -d darcy.schonegroup.com
```

---

## **Cost Breakdown**

**Hetzner CX22:**
- Server: €3.49/month (~$3.80)
- Traffic: Included (20TB)
- IPv4: Included
- SSL: Free (Let's Encrypt)
- **Total: €3.49/month**

**vs Emergent:**
- 50 credits/month (~$5)
- Everything managed
- No server setup

**Hetzner is €1.50/month cheaper but requires setup**

---

## **Which Server to Pick on Hetzner:**

### **For DARCY:**

**Minimum (Testing):**
- CX22: 2 vCPU, 4GB RAM - €3.49/month

**Recommended (Production):**
- CX33: 4 vCPU, 8GB RAM - €5.49/month

**If High Traffic:**
- CPX32: 4 vCPU, 8GB RAM, Dedicated - €10.99/month

**Start with CX22, upgrade later if needed!**

---

## **Timeline:**

**Total deployment time: ~45 minutes**
- Account setup: 5 min
- Server creation: 2 min
- Dependency installation: 15 min
- DARCY deployment: 10 min
- Nginx configuration: 2 min
- SSL certificate: 5 min
- DNS propagation: 10 min

---

## **After Deployment:**

**Visit:** https://darcy.schonegroup.com

**You'll see:**
- ✅ Full DARCY interface
- ✅ All 35 widgets
- ✅ Enhanced radar
- ✅ Cluj map
- ✅ AI predictions
- ✅ Everything working!

**Hardware Connection:**
- Your local PC can connect to radar hardware
- Send data to: https://darcy.schonegroup.com/api
- DARCY displays it remotely!

---

## **Summary:**

**Hetzner VPS = Best option for you!**
- Cheap (€3.49/month)
- Full control
- Linux (no Windows issues!)
- Works with hardware
- Professional deployment
- Your own domain

**Start here:** https://www.hetzner.com/cloud

**Choose:** CX22 server with Ubuntu 22.04

**Follow the command sequence above - Done in 45 minutes!** 🚀
