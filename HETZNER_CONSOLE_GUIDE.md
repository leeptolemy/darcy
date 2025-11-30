# DARCY on Hetzner - Complete Beginner's Guide (Web Console)

## Using Hetzner Web Console (No PuTTY/SSH Needed!)

### **Your Server:** 65.21.250.169

---

## PART 1: Access Web Console (2 minutes)

### Step 1: Open Hetzner Cloud Console

1. Go to: https://console.hetzner.cloud/
2. Log in with your Hetzner account
3. Click on your project: **"DARCY Radar"** (or whatever you named it)
4. You'll see your server listed

### Step 2: Open Web Console

1. Click on your server name (shows IP: 65.21.250.169)
2. Look for **"Console"** button (top-right area)
3. Click **"Console"** 
4. New browser tab opens with terminal
5. **Black terminal appears!** ✅

**You're now directly on your server - no PuTTY needed!**

---

## PART 2: Fix Package Manager (5 minutes)

### **The server had interrupted installations. Let's fix it:**

**In the web console terminal, copy and paste these ONE BY ONE:**

### Command 1: Clean up
```bash
dpkg --configure -a
```
**Press Enter**
**Wait 30 seconds**

### Command 2: Fix broken packages
```bash
apt --fix-broken install -y
```
**Press Enter**
**Wait 2-3 minutes** (text scrolls)
**When you see `root@Darcy:~#` again → Done!**

### Command 3: Update package list
```bash
apt update
```
**Press Enter**
**Wait 30 seconds**

### Command 4: Upgrade system
```bash
apt upgrade -y
```
**Press Enter**
**Wait 5 minutes**

**✅ System is clean now!**

---

## PART 3: Install Node.js (3 minutes)

### **Install Node.js using Snap (easiest method):**

```bash
snap install node --classic --channel=18
```
**Press Enter**
**Wait 2 minutes**

**You'll see:**
```
node 18.x.x from OpenJS Foundation installed
```

**Verify:**
```bash
node --version
```
**Should show:** `v18.20.5` or similar ✅

```bash
npm --version
```
**Should show:** `10.8.2` or similar ✅

**✅ Node.js installed!**

---

## PART 4: Verify Python & MongoDB (1 minute)

**Check Python (already installed on Ubuntu):**
```bash
python3 --version
```
**Should show:** `Python 3.12.3` ✅

**Check MongoDB:**
```bash
systemctl status mongod
```
**Should show:** `active (running)` in green ✅

**Press Q to exit**

**Check Git:**
```bash
git --version
```
**Should show:** `git version 2.x` ✅

**Check Nginx:**
```bash
nginx -v
```
**Should show:** `nginx version: 1.x` ✅

**✅ All dependencies ready!**

---

## PART 5: Get DARCY Code from GitHub (2 minutes)

### **Create directory:**
```bash
mkdir -p /var/www
cd /var/www
```

### **Clone DARCY:**

**⚠️ IMPORTANT:** Replace `YOUR_USERNAME` with your GitHub username!

```bash
git clone https://github.com/YOUR_USERNAME/darcy-radar-system.git darcy
```

**Example if your GitHub username is "john123":**
```bash
git clone https://github.com/john123/darcy-radar-system.git darcy
```

**Press Enter**
**Wait 30 seconds**

**You'll see:**
```
Cloning into 'darcy'...
Receiving objects: 100% (XXX/XXX), done.
```

**Verify it worked:**
```bash
ls darcy
```
**Should show:** `backend  frontend  electron.js  README.md` etc. ✅

---

## PART 6: Install Backend Dependencies (5 minutes)

```bash
cd /var/www/darcy/backend
```

```bash
pip3 install -r requirements.txt
```
**Press Enter**
**Wait 5 minutes** (lots of text scrolling)

**You'll see packages installing:**
```
Collecting fastapi==0.110.1
Downloading...
Successfully installed fastapi-0.110.1 uvicorn-0.25.0 ...
```

**✅ When you see "Successfully installed..." → Done!**

---

## PART 7: Create Backend Configuration (30 seconds)

```bash
cat > .env << 'EOF'
MONGO_URL=mongodb://localhost:27017
DB_NAME=darcy_production
CORS_ORIGINS=*
EOF
```
**Press Enter**

**Verify it was created:**
```bash
cat .env
```
**Should show:**
```
MONGO_URL=mongodb://localhost:27017
DB_NAME=darcy_production
CORS_ORIGINS=*
```
**✅ Config file created!**

---

## PART 8: Install Frontend Dependencies (12 minutes)

```bash
cd /var/www/darcy/frontend
```

```bash
npm install --legacy-peer-deps
```
**Press Enter**
**Wait 10-12 minutes** (downloading ~500MB)

**You'll see:**
```
npm WARN deprecated...
added 1523 packages in 10m
```

**✅ When you see "added XXXX packages" → Done!**

---

## PART 9: Build Frontend for Production (3 minutes)

```bash
npm run build
```
**Press Enter**
**Wait 3 minutes**

**You'll see:**
```
Creating an optimized production build...
Compiled successfully!

File sizes after gzip:
  94.83 kB  build/static/js/main.xxx.js
  
The build folder is ready to be deployed.
```

**✅ When you see "Compiled successfully!" → Done!**

---

## PART 10: Start Backend Service (1 minute)

### **Create systemd service file:**

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
**Press Enter**

### **Start the service:**
```bash
systemctl daemon-reload
systemctl enable darcy-backend
systemctl start darcy-backend
```
**Press Enter after each command**

### **Check if running:**
```bash
systemctl status darcy-backend
```
**Should show:** `Active: active (running)` in GREEN ✅

**Press Q to exit**

**✅ Backend is running on port 8001!**

---

## PART 11: Configure Nginx Web Server (2 minutes)

### **Create Nginx config:**

```bash
cat > /etc/nginx/sites-available/darcy << 'EOF'
server {
    listen 80;
    server_name darcy.schonegroup.com 65.21.250.169;
    
    location / {
        root /var/www/darcy/frontend/build;
        try_files $uri $uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://localhost:8001/api;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
EOF
```
**Press Enter**

### **Enable the site:**
```bash
ln -s /etc/nginx/sites-available/darcy /etc/nginx/sites-enabled/
```

### **Remove default site:**
```bash
rm -f /etc/nginx/sites-enabled/default
```

### **Test config:**
```bash
nginx -t
```
**Should show:** `syntax is ok` and `test is successful` ✅

### **Restart Nginx:**
```bash
systemctl restart nginx
```

**✅ Web server configured!**

---

## PART 12: Test DARCY! (Right Now!)

### **In your web browser, visit:**

**http://65.21.250.169**

**You should see:**
- ✅ DARCY interface loads
- ✅ Header with DARCY logo
- ✅ All widgets visible
- ✅ Mock Data toggle
- ✅ START button

**If it loads → SUCCESS!** 🎉

**Click START button → Drones should appear!**

---

## PART 13: Point Your Domain (5 minutes)

### **In Namecheap:**

1. Log in to Namecheap.com
2. **Domain List** → **schonegroup.com** → **Manage**
3. **Advanced DNS** tab
4. **Add New Record:**
   - Type: **A Record**
   - Host: **darcy**
   - Value: **65.21.250.169**
   - TTL: **300** (5 minutes)
5. Click **✓** (save)

**Wait 5-10 minutes for DNS to update**

**Then visit:** **http://darcy.schonegroup.com**

**DARCY loads on your domain!** ✅

---

## PART 14: Add SSL Certificate (5 minutes)

### **In web console:**

```bash
apt install -y certbot python3-certbot-nginx
```
**Wait 1 minute**

```bash
certbot --nginx -d darcy.schonegroup.com
```

**You'll be asked:**
- **Email:** Type your email, press Enter
- **Terms:** Type `Y`, press Enter
- **Share email:** Type `N`, press Enter
- **Redirect HTTP to HTTPS:** Type `2`, press Enter

**Wait 30 seconds**

**You'll see:**
```
Successfully received certificate.
Certificate is saved at: /etc/letsencrypt/live/darcy.schonegroup.com/fullchain.pem
```

**✅ SSL installed!**

**Now visit:** **https://darcy.schonegroup.com** (with https!) 🔒

---

## **Summary - What We Did:**

**Time spent:** ~45 minutes total
**Commands run:** ~20 commands
**Result:** DARCY running on https://darcy.schonegroup.com

**Steps:**
1. ✅ Fixed package manager
2. ✅ Installed Node.js (via snap)
3. ✅ Verified Python, MongoDB, Git, Nginx
4. ✅ Cloned DARCY code
5. ✅ Installed backend dependencies (pip)
6. ✅ Created .env file
7. ✅ Installed frontend dependencies (npm)
8. ✅ Built production frontend
9. ✅ Started backend service
10. ✅ Configured Nginx
11. ✅ Pointed domain
12. ✅ Added SSL certificate

**Cost:** €3.49/month
**Performance:** Fast European server
**Access:** https://darcy.schonegroup.com

---

## **Troubleshooting:**

**If http://65.21.250.169 doesn't load:**
```bash
systemctl status darcy-backend
systemctl status nginx
```
Both should show "active (running)"

**If backend not running:**
```bash
journalctl -u darcy-backend -n 50
```
Shows error messages

**If frontend shows but API doesn't work:**
- Check CORS_ORIGINS in .env
- Restart backend: `systemctl restart darcy-backend`

---

## **Next Steps After Deployment:**

### **Test All Features:**
1. Visit https://darcy.schonegroup.com
2. Click START
3. See mock drones
4. Click drone → Modal opens
5. Test AI predictions
6. Test Share to LoCrypt modal

### **Connect Real Radar:**
1. Click Config (gear icon)
2. Change Radar Type: Mock → Serial/TCP
3. Enter hardware details
4. Connect physical radar
5. Real data appears!

### **Get LoCrypt Token:**
1. Register gateway in LoCrypt app
2. Get UUID token
3. In DARCY: Click "SETUP GATEWAY"
4. Paste token
5. Save
6. Alerts sent to LoCrypt groups!

---

## **The server is ready! Start with fixing packages and installing Node.js via snap!** 🚀

**Current status:** Server running, just needs software installed

**Start with Part 2 commands in the Hetzner web console!**
