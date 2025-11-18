# DARCY Drone Detection Radar - Desktop Application (.exe)

## Run DARCY as a Desktop App - No Server Needed!

DARCY can run as a **standalone desktop application** on your computer (.exe for Windows, .dmg for Mac, .deb for Linux).

---

## Quick Start - Run Locally (Development Mode)

### Prerequisites

1. **Node.js** (v16 or higher)
   - Download: https://nodejs.org/
   - Verify: `node --version`

2. **Python** (3.9 or higher)
   - Download: https://www.python.org/downloads/
   - Verify: `python --version`

3. **MongoDB** (Community Edition)
   - Download: https://www.mongodb.com/try/download/community
   - Install and start MongoDB service

4. **Yarn** (Package manager)
   ```bash
   npm install -g yarn
   ```

### Installation Steps

#### Step 1: Get the Code

**Option A: Download from GitHub**
```bash
git clone https://github.com/YOUR_USERNAME/darcy-radar-system.git
cd darcy-radar-system
```

**Option B: Download ZIP**
1. Go to GitHub repository
2. Click "Code" → "Download ZIP"
3. Extract to a folder (e.g., `C:\DARCY` or `~/DARCY`)
4. Open terminal in that folder

#### Step 2: Install Backend Dependencies
```bash
cd backend
pip install -r requirements.txt
```

#### Step 3: Install Frontend Dependencies
```bash
cd ../frontend
yarn install
```

#### Step 4: Configure Environment

**Backend `.env` file** (already exists):
```bash
# backend/.env
MONGO_URL=mongodb://localhost:27017
DB_NAME=darcy_local
CORS_ORIGINS=*
```

**Frontend `.env` file** (update if needed):
```bash
# frontend/.env
REACT_APP_BACKEND_URL=http://localhost:8001
```

#### Step 5: Run Desktop App!

**Open 3 terminals:**

**Terminal 1: Start MongoDB**
```bash
# Windows:
mongod

# Mac/Linux:
sudo systemctl start mongod
# OR
mongod --dbpath ~/data/db
```

**Terminal 2: Start Backend**
```bash
cd backend
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

**Terminal 3: Start Electron Desktop App**
```bash
cd frontend
yarn electron-dev
```

**✅ DARCY Desktop App Opens!**

A window will appear with:
- Full DARCY interface
- System tray icon
- All 35 widgets
- Mock radar running
- Clickable targets
- All features working

---

## Build Standalone .exe (Windows)

### Create Installer for Distribution

#### Step 1: Build Frontend
```bash
cd frontend
yarn build
```

#### Step 2: Build Electron App
```bash
yarn electron-build
```

This creates:
- **Windows**: `frontend/dist/DARCY Setup 1.0.0.exe` (~150MB)
- **Mac**: `frontend/dist/DARCY-1.0.0.dmg`
- **Linux**: `frontend/dist/darcy_1.0.0_amd64.deb` and `DARCY-1.0.0.AppImage`

#### Step 3: Install on Any Computer

**Windows:**
1. Double-click `DARCY Setup 1.0.0.exe`
2. Follow installer wizard
3. App installs to `C:\Program Files\DARCY`
4. Desktop shortcut created
5. Click to launch DARCY!

**Mac:**
1. Open `DARCY-1.0.0.dmg`
2. Drag DARCY to Applications
3. Launch from Applications folder

**Linux:**
```bash
sudo dpkg -i darcy_1.0.0_amd64.deb
# OR
chmod +x DARCY-1.0.0.AppImage
./DARCY-1.0.0.AppImage
```

---

## What Gets Packaged in .exe

**The .exe includes:**
- ✅ React frontend (built)
- ✅ FastAPI backend (Python files)
- ✅ Electron runtime
- ✅ All dependencies
- ✅ Auto-starts backend on app launch
- ✅ System tray integration

**NOT included (user must have):**
- ❌ MongoDB (must be installed separately)
- ❌ Python runtime (can be bundled with PyInstaller if needed)

---

## Option 1: Desktop App (RECOMMENDED for You)

### Why Desktop App is Better:

✅ **No server needed** - Runs on your computer
✅ **Offline capable** - Works without internet (except LoCrypt sharing)
✅ **Portable** - .exe can be copied to USB, run on any PC
✅ **System tray** - Minimizes to tray, runs in background
✅ **Auto-start backend** - Electron launches FastAPI automatically
✅ **Easy install** - Just double-click .exe
✅ **Perfect for radar stations** - Install on radar operator's computer
✅ **No hosting costs** - No VPS, no Emergent credits
✅ **Full control** - Everything runs locally

### Use Cases:
- ✅ Radar operator's desktop computer
- ✅ Mobile radar units (laptop)
- ✅ Air traffic control stations
- ✅ Military command centers
- ✅ Airport security offices
- ✅ Portable deployment (USB stick with .exe)

---

## Option 2: VPS Deployment (If You Need Web Access)

### When to Use VPS:
- Multiple users accessing from different locations
- Web-based access needed
- Team collaboration from different cities
- Integration with other web services
- 24/7 monitoring from anywhere

**Best VPS Providers:**
1. **DigitalOcean** - $6/month droplet
2. **AWS Lightsail** - $5/month
3. **Linode** - $5/month
4. **Namecheap VPS** - $10/month

---

## Hybrid Approach (Best of Both!)

**Recommended Setup:**

1. **Desktop App** at radar station (Cluj-Napoca)
   - Installs DARCY.exe on operator's PC
   - Connects to physical radar hardware
   - Runs 24/7
   - Local MongoDB for data storage

2. **Cloud Backend** for LoCrypt integration
   - Small VPS ($5/month) just for LoCrypt gateway
   - Desktop app sends alerts to cloud
   - Cloud forwards to LoCrypt groups

3. **Benefits:**
   - Radar monitoring works offline
   - LoCrypt alerts work when online
   - No dependency on internet for radar
   - Low cost (just small VPS)

---

## Quick Start Guide for Desktop App

### For Testing (Right Now):

```bash
# 1. Clone/download code
git clone [your-repo]
cd darcy-radar-system

# 2. Install dependencies
cd backend && pip install -r requirements.txt
cd ../frontend && yarn install

# 3. Start MongoDB (separate terminal)
mongod

# 4. Start Desktop App (in frontend folder)
yarn electron-dev
```

**App opens in ~10 seconds!**

### For Production (Build .exe):

```bash
# In frontend folder
yarn build
yarn electron-build

# Find installer in:
# frontend/dist/DARCY Setup 1.0.0.exe
```

**Copy .exe to any Windows PC and install!**

---

## Electron Build Configuration

**Already configured in:**
- `/app/electron.js` - Main process
- `/app/preload.js` - Security bridge
- `/app/frontend/package.json` - Build settings

**Build settings include:**
```json
{
  "build": {
    "appId": "com.yourorg.radar-gateway",
    "productName": "DARCY Radar Gateway",
    "win": {
      "target": ["nsis"],
      "icon": "public/favicon.ico"
    },
    "mac": {
      "target": ["dmg"]
    },
    "linux": {
      "target": ["deb", "AppImage"]
    }
  }
}
```

---

## Desktop App Features

**When running as .exe:**
- Opens in window (1400x900)
- Can resize, minimize, maximize
- **System tray icon** - Right-click for menu
- **Minimize to tray** - App keeps running in background
- **Auto-start backend** - FastAPI launches automatically
- **Quit from tray** - Right-click icon → Quit

**System Tray Menu:**
- Show App
- Gateway Status
- Quit

---

## Comparison: Desktop vs VPS

| Feature | Desktop .exe | VPS Web App |
|---------|-------------|-------------|
| Installation | Double-click .exe | SSH + commands |
| MongoDB | Install locally | Included/managed |
| Internet Required | Only for LoCrypt | Always |
| Cost | FREE (after build) | $5-10/month |
| Updates | Download new .exe | Git pull + restart |
| Access | Local computer only | From anywhere |
| Performance | Excellent (native) | Good (network lag) |
| Security | Fully local | Exposed to internet |
| Radar Connection | Direct USB/Serial | Network forwarding |
| Best For | Single station | Multiple users |

---

## My Recommendation for You

### Use Desktop App (.exe) Because:

1. **Radar Station Setup** - You'll have a physical computer at the radar location
2. **Direct Hardware** - Desktop app can access Serial/TCP ports directly
3. **Offline Operation** - Radar works even if internet is down
4. **No Monthly Costs** - Free after building .exe
5. **Easy Installation** - Just install .exe on operator's PC
6. **System Tray** - Runs in background 24/7
7. **Professional** - Desktop apps are standard for military/radar systems

### Deployment Plan:

**Phase 1: Build Desktop App**
1. Save code to GitHub (use "Save to GitHub" button)
2. Clone on your development PC
3. Run `yarn electron-build`
4. Get `DARCY Setup 1.0.0.exe`

**Phase 2: Deploy to Radar Station**
1. Copy .exe to radar operator's computer (Cluj-Napoca)
2. Install MongoDB on that computer
3. Double-click .exe to install DARCY
4. Configure radar hardware (Serial/TCP connection)
5. Enter LoCrypt gateway token
6. Start monitoring!

**Phase 3: LoCrypt Integration**
1. Get gateway token from LoCrypt
2. In DARCY, click "SETUP GATEWAY"
3. Paste token
4. Alerts automatically share to LoCrypt groups

---

## Build Instructions (Detailed)

### For Windows .exe:

```bash
# Prerequisites:
# - Windows 10/11
# - Node.js installed
# - Python installed

# 1. Clone repository
git clone https://github.com/YOUR_USERNAME/darcy-radar-system.git
cd darcy-radar-system

# 2. Install backend deps
cd backend
pip install -r requirements.txt

# 3. Install frontend deps
cd ../frontend
yarn install

# 4. Build production frontend
yarn build

# 5. Build Electron installer
yarn electron-build

# Output:
# frontend/dist/DARCY Setup 1.0.0.exe (~150-200MB)
```

### Distribute .exe:
1. Upload to Google Drive/Dropbox
2. Share link with radar operators
3. They download and install
4. DARCY runs on their computers!

---

## Troubleshooting Desktop App

**Problem: "MongoDB not found"**
→ Install MongoDB: https://www.mongodb.com/try/download/community

**Problem: "Backend not starting"**
→ Install Python dependencies: `pip install -r requirements.txt`

**Problem: "Port 8001 in use"**
→ Change port in electron.js or kill process using port

**Problem: "Cannot connect to radar"**
→ Check Serial/TCP configuration in Settings

---

## Summary

**Yes, you can run DARCY as .exe!**

✅ Already configured for Electron
✅ Build with `yarn electron-build`
✅ Get Windows .exe installer
✅ Install on any PC
✅ Perfect for radar stations
✅ No VPS needed
✅ No hosting costs
✅ Works offline

**Next Steps:**
1. Decide: Desktop .exe OR VPS?
2. If Desktop: Use "Save to GitHub" → Clone → Build
3. If VPS: Use Emergent deployment (easiest) or DigitalOcean

For radar monitoring at a physical location, **Desktop .exe is the way to go!** 🎖️
