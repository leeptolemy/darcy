# Drone Detection Radar Desktop Application

## Overview

A desktop application that integrates drone detection radar systems with the LoCrypt secure communication platform. The app reads radar data from drone detection hardware and publishes it anonymously to designated group chats.

## Features

### Core Capabilities
- ✅ **Multi-Protocol Radar Support**: Serial (RS-232/485), TCP/IP, USB, and file-based inputs
- ✅ **NMEA Protocol Parser**: Native support for NMEA format with extensible parser for custom protocols
- ✅ **Real-time Monitoring**: 24/7 continuous radar data monitoring with auto-reconnect
- ✅ **LoCrypt Integration**: Secure publishing to LoCrypt gateway with encrypted tokens
- ✅ **Multiple Publishing Modes**: On-detection, periodic, change-based, and manual trigger options
- ✅ **Desktop UI**: Professional dashboard with real-time status, statistics, and controls
- ✅ **System Tray Integration**: Minimizes to tray for background operation
- ✅ **Configuration Management**: Encrypted storage of sensitive credentials
- ✅ **Activity Logging**: Complete audit trail of all published data

### Security Features
- Encrypted gateway token storage
- Anonymous station ID option
- No personal data transmission
- HTTPS/TLS communication only
- Local credential encryption

## Technology Stack

- **Frontend**: React 19 + TailwindCSS + Radix UI
- **Backend**: FastAPI (Python 3.11+)
- **Desktop Framework**: Electron
- **Database**: MongoDB (for logs and state)
- **Hardware Integration**: pyserial, socket (TCP/IP)
- **Data Parsing**: pynmea2 (NMEA), custom parsers

## Installation

### Prerequisites
- Node.js 16+ and Yarn
- Python 3.11+
- MongoDB (running locally or remote)

### Development Setup

1. **Clone and Setup**
```bash
# Install backend dependencies
cd backend
pip install -r requirements.txt

# Install frontend dependencies
cd ../frontend
yarn install

# Install Electron dependencies
cd ..
yarn install
```

2. **Configure Environment**

Create `backend/.env`:
```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=radar_gateway
CORS_ORIGINS=*
```

Create `frontend/.env`:
```env
REACT_APP_BACKEND_URL=http://localhost:8001
```

3. **Run Development Mode**

```bash
# Terminal 1: Start MongoDB
mongod

# Terminal 2: Start Backend
cd backend
uvicorn server:app --host 0.0.0.0 --port 8001 --reload

# Terminal 3: Start Frontend + Electron
cd frontend
yarn electron-dev
```

### Production Build

```bash
cd frontend
yarn electron-build
```

This creates installers in `frontend/dist/`:
- Windows: `.exe` installer
- Linux: `.deb` and `.AppImage`
- macOS: `.dmg`

## Configuration

### First-Time Setup

1. Launch the application
2. Navigate to "Configuration" tab
3. Configure LoCrypt settings:
   - Backend URL (e.g., `https://api.locrypt.mil`)
   - Gateway Token (provided by LoCrypt admin)
4. Configure Radar settings:
   - Select radar type (Mock/Serial/TCP/File)
   - Enter connection parameters
5. Set Publishing mode and preferences
6. Click "Save Configuration"
7. Test connections using "Test Radar" and "Test LoCrypt" buttons

### Radar Types

#### Mock Radar (Testing)
- Simulates realistic drone detection events
- Generates random NMEA-like data
- Perfect for testing and demos
- No hardware required

#### Serial Port (RS-232/485)
```yaml
radar:
  type: serial
  connection:
    port: "/dev/ttyUSB0"  # Linux: /dev/ttyUSB0, Windows: COM3
    baudrate: 9600
    timeout: 5
```

#### TCP/IP Socket
```yaml
radar:
  type: tcp
  connection:
    host: "192.168.1.100"
    port: 5000
    timeout: 5
```

#### File Input (Testing)
```yaml
radar:
  type: file
  connection:
    path: "/path/to/radar_data.txt"
```

### Publishing Modes

- **On Detection**: Publishes immediately when drone detected (recommended)
- **Periodic**: Publishes at fixed intervals (e.g., every 30 seconds)
- **Change-Based**: Publishes only when detection count changes
- **Manual**: No automatic publishing (use "Manual Publish" button)

## Data Format

### NMEA Protocol Support

The application natively parses NMEA sentences:

```
$GPGGA,123519,045.00,N,3.2,E,1,08,150,85.0,M,46.9,M,,*47
```

### JSON Format

```json
{
  "detections": 2,
  "range": "3.2km",
  "bearing": "045°",
  "altitude": "150m",
  "speed": "85kts",
  "confidence": "HIGH",
  "signalStrength": 85
}
```

### Custom Format

```
DET:2 RNG:3.5km BRG:045 ALT:150m SPD:85kts
```

### Published Data Structure

Data published to LoCrypt:

```json
{
  "radarId": "RADAR-ALPHA-01",
  "stationName": "North Sector Radar",
  "detections": 2,
  "range": "3.2km",
  "bearing": "045°",
  "altitude": "150m",
  "speed": "85kts",
  "timestamp": "2025-06-15T14:30:00Z",
  "signalStrength": 85,
  "confidence": "HIGH",
  "source": "serial"
}
```

## API Endpoints

### Gateway Control

- `GET /api/gateway/status` - Get current status
- `POST /api/gateway/start` - Start monitoring
- `POST /api/gateway/stop` - Stop monitoring
- `POST /api/gateway/publish-manual` - Manual publish

### Configuration

- `GET /api/gateway/config` - Get configuration
- `POST /api/gateway/config` - Update configuration

### Testing

- `POST /api/gateway/test-radar` - Test radar connection
- `POST /api/gateway/test-locrypt` - Test LoCrypt connection

### Logs

- `GET /api/gateway/logs?limit=100` - Get activity logs

### LoCrypt Integration

- `POST /api/gateway/publish-data` - Publish sensor data (LoCrypt endpoint)
- `GET /api/gateway/health` - Health check

## Usage

### Starting Monitoring

1. Ensure configuration is complete
2. Click "Start Monitoring" button
3. Gateway status turns green when active
4. Radar data appears in real-time

### Manual Publishing

1. Start monitoring
2. Wait for detection data
3. Click "Manual Publish" to send last detection to LoCrypt

### System Tray

- App minimizes to system tray
- Double-click tray icon to restore
- Right-click for quick menu
- "Quit" to exit completely

## Troubleshooting

### Radar Not Connecting

**Serial Port:**
- Check port name (Linux: `ls /dev/tty*`, Windows: Device Manager)
- Verify permissions: `sudo chmod 666 /dev/ttyUSB0`
- Confirm baud rate matches radar hardware

**TCP/IP:**
- Verify IP address and port
- Check firewall rules
- Ping radar host: `ping 192.168.1.100`

### LoCrypt Connection Failed

- Verify backend URL is correct
- Check gateway token (should be provided by admin)
- Ensure network allows HTTPS outbound
- Test with: "Test LoCrypt" button

### No Data Received

- Check radar is powered on
- Verify cable connections
- Use mock radar for testing
- Check logs for parsing errors

### Backend Not Starting

```bash
# Check backend logs
tail -f /var/log/supervisor/backend.err.log

# Restart backend
sudo supervisorctl restart backend

# Check if port is in use
lsof -i :8001
```

## Development

### Adding Custom Radar Parser

Edit `backend/data_processor.py`:

```python
def _parse_custom(self, data: str) -> Optional[Dict[str, Any]]:
    # Add your custom parsing logic
    result = {}
    # Extract fields from your radar format
    return result
```

### Testing

```bash
# Backend tests
pytest backend/tests/

# Frontend tests
cd frontend
yarn test
```

## Security Considerations

1. **Gateway Token**: Never commit tokens to version control
2. **Encryption**: Tokens are encrypted on disk using Fernet symmetric encryption
3. **Anonymization**: Enable station ID anonymization in production
4. **Network**: Use HTTPS only for LoCrypt communication
5. **Access**: Restrict physical access to radar systems

## Architecture

```
┌─────────────────────────────────────────┐
│         Electron Main Process           │
│  - App lifecycle management             │
│  - Spawn FastAPI backend subprocess     │
│  - System tray integration              │
└────────┬────────────────────────────────┘
         │
         ├──────────────────────────────────┐
         │                                  │
         ▼                                  ▼
┌─────────────────┐              ┌──────────────────┐
│  React Frontend │◄────HTTP────►│  FastAPI Backend │
│  (Renderer)     │              │  (localhost:8001)│
│  - Dashboard UI │              │  - Radar connector│
│  - Config Panel │              │  - LoCrypt client│
│  - Log Viewer   │              │  - Data processor│
└─────────────────┘              └────────┬─────────┘
                                          │
                                          ▼
                                 ┌────────────────┐
                                 │  Radar Hardware│
                                 │  Serial/TCP/USB│
                                 └────────────────┘
                                          │
                                          ▼
                                 ┌────────────────┐
                                 │  LoCrypt API   │
                                 │  (HTTPS)       │
                                 └────────────────┘
```

## Support

For issues or questions:
- Check troubleshooting section
- Review logs in Activity Logs tab
- Test connections using built-in test buttons

## License

Proprietary - For authorized use only

## Version

1.0.0 - Initial Release
