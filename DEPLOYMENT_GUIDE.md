# DARCY Drone Detection Radar - Deployment Guide

## Quick Deploy to darcy.schonegroup.com

### Method 1: Deploy on Emergent (RECOMMENDED)

**Easiest and fully managed solution**

#### Step 1: Save to GitHub
1. In Emergent chat, click **"Save to GitHub"** button
2. Connect your GitHub account if not already connected
3. Choose repository name: `darcy-radar-system`
4. Click **"PUSH TO GITHUB"**
5. Wait for confirmation

#### Step 2: Deploy on Emergent
1. Click **"Deploy"** button in Emergent
2. Test with Preview first
3. Click **"Deploy Now"**
4. Wait ~10 minutes
5. You'll get a URL like: `https://darcy-radar.emergent.app`

#### Step 3: Configure Custom Domain
1. In Emergent → Deployments → Custom Domain
2. Click **"Link Domain"**
3. Enter: `darcy.schonegroup.com`
4. Copy the IP address provided (e.g., `34.57.15.54`)

#### Step 4: Update DNS in Namecheap
1. Log into Namecheap
2. Go to Domain List → schonegroup.com → Manage
3. Advanced DNS settings
4. Add new A Record:
   - **Type:** A Record
   - **Host:** darcy
   - **Value:** [IP from Emergent]
   - **TTL:** 300 (5 minutes)
5. Save changes
6. Wait 5-15 minutes for DNS propagation

#### Step 5: Verify
1. Visit: `https://darcy.schonegroup.com`
2. Should load DARCY application
3. All features working

**Cost:** 50 credits/month on Emergent

---

### Method 2: VPS Deployment (Full Control)

**If you need your own infrastructure**

#### Requirements:
- VPS or Cloud Server (DigitalOcean, AWS, Linode)
- Ubuntu 20.04+ recommended
- Root/sudo access

#### Step 1: Server Setup
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install dependencies
sudo apt install python3.9 python3-pip nodejs npm mongodb nginx supervisor -y

# Install yarn
npm install -g yarn
```

#### Step 2: Clone from GitHub
```bash
cd /var/www
git clone https://github.com/YOUR_USERNAME/darcy-radar-system.git
cd darcy-radar-system
```

#### Step 3: Backend Setup
```bash
cd backend
pip3 install -r requirements.txt

# Create .env file
cat > .env << EOF
MONGO_URL=mongodb://localhost:27017
DB_NAME=darcy_production
CORS_ORIGINS=https://darcy.schonegroup.com
EOF
```

#### Step 4: Frontend Build
```bash
cd ../frontend
yarn install

# Update .env for production
echo "REACT_APP_BACKEND_URL=https://darcy.schonegroup.com" > .env

yarn build
```

#### Step 5: Nginx Configuration
```bash
sudo nano /etc/nginx/sites-available/darcy
```

Paste:
```nginx
server {
    listen 80;
    server_name darcy.schonegroup.com;

    # Frontend
    location / {
        root /var/www/darcy-radar-system/frontend/build;
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
```

```bash
sudo ln -s /etc/nginx/sites-available/darcy /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### Step 6: Supervisor Configuration
```bash
sudo nano /etc/supervisor/conf.d/darcy-backend.conf
```

Paste:
```ini
[program:darcy-backend]
command=/usr/bin/python3 -m uvicorn server:app --host 0.0.0.0 --port 8001
directory=/var/www/darcy-radar-system/backend
autostart=true
autorestart=true
stderr_logfile=/var/log/darcy-backend.err.log
stdout_logfile=/var/www/darcy-backend.out.log
```

```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start darcy-backend
```

#### Step 7: SSL Certificate (Free)
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d darcy.schonegroup.com
```

#### Step 8: DNS Configuration (Namecheap)
1. Add A Record:
   - **Host:** darcy
   - **Value:** [Your VPS IP]
   - **TTL:** 300
2. Wait for DNS propagation (5-30 minutes)

---

### Method 3: cPanel (NOT RECOMMENDED)

**Why Not Recommended:**
- cPanel shared hosting doesn't support:
  - MongoDB (needs VPS)
  - FastAPI/ASGI (needs WSGI adapter)
  - Custom ports (8001)
  - Supervisor process management
  - Long-running processes

**If you must use cPanel:**
1. You'd need cPanel VPS (not shared hosting)
2. Still complex to configure FastAPI
3. Better to use DigitalOcean/AWS instead

---

## Deployment Checklist

### Before Deployment

- [ ] Test application locally
- [ ] Save to GitHub
- [ ] Update environment variables for production
- [ ] Build frontend for production
- [ ] Test with production build locally

### For Emergent Deployment

- [ ] Click "Deploy" in Emergent
- [ ] Configure custom domain
- [ ] Update Namecheap DNS A Record
- [ ] Wait for DNS propagation
- [ ] Test at darcy.schonegroup.com
- [ ] Verify all features working
- [ ] Test LoCrypt integration
- [ ] Monitor for 24 hours

### For VPS Deployment

- [ ] Provision VPS server
- [ ] Install all dependencies
- [ ] Clone from GitHub
- [ ] Configure environment variables
- [ ] Build frontend
- [ ] Configure Nginx
- [ ] Set up Supervisor
- [ ] Configure MongoDB
- [ ] Install SSL certificate
- [ ] Update DNS
- [ ] Test deployment
- [ ] Set up monitoring
- [ ] Configure backups

---

## Production Environment Variables

### Backend (.env)
```bash
MONGO_URL=mongodb://localhost:27017
DB_NAME=darcy_production
CORS_ORIGINS=https://darcy.schonegroup.com
PORT=8001
```

### Frontend (.env)
```bash
REACT_APP_BACKEND_URL=https://darcy.schonegroup.com
```

---

## Post-Deployment Testing

**Test Checklist:**
1. [ ] Application loads at darcy.schonegroup.com
2. [ ] All 35 widgets visible
3. [ ] Radar sweep animating
4. [ ] Mock data generating
5. [ ] Click targets opens modal
6. [ ] AI predictions working
7. [ ] Share to LoCrypt modal opens
8. [ ] Gateway setup works
9. [ ] Dual-mode toggle works
10. [ ] All buttons functional

---

## Troubleshooting

**If deployment fails on cPanel:**
→ Use Emergent deployment instead (much easier)

**If DNS not working:**
→ Wait 30-60 minutes, clear browser cache, try incognito mode

**If backend not connecting:**
→ Check CORS settings, verify API URL in frontend .env

**If MongoDB errors:**
→ Ensure MongoDB is running, check connection string

---

## Recommendation

**Best Option: Deploy on Emergent**

✅ Handles all infrastructure
✅ MongoDB included
✅ SSL certificate automatic
✅ Process management built-in
✅ Easy custom domain
✅ No server management
✅ 50 credits/month (affordable)

Then just point `darcy.schonegroup.com` to Emergent's IP!
