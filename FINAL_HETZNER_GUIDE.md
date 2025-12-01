# DARCY Hetzner Deployment - Complete Step-by-Step Guide

## Your Server Details
- **IP:** 65.21.250.169
- **Username:** root
- **GitHub:** https://github.com/leeptolemy/darcy

---

## STEP 1: Connect to Server via PuTTY (2 minutes)

### Open PuTTY
1. Double-click **putty.exe**
2. PuTTY Configuration window opens

### Enter Server Details
1. **Host Name:** Type `65.21.250.169`
2. **Port:** `22`
3. **Connection type:** SSH (should be selected)
4. Click **"Open"**

### First Connection (Security Alert)
- Click **"Accept"** when asked about host key
- Terminal window opens (black screen)

### Login
1. At `login as:` → Type `root` → Press Enter
2. At `password:` → Right-click (pastes password) OR type password
3. Press Enter

### Change Password (First Time Only)
1. `Current password:` → Right-click (paste) → Enter
2. `New password:` → Type new password → Enter
3. `Retype:` → Type same password → Enter
4. See: `password updated successfully`

**You're in!** You'll see: `root@Darcy:~#`

---

## STEP 2: Fix DNS (Required for Internet Access) (1 minute)

**Run these ONE BY ONE:**

```bash
chattr -i /etc/resolv.conf
```

```bash
rm -f /etc/resolv.conf
```

```bash
echo "nameserver 8.8.8.8" > /etc/resolv.conf
```

```bash
echo "nameserver 1.1.1.1" >> /etc/resolv.conf
```

**Test internet:**
```bash
ping -c 3 google.com
```
**Should see:** `64 bytes from...` ✅

**Press Ctrl+C to stop**

---

## STEP 3: Update System (5 minutes)

```bash
apt update
```
**Press Enter, wait 1 minute**

```bash
apt upgrade -y
```
**Press Enter, wait 3-5 minutes**

**When done, you'll see:** `root@Darcy:~#` again

---

## STEP 4: Install Node.js (2 minutes)

```bash
snap install node --classic --channel=18
```
**Press Enter, wait 2 minutes**

**You'll see:**
```
node 18.20.5 from OpenJS Foundation installed
```

**Verify:**
```bash
node --version
```
**Should show:** `v18.20.5` ✅

```bash
npm --version
```
**Should show:** `10.8.2` ✅

---

## STEP 5: Install Other Tools (3 minutes)

```bash
apt install -y nginx git wget unzip python3-pip
```
**Press Enter, wait 2-3 minutes**

---

## STEP 6: Install MongoDB (3 minutes)

**Run these ONE BY ONE:**

```bash
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | gpg --dearmor -o /usr/share/keyrings/mongodb-server-7.0.gpg
```

```bash
echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-7.0.list
```

```bash
apt update
```

```bash
apt install -y mongodb-org
```
**Wait 2 minutes**

```bash
systemctl start mongod
systemctl enable mongod
```

**Check status:**
```bash
systemctl status mongod
```
**Should show:** `active (running)` in GREEN ✅

**Press Q to exit**

---

## STEP 7: Download DARCY from GitHub (1 minute)

```bash
cd /var/www
```

```bash
git clone https://github.com/leeptolemy/darcy.git
```

**If git clone fails, try wget:**
```bash
wget https://codeload.github.com/leeptolemy/darcy/zip/refs/heads/master -O darcy.zip
unzip darcy.zip
mv darcy-master darcy
```

**Verify:**
```bash
cd darcy
ls
```
**Should show:** `backend  frontend  electron.js  README.md`

---

## STEP 8: Install Backend (5 minutes)

```bash
cd /var/www/darcy/backend
```

**Install Python packages:**
```bash
pip3 install -r requirements.txt --break-system-packages
```
**Wait 5 minutes**

**You'll see packages installing**
**Warning about "root user" is NORMAL - ignore it**

**When done, create .env file:**
```bash
cat > .env << 'EOF'
MONGO_URL=mongodb://localhost:27017
DB_NAME=darcy_production
CORS_ORIGINS=*
EOF
```

**Verify .env created:**
```bash
cat .env
```
**Should show the 3 lines**

---

## STEP 9: Install Frontend (12 minutes)

```bash
cd /var/www/darcy/frontend
```

**Install packages:**
```bash
npm install --legacy-peer-deps
```
**Wait 10-12 minutes** ☕

**You'll see:**
```
added 1746 packages in 10m
```

**Build production version:**
```bash
npm run build
```
**Wait 3 minutes**

**You'll see:**
```
Compiled successfully!
File sizes after gzip:
  94.83 kB  build/static/js/main.xxx.js
```

---

## STEP 10: Start Backend Service (1 minute)

**Create service file:**
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

**Start service:**
```bash
systemctl daemon-reload
systemctl enable darcy-backend
systemctl start darcy-backend
```

**Check status:**
```bash
systemctl status darcy-backend
```
**Should show:** `active (running)` in GREEN ✅

**Press Q to exit**

---

## STEP 11: Configure Nginx Web Server (1 minute)

**Create Nginx config:**
```bash
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
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF
```

**Enable site:**
```bash
ln -sf /etc/nginx/sites-available/darcy /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
```

**Test config:**
```bash
nginx -t
```
**Should show:** `syntax is ok` and `test is successful` ✅

**Restart Nginx:**
```bash
systemctl restart nginx
```

---

## STEP 12: TEST DARCY! 🎉

### **In your web browser, visit:**

**http://65.21.250.169**

**You should see:**
- ✅ DARCY interface
- ✅ Header with logo
- ✅ All widgets
- ✅ START button

**Click START → Drones appear!** ✅

---

## STEP 13: Point Your Domain (5 minutes)

### **In Namecheap:**
1. Log in to Namecheap.com
2. Domain List → schonegroup.com → Manage
3. Advanced DNS
4. Add New Record:
   - Type: **A Record**
   - Host: **darcy**
   - Value: **65.21.250.169**
   - TTL: **300**
5. Save

**Wait 10 minutes for DNS**

**Visit:** http://darcy.schonegroup.com

**DARCY loads!** ✅

---

## STEP 14: Add SSL Certificate (Optional, 5 minutes)

```bash
apt install -y certbot python3-certbot-nginx
```

```bash
certbot --nginx -d darcy.schonegroup.com
```

**Answer prompts:**
- Email: your@email.com → Enter
- Agree to terms: Y → Enter  
- Share email: N → Enter
- Redirect HTTP to HTTPS: 2 → Enter

**Done!**

**Visit:** https://darcy.schonegroup.com (secure!) 🔒

---

## **COMPLETE COMMAND LIST (Copy All)**

**Here are ALL commands in order - just copy and paste section by section:**

```bash
# Fix DNS
chattr -i /etc/resolv.conf
rm -f /etc/resolv.conf
echo "nameserver 8.8.8.8" > /etc/resolv.conf
echo "nameserver 1.1.1.1" >> /etc/resolv.conf

# Update
apt update && apt upgrade -y

# Install Node.js
snap install node --classic --channel=18

# Install tools
apt install -y nginx git wget unzip python3-pip

# MongoDB
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | gpg --dearmor -o /usr/share/keyrings/mongodb-server-7.0.gpg
echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-7.0.list
apt update && apt install -y mongodb-org
systemctl start mongod && systemctl enable mongod

# Get DARCY
cd /var/www
git clone https://github.com/leeptolemy/darcy.git
cd darcy

# Backend
cd backend
pip3 install -r requirements.txt --break-system-packages --ignore-installed urllib3
echo -e "MONGO_URL=mongodb://localhost:27017\nDB_NAME=darcy_production\nCORS_ORIGINS=*" > .env

# Frontend
cd ../frontend
npm install --legacy-peer-deps
npm run build

# Backend Service
cat > /etc/systemd/system/darcy-backend.service << 'EOF'
[Unit]
Description=DARCY Backend
After=network.target

[Service]
WorkingDirectory=/var/www/darcy/backend
Environment="MONGO_URL=mongodb://localhost:27017"
ExecStart=/usr/bin/python3 -m uvicorn server:app --host 0.0.0.0 --port 8001
Restart=always

[Install]
WantedBy=multi-user.target
EOF
systemctl enable darcy-backend && systemctl start darcy-backend

# Nginx
cat > /etc/nginx/sites-available/darcy << 'EOF'
server {
    listen 80;
    server_name _;
    location / {
        root /var/www/darcy/frontend/build;
        try_files $uri /index.html;
    }
    location /api {
        proxy_pass http://localhost:8001/api;
    }
}
EOF
rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/darcy /etc/nginx/sites-enabled/
systemctl restart nginx

# SSL (optional)
apt install -y certbot python3-certbot-nginx
certbot --nginx -d darcy.schonegroup.com
```

---

## **Timeline:**

- Step 1-2 (PuTTY + DNS): 2 min
- Step 3 (System update): 5 min
- Step 4 (Node.js): 2 min
- Step 5 (Tools): 3 min
- Step 6 (MongoDB): 3 min
- Step 7 (Clone): 1 min
- Step 8 (Backend): 5 min
- Step 9 (Frontend): 15 min ← Longest step
- Step 10-11 (Services): 2 min
- Step 12 (Test): 1 min
- Step 13 (DNS): 10 min
- Step 14 (SSL): 5 min

**Total: ~45 minutes**

---

## **Where You Are Now:**

- ✅ Backend packages installed
- ⏳ Need to continue with frontend

**Run the frontend commands (from Step 9) now!** 🚀
