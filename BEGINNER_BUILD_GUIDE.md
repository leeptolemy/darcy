# DARCY Desktop App - Complete Beginner's Build Guide

## Step-by-Step Instructions (With Pictures in Mind)

---

## PART 1: Install Required Software (One-Time Setup)

### Step 1.1: Install Git for Windows

**What is Git?** A tool to download code from GitHub.

1. Go to: https://git-scm.com/download/win
2. Click **"Click here to download"** (big button)
3. Run the downloaded file: `Git-2.43.0-64-bit.exe`
4. Click **"Next"** through all screens (use defaults)
5. Click **"Install"**
6. Click **"Finish"**

**Test it worked:**
- Press `Windows Key + R`
- Type: `cmd`
- Press Enter
- Type: `git --version`
- You should see: `git version 2.43.0` (or similar)

---

### Step 1.2: Install Node.js

**What is Node.js?** JavaScript runtime needed to build the frontend.

1. Go to: https://nodejs.org/
2. Click **"Download Node.js (LTS)"** - the green button on left
3. Run downloaded file: `node-v18.19.0-x64.msi`
4. Click **"Next"** through all screens
5. Accept license agreement
6. Click **"Install"**
7. Wait 2-3 minutes
8. Click **"Finish"**

**Test it worked:**
- Open Command Prompt (Windows Key + R, type `cmd`)
- Type: `node --version`
- You should see: `v18.19.0` (or similar)
- Type: `npm --version`
- You should see: `10.2.3` (or similar)

---

### Step 1.3: Install Python

**What is Python?** Programming language for the backend.

1. Go to: https://www.python.org/downloads/
2. Click **"Download Python 3.11.7"** (yellow button)
3. Run downloaded file: `python-3.11.7-amd64.exe`
4. **⚠️ IMPORTANT:** Check the box **"Add Python to PATH"** at bottom!
5. Click **"Install Now"**
6. Wait 2-3 minutes
7. Click **"Close"**

**Test it worked:**
- Open NEW Command Prompt (close old one first!)
- Type: `python --version`
- You should see: `Python 3.11.7`
- Type: `pip --version`
- You should see: `pip 23.3.1` (or similar)

**If python command doesn't work:**
- Try: `py --version`
- Use `py` instead of `python` in all commands below

---

### Step 1.4: Install MongoDB

**What is MongoDB?** Database to store radar detections and alerts.

1. Go to: https://www.mongodb.com/try/download/community
2. Select:
   - Version: 7.0.4 (or latest)
   - Platform: Windows
   - Package: MSI
3. Click **"Download"**
4. Run: `mongodb-windows-x86_64-7.0.4-signed.msi`
5. Click **"Next"**
6. Accept license
7. Choose **"Complete"** installation
8. **Install MongoDB as a Service:** ✓ Keep this checked!
9. **Install MongoDB Compass:** ✓ Keep this checked (nice GUI tool)
10. Click **"Install"**
11. Wait 5 minutes
12. Click **"Finish"**

**MongoDB is now running automatically!**

---

### Step 1.5: Install Yarn

**What is Yarn?** Package manager for JavaScript (better than npm).

1. Open Command Prompt (Windows Key + R, type `cmd`)
2. Type this command and press Enter:
   ```
   npm install -g yarn
   ```
3. Wait 1-2 minutes (you'll see download progress)
4. When done, type: `yarn --version`
5. You should see: `1.22.22` (or similar)

---

## PART 2: Get DARCY Code from GitHub

### Step 2.1: Save to GitHub (In Emergent)

**In Emergent Chat Interface:**

1. Look at the **text input box** at bottom of chat
2. Look for buttons near it (might be icons or menu)
3. Find **"Save to GitHub"** button (might say "GitHub" or have GitHub icon)
4. Click it
5. **If asked to connect GitHub:**
   - Click "Connect GitHub"
   - Log into your GitHub account
   - Authorize Emergent
6. **Repository name:** Type `darcy-radar-system`
7. **Branch:** Leave as `main`
8. Click **"PUSH TO GITHUB"** or **"Save"**
9. Wait for success message (30 seconds)
10. **Copy your repository URL** (it will show you):
    - Should be: `https://github.com/YOUR_USERNAME/darcy-radar-system`

---

### Step 2.2: Create a Folder for DARCY

1. Open **File Explorer** (Windows Key + E)
2. Go to your **Documents** folder
3. Right-click in empty space
4. **New** → **Folder**
5. Name it: `DARCY`
6. Press Enter

---

### Step 2.3: Clone Repository

**Open Command Prompt in your DARCY folder:**

**Method 1 (Easy):**
1. Open File Explorer
2. Navigate to `Documents\DARCY` folder
3. Click in the **address bar** at top (shows the path)
4. Type: `cmd`
5. Press Enter
6. Command Prompt opens **already in DARCY folder**!

**Method 2 (Manual):**
1. Press Windows Key + R
2. Type: `cmd`
3. Press Enter
4. Type: `cd Documents\DARCY`
5. Press Enter

**Now clone the code:**

1. Type this command (replace YOUR_USERNAME with your GitHub username):
   ```
   git clone https://github.com/YOUR_USERNAME/darcy-radar-system.git
   ```
2. Press Enter
3. You'll see:
   ```
   Cloning into 'darcy-radar-system'...
   Receiving objects: 100% (XXX/XXX), done.
   ```
4. Wait 30-60 seconds
5. Done! Code is downloaded!

**Verify:**
- Open File Explorer
- Go to `Documents\DARCY`
- You should see folder: `darcy-radar-system`
- Inside it: `backend`, `frontend`, `electron.js`, etc.

---

## PART 3: Install Dependencies (Detailed)

### Step 3.1: Install Backend Dependencies

**Open Command Prompt in backend folder:**

1. In File Explorer, go to: `Documents\DARCY\darcy-radar-system`
2. Double-click `backend` folder
3. Click address bar, type `cmd`, press Enter

**OR in existing Command Prompt:**
```
cd darcy-radar-system\backend
```

**Now install Python packages:**

1. Type this command:
   ```
   pip install -r requirements.txt
   ```
   
2. Press Enter

3. You'll see **LOTS of text scrolling** - this is normal! It's downloading Python packages.

4. Wait 2-5 minutes (depends on internet speed)

5. You'll see lines like:
   ```
   Collecting fastapi==0.110.1
   Downloading fastapi-0.110.1-py3-none-any.whl
   ...
   Successfully installed fastapi-0.110.1 uvicorn-0.25.0 ...
   ```

6. When it finishes, you'll see your folder path again:
   ```
   C:\Users\YourName\Documents\DARCY\darcy-radar-system\backend>
   ```

**✅ Backend dependencies installed!**

**If you get errors:**
- Try: `python -m pip install -r requirements.txt`
- Or: `py -m pip install -r requirements.txt`
- Make sure Python is in PATH (reinstall Python, check "Add to PATH")

---

### Step 3.2: Install Frontend Dependencies

**Navigate to frontend folder:**

**In same Command Prompt, type:**
```
cd ..\frontend
```
Press Enter

**Your path should now show:**
```
C:\Users\YourName\Documents\DARCY\darcy-radar-system\frontend>
```

**Now install JavaScript packages:**

1. Type:
   ```
   yarn install
   ```

2. Press Enter

3. You'll see:
   ```
   yarn install v1.22.22
   [1/4] Resolving packages...
   [2/4] Fetching packages...
   [3/4] Linking dependencies...
   [4/4] Building fresh packages...
   ```

4. Wait 5-10 minutes (downloading ~500MB of packages)

5. You'll see progress like:
   ```
   Downloading packages [████████░░] 80%
   ```

6. When done:
   ```
   success Saved lockfile.
   Done in 320.45s.
   ```

**✅ Frontend dependencies installed!**

**What just happened?**
- Yarn downloaded all JavaScript libraries needed
- Created `node_modules` folder (~500MB)
- Contains React, Electron, and all UI components

---

## PART 4: Build the Desktop App (Detailed)

### Step 4.1: Build Frontend (Production Version)

**You should still be in frontend folder**

**Check your path shows:**
```
...\frontend>
```

**Now build:**

1. Type:
   ```
   yarn build
   ```

2. Press Enter

3. You'll see:
   ```
   Creating an optimized production build...
   Compiling...
   ```

4. Wait 2-3 minutes

5. Progress will show:
   ```
   Compiled successfully!
   
   File sizes after gzip:
   
   123.45 KB  build/static/js/main.abc123.js
   12.34 KB   build/static/css/main.def456.css
   ```

6. When done, a new folder `build` is created in frontend

**✅ Production frontend built!**

**What just happened?**
- React app was compiled
- All code optimized and minified
- Ready for desktop app packaging

---

### Step 4.2: Build Electron Desktop App

**Still in frontend folder**

**Now create the .exe installer:**

1. Type:
   ```
   yarn electron-build
   ```

2. Press Enter

3. You'll see:
   ```
   electron-builder  version=26.0.12
   Platform: Windows (win32)
   Target: nsis (NSIS installer)
   ```

4. **This takes 10-15 minutes** - be patient!

5. Progress you'll see:
   ```
   • packaging       platform=win32 arch=x64 electron=39.0.0
   • building        target=nsis file=DARCY-Setup-1.0.0.exe
   • building block map  blockMapFile=DARCY-Setup-1.0.0.exe.blockmap
   ```

6. **When successful:**
   ```
   • DONE  build completed successfully
   ```

7. **Your .exe is ready!**

---

### Step 4.3: Find Your Installer

**Open File Explorer:**

1. Navigate to: `Documents\DARCY\darcy-radar-system\frontend`
2. Look for folder called: `dist`
3. Double-click `dist` folder
4. **You'll see:**
   - `DARCY Setup 1.0.0.exe` (~150-200MB) ← **This is it!**
   - `DARCY Setup 1.0.0.exe.blockmap`
   - Maybe: `win-unpacked` folder (don't need this)

**✅ Desktop app built successfully!**

---

## PART 5: Install and Test DARCY

### Step 5.1: Install DARCY on Your PC

1. In File Explorer, find: `DARCY Setup 1.0.0.exe`
2. **Right-click** on it
3. Choose **"Run as administrator"**
4. Windows might show warning: **"Unknown publisher"**
   - Click **"More info"**
   - Click **"Run anyway"**
5. **DARCY Installer opens:**
   - Shows: "Installing DARCY Radar Gateway"
   - Progress bar appears
6. Wait 1-2 minutes
7. **Installation Complete!**
8. Desktop shortcut created: **DARCY**
9. Start Menu entry created

---

### Step 5.2: First Launch

**Make sure MongoDB is running:**
1. Press Windows Key
2. Search: "Services"
3. Open **Services** app
4. Find **"MongoDB Server"**
5. Check Status: Should say **"Running"**
6. If not: Right-click → **"Start"**

**Now launch DARCY:**

1. **Double-click DARCY icon** on desktop
   
   **OR**
   
   - Press Windows Key
   - Type: "DARCY"
   - Click the app

2. **Wait 10-15 seconds** (first launch is slower)

3. You might see:
   - Black window briefly (backend starting)
   - Then DARCY window appears!

4. **DARCY Opens!** You'll see:
   - Header with DARCY logo
   - "SETUP GATEWAY" button
   - All widgets (might show "No data" initially)
   - Left sidebar with icons

5. **System tray icon** appears (bottom-right of Windows taskbar)

**✅ DARCY is running!**

---

### Step 5.3: Start Monitoring (Test with Mock Data)

**In DARCY window:**

1. Look at header
2. See **"MOCK DATA"** toggle - should show **"ON"** (green)
3. Find **"START"** button (bottom section or mission control)
4. **Click START**
5. Wait 3-5 seconds
6. **Status changes to "ACTIVE"** (green)
7. **Radar starts rotating** (cyan sweep beam)
8. **After 10-20 seconds** - drones start appearing!
9. **All widgets populate with data**

**What you should see:**
- Radar sweep rotating (center)
- Drone icons appearing (pink/red circles with triangles)
- Event log scrolling with [DETECT] messages
- Numbers updating (detection count, uptime, etc.)
- Signal waveform animating (left side)
- Frequency bars dancing (left side)
- Target list showing drone IDs

---

## PART 6: Understanding the Commands (What Each Does)

### Command Breakdown

**`cd backend`**
- **cd** = Change Directory
- Moves you into the "backend" folder
- Like double-clicking a folder in File Explorer

**`pip install -r requirements.txt`**
- **pip** = Python package installer
- **install** = Download and install
- **-r requirements.txt** = Read list of packages from this file
- Downloads: FastAPI, MongoDB driver, pyserial, etc.
- Takes 2-5 minutes

**`cd ../frontend`**
- **..** = Go up one folder (to darcy-radar-system)
- **/frontend** = Then go into frontend folder
- Result: Now in frontend folder

**`yarn install`**
- **yarn** = JavaScript package manager (like pip for Python)
- **install** = Download all packages listed in package.json
- Downloads: React, Electron, Axios, Lucide icons, etc.
- Creates node_modules folder (~500MB)
- Takes 5-10 minutes

**`yarn build`**
- **yarn** = Run yarn command
- **build** = Compile React app for production
- What it does:
  - Compiles all .js files
  - Minifies code (makes it smaller)
  - Optimizes images
  - Creates "build" folder
- Takes 2-3 minutes
- Output: Optimized static files ready for desktop app

**`yarn electron-build`**
- **yarn** = Run yarn command
- **electron-build** = Package app with Electron
- What it does:
  - Takes the "build" folder
  - Packages with Electron runtime
  - Adds backend Python code
  - Creates Windows installer (.exe)
  - Signs the package (optional)
- Takes 10-15 minutes
- Output: `DARCY Setup 1.0.0.exe` in dist folder

---

## PART 7: Troubleshooting Common Issues

### Issue 1: "pip is not recognized"

**Problem:** Python not in PATH

**Solution:**
1. Uninstall Python
2. Reinstall from https://www.python.org/downloads/
3. **Check "Add Python to PATH"** during install!
4. Restart Command Prompt
5. Try again

---

### Issue 2: "yarn is not recognized"

**Problem:** Yarn not installed globally

**Solution:**
```
npm install -g yarn
```
Wait 1 minute, then try again.

---

### Issue 3: "MongoDB connection failed"

**Problem:** MongoDB not running

**Solution:**
1. Press Windows Key
2. Search: "Services"
3. Find "MongoDB Server"
4. Right-click → **"Start"**
5. Right-click → **"Properties"** → Set **Startup type: Automatic**

---

### Issue 4: Build fails with "Out of memory"

**Problem:** Not enough RAM

**Solution:**
1. Close other programs
2. Try: `yarn build --max-old-space-size=4096`
3. Or restart computer and try again

---

### Issue 5: ".exe won't run - Windows Defender blocks it"

**Problem:** Windows doesn't recognize publisher

**Solution:**
1. When warning appears
2. Click **"More info"**
3. Click **"Run anyway"**
4. DARCY will install

**To avoid in future:**
- Sign the .exe with code signing certificate ($200/year)
- Or users just click "Run anyway" each time

---

## PART 8: Alternative - Easier Method

### If Building is Too Complex:

**Option A: I Build It For You**
- After you save to GitHub
- I can provide build server instructions
- Or provide pre-built .exe (if possible)

**Option B: Use Web Version**
- Deploy on Emergent
- Access via browser
- No .exe needed
- Costs 50 credits/month

**Option C: Docker Container**
- Single container with everything
- One command to run
- No dependency installation

---

## PART 9: Quick Reference Card

### Complete Build Process (Cheat Sheet)

**Prerequisites (Install Once):**
```
1. Git for Windows
2. Node.js 18+
3. Python 3.9+
4. MongoDB Community
5. Yarn (npm install -g yarn)
```

**Build Commands (Every Time You Update):**
```bash
# Get code
git clone https://github.com/YOUR_USERNAME/darcy-radar-system.git
cd darcy-radar-system

# Install backend
cd backend
pip install -r requirements.txt

# Install frontend
cd ../frontend
yarn install

# Build production
yarn build

# Create .exe
yarn electron-build

# Find installer
# Location: frontend/dist/DARCY Setup 1.0.0.exe
```

**Run Time:** 25-30 minutes total

---

## PART 10: Video Tutorial Equivalent (Text Steps)

**Imagine watching over my shoulder:**

**SCENE 1: Prerequisites (10 minutes)**
- Download Git, Node, Python, MongoDB
- Install each (click Next, Next, Finish)
- Check "Add to PATH" for Python
- Open cmd, type commands to verify

**SCENE 2: Get Code (2 minutes)**
- Click "Save to GitHub" in Emergent
- Copy repository URL
- Open cmd in Documents\DARCY
- Type: git clone [URL]
- Wait for download

**SCENE 3: Install Dependencies (15 minutes)**
- cd into backend folder
- Type: pip install -r requirements.txt
- Watch packages download
- cd into frontend folder
- Type: yarn install
- Watch 500MB download
- Take a coffee break ☕

**SCENE 4: Build App (15 minutes)**
- In frontend folder
- Type: yarn build
- Watch compilation (3 min)
- Type: yarn electron-build
- Watch packaging (10 min)
- Check dist folder
- See DARCY Setup 1.0.0.exe
- Victory! 🎉

**SCENE 5: Install & Test (5 minutes)**
- Run the .exe
- Click through installer
- DARCY launches
- Click START
- See drones appearing
- Click a drone
- Modal opens with 3D drone
- Test all features
- Success! ✅

---

## Need Help?

**If you get stuck:**
1. Take screenshot of error message
2. Share in Emergent chat
3. I'll help troubleshoot

**Common stuck points:**
- Python not in PATH → Reinstall Python, check box
- Yarn not found → Run `npm install -g yarn`
- MongoDB not running → Start in Services
- Build fails → Close programs, restart, try again

---

## Final Checklist

**Before building, verify:**
- [ ] Git installed (`git --version` works)
- [ ] Node.js installed (`node --version` works)
- [ ] Python installed (`python --version` works)
- [ ] MongoDB installed and running
- [ ] Yarn installed (`yarn --version` works)
- [ ] Code saved to GitHub
- [ ] Code cloned to your PC
- [ ] You're in the right folder (check path)

**Build process:**
- [ ] Backend dependencies installed (pip install)
- [ ] Frontend dependencies installed (yarn install)
- [ ] Production build created (yarn build)
- [ ] Electron build completed (yarn electron-build)
- [ ] .exe file found in dist folder

**Testing:**
- [ ] .exe installs without errors
- [ ] DARCY launches
- [ ] MongoDB connection works
- [ ] Mock data starts
- [ ] All widgets show data
- [ ] Click target opens modal
- [ ] AI predictions appear

---

## You're Ready!

**Next action:** Click "Save to GitHub" button in Emergent chat!

Then follow this guide step by step. Take your time, and don't worry if it takes a few tries. Building desktop apps for the first time always has a learning curve, but you'll get it! 💪

**Estimated total time for first build:** 1-2 hours (including downloads)

**Once you've done it once:** 10 minutes for future builds

Good luck! 🚀
