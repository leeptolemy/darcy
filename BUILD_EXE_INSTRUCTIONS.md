# DARCY Desktop App - Build Instructions for Windows .exe

## Create Standalone Windows Installer

### Prerequisites (Install These First)

1. **Git for Windows**
   - Download: https://git-scm.com/download/win
   - Install with default settings

2. **Node.js 18+ LTS**
   - Download: https://nodejs.org/ (choose LTS version)
   - Verify: `node --version` (should show v18.x or higher)

3. **Python 3.9+**
   - Download: https://www.python.org/downloads/
   - ⚠️ CHECK "Add Python to PATH" during installation!
   - Verify: `python --version`

4. **MongoDB Community Edition**
   - Download: https://www.mongodb.com/try/download/community
   - Install as Windows Service
   - Will auto-start with Windows

---

## Step-by-Step Build Instructions

### Step 1: Save Code to GitHub

**In Emergent Chat:**
1. Look for **"Save to GitHub"** button (usually in chat input area)
2. Click the button
3. **Connect GitHub** if prompted:
   - Authorize Emergent to access your GitHub
   - Select account
4. **Choose repository name**: `darcy-radar-system`
5. **Select branch**: `main` or create new
6. Click **"PUSH TO GITHUB"**
7. Wait for success message
8. Note your GitHub URL: `https://github.com/YOUR_USERNAME/darcy-radar-system`

---

### Step 2: Clone Repository to Your PC

**Open PowerShell or Command Prompt:**

```bash
# Navigate to where you want the code (e.g., Documents)
cd C:\Users\YourName\Documents

# Clone from GitHub
git clone https://github.com/YOUR_USERNAME/darcy-radar-system.git

# Enter the folder
cd darcy-radar-system
```

---

### Step 3: Install Backend Dependencies

```bash
# Navigate to backend folder
cd backend

# Install Python packages
pip install -r requirements.txt

# Should see: "Successfully installed..." for all packages
```

**If you get errors:**
- Make sure Python is in PATH
- Try: `python -m pip install -r requirements.txt`
- Or: `py -m pip install -r requirements.txt`

---

### Step 4: Install Frontend Dependencies

```bash
# Navigate to frontend folder (from backend)
cd ..\frontend

# Install Yarn globally (if not installed)
npm install -g yarn

# Install all dependencies
yarn install

# This will take 3-5 minutes
# Should see: "Done in XXXs"
```

---

### Step 5: Build Production Frontend

```bash
# Still in frontend folder
yarn build

# Wait 2-3 minutes
# Should see: "Compiled successfully!"
# Creates: frontend/build folder
```

---

### Step 6: Build Electron Desktop App

```bash
# Still in frontend folder
yarn electron-build

# This will:
# - Package the app
# - Create Windows installer
# - Takes 5-10 minutes

# Watch for:
# "Building target: nsis"
# "Packaging complete"
```

**Output Location:**
```
frontend/dist/DARCY Setup 1.0.0.exe  (~150-200MB)
```

---

### Step 7: Test the Installer

**On Your PC:**

1. Navigate to `frontend/dist/`
2. Find `DARCY Setup 1.0.0.exe`
3. Double-click to install
4. Installer opens
5. Choose install location (default: `C:\Program Files\DARCY`)
6. Click "Install"
7. Wait 1-2 minutes
8. **DARCY launches automatically!**

---

### Step 8: First Launch Setup

**When DARCY opens:**

1. **Check System Tray** - DARCY icon appears (radar symbol)
2. **Configure Gateway** (if needed):
   - Click "SETUP GATEWAY"
   - Paste LoCrypt token
   - Save
3. **Start Monitoring**:
   - Click "START" button
   - Mock radar begins
   - All widgets populate with data
4. **Verify Features**:
   - Click drone icons → Detailed modal opens
   - Check AI predictions
   - Test Share to LoCrypt
   - Switch Standard ↔ Easy mode

---

## Distribute to Others

### Share the .exe File

**Option 1: Direct File Sharing**
1. Upload `DARCY Setup 1.0.0.exe` to:
   - Google Drive
   - Dropbox
   - OneDrive
   - Company network drive
2. Share link with radar operators
3. They download and install

**Option 2: GitHub Releases**
1. Go to your GitHub repo
2. Releases → Create New Release
3. Upload `DARCY Setup 1.0.0.exe`
4. Publish release
5. Share GitHub release link

**Option 3: Company Intranet**
- Host .exe on company file server
- Employees download from internal network

---

## User Installation Instructions

**For Radar Operators:**

### Prerequisites They Need:

1. **MongoDB** (one-time install)
   - Download: https://www.mongodb.com/try/download/community
   - Install as Windows Service
   - Restart computer

2. **Python 3.9+** (if not bundled)
   - Download: https://www.python.org/downloads/
   - Check "Add to PATH"
   - Install

### Install DARCY:

1. Download `DARCY Setup 1.0.0.exe`
2. Right-click → Run as Administrator (if needed)
3. Follow installation wizard
4. Launch DARCY from Desktop shortcut
5. Configure radar hardware:
   - Settings → Radar Type
   - Select: Serial/TCP/USB
   - Enter connection details
6. Enter LoCrypt gateway token (if sharing alerts)
7. Click START
8. ✅ Monitoring begins!

---

## Advanced: Fully Standalone .exe

**To make it even easier (bundle Python):**

Use PyInstaller to package Python with the app:

```bash
# In backend folder
pip install pyinstaller

# Create standalone Python executable
pyinstaller --onefile --name darcy-backend server.py

# Then update electron.js to use bundled backend
```

**This creates:**
- Single .exe that includes everything
- No Python installation needed
- No pip install needed
- True standalone application

---

## Desktop App Features

**What users get:**

### Launch Behavior:
- Double-click DARCY icon
- Window opens (1400x900)
- Backend auto-starts in background
- Dashboard loads with all 35 widgets
- System tray icon appears

### System Tray:
- **Minimize** → Goes to tray (keeps running)
- **Right-click tray icon** → Menu:
  - Show App
  - Gateway Status
  - Quit
- **Double-click tray** → Restore window

### Background Operation:
- Runs 24/7 in system tray
- Monitors radar continuously
- Alerts sent automatically
- Minimal resource usage (~200MB RAM)

### Features:
- All 35 widgets
- Enhanced radar with topography
- Cluj-Napoca map
- 3D altitude view
- Clickable targets
- AI predictions
- Danger zones
- LoCrypt integration
- Mock data (for testing)
- Real radar connection (Serial/TCP)

---

## Build Configuration

**Already configured in `/app/frontend/package.json`:**

```json
{
  "scripts": {
    "electron-build": "yarn build && electron-builder"
  },
  "build": {
    "appId": "com.schonegroup.darcy",
    "productName": "DARCY Radar Gateway",
    "files": [
      "../electron.js",
      "../preload.js",
      "build/**/*",
      "../backend/**/*"
    ],
    "win": {
      "target": ["nsis"],
      "icon": "public/favicon.ico"
    }
  }
}
```

---

## Troubleshooting Build Issues

**Error: "electron-builder not found"**
```bash
cd frontend
yarn add electron-builder --dev
```

**Error: "Python not found"**
- Reinstall Python
- Check "Add to PATH"
- Restart terminal

**Error: "MongoDB connection failed"**
- Start MongoDB service:
  ```bash
  net start MongoDB
  ```
- Or install MongoDB Compass (GUI)

**Build takes too long:**
- Normal! First build takes 10-15 minutes
- Subsequent builds: 3-5 minutes

---

## File Sizes

**Development:**
- Repository: ~50MB
- node_modules: ~500MB
- Total: ~550MB

**Built .exe:**
- Installer: ~150-200MB
- Installed app: ~300-400MB
- Includes Electron runtime + all dependencies

---

## Auto-Update (Optional)

**For future versions:**

1. Build new .exe with updated version number
2. Distribute to users
3. They install over old version
4. Settings and data preserved

**OR** implement auto-update with Electron's built-in updater

---

## Summary

**Building DARCY Desktop App:**

1. ✅ Click "Save to GitHub" in Emergent
2. ✅ Clone on your Windows PC
3. ✅ Run `pip install -r requirements.txt` in backend
4. ✅ Run `yarn install` in frontend
5. ✅ Run `yarn build` in frontend
6. ✅ Run `yarn electron-build` in frontend
7. ✅ Get `DARCY Setup 1.0.0.exe` in `frontend/dist/`
8. ✅ Install on radar station PC
9. ✅ Configure hardware connection
10. ✅ Start monitoring!

**Perfect for:**
- Radar monitoring stations
- Airport security desks
- Military command centers
- Border patrol units
- Any location with physical radar hardware

**No VPS, no hosting, no monthly costs - just install and run!** 🎖️✨

Ready to proceed? Click "Save to GitHub" and I'll help you through the build process! 🚀
