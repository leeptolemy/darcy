# Testing Guide - Drone Detection Radar Gateway

## Quick Start Test (5 minutes)

### 1. Verify Services Running

```bash
# Check backend is running
curl http://localhost:8001/api/

# Expected: {"message":"Drone Detection Radar Gateway API","version":"1.0.0"}
```

### 2. Test Mock Radar

```bash
# Start the gateway with mock radar (default config)
curl -X POST http://localhost:8001/api/gateway/start

# Check status (wait 10-30 seconds for mock detection)
curl http://localhost:8001/api/gateway/status | python -m json.tool

# You should see:
# - is_running: true
# - radar_status: "monitoring"
# - Eventually detections_total > 0
```

### 3. Test Configuration

```bash
# Get current config
curl http://localhost:8001/api/gateway/config | python -m json.tool

# Update config (example)
curl -X POST http://localhost:8001/api/gateway/config \
  -H "Content-Type: application/json" \
  -d '{
    "config": {
      "radar": {
        "type": "mock",
        "connection": {}
      },
      "publishing": {
        "mode": "on_detection",
        "interval": 30
      }
    }
  }'
```

### 4. Test Manual Publish

```bash
# Wait for at least one detection, then manually publish
curl -X POST http://localhost:8001/api/gateway/publish-manual
```

### 5. View Logs

```bash
# Get activity logs
curl http://localhost:8001/api/gateway/logs?limit=10 | python -m json.tool
```

## Testing Different Radar Types

### Mock Radar (Default)

Already configured in `config.yaml`. Generates random detection events every 3-8 seconds.

```bash
# No additional setup needed
curl -X POST http://localhost:8001/api/gateway/start
```

### File-Based Radar

Test with provided sample data:

```bash
# Update config to use file input
curl -X POST http://localhost:8001/api/gateway/config \
  -H "Content-Type: application/json" \
  -d '{
    "config": {
      "radar": {
        "type": "file",
        "connection": {
          "path": "/app/backend/radar_test_data.txt"
        }
      }
    }
  }'

# Stop and restart gateway to apply changes
curl -X POST http://localhost:8001/api/gateway/stop
curl -X POST http://localhost:8001/api/gateway/start

# Check status - should see detections from file
curl http://localhost:8001/api/gateway/status | python -m json.tool
```

### Serial Port Radar

**Prerequisites:**
- Serial device connected (e.g., `/dev/ttyUSB0`)
- Proper permissions: `sudo chmod 666 /dev/ttyUSB0`

```bash
# List available serial ports
ls /dev/tty* | grep -E "(USB|ACM)"

# Update config
curl -X POST http://localhost:8001/api/gateway/config \
  -H "Content-Type: application/json" \
  -d '{
    "config": {
      "radar": {
        "type": "serial",
        "connection": {
          "port": "/dev/ttyUSB0",
          "baudrate": 9600,
          "timeout": 5
        }
      }
    }
  }'

# Test connection without starting monitoring
curl -X POST http://localhost:8001/api/gateway/test-radar
```

### TCP/IP Radar

**Prerequisites:**
- TCP radar server running on network
- Firewall allows connection

```bash
# Test TCP connection
nc -zv 192.168.1.100 5000

# Update config
curl -X POST http://localhost:8001/api/gateway/config \
  -H "Content-Type: application/json" \
  -d '{
    "config": {
      "radar": {
        "type": "tcp",
        "connection": {
          "host": "192.168.1.100",
          "port": 5000,
          "timeout": 5
        }
      }
    }
  }'

# Test connection
curl -X POST http://localhost:8001/api/gateway/test-radar
```

## Testing LoCrypt Integration

### Mock LoCrypt Server

Since you don't have actual LoCrypt credentials yet, the app includes a mock endpoint:

```bash
# The app publishes to its own /api/gateway/publish-data endpoint
# This simulates the LoCrypt API

# Update config with mock credentials
curl -X POST http://localhost:8001/api/gateway/config \
  -H "Content-Type: application/json" \
  -d '{
    "config": {
      "locrypt": {
        "backend_url": "http://localhost:8001",
        "gateway_token": "test-token-12345"
      }
    }
  }'

# Test LoCrypt connection
curl -X POST http://localhost:8001/api/gateway/test-locrypt

# Start monitoring - data will be published to mock endpoint
curl -X POST http://localhost:8001/api/gateway/start

# Check logs to see published data
curl http://localhost:8001/api/gateway/logs?limit=5 | python -m json.tool
```

### Real LoCrypt Server

When you have actual credentials:

```bash
curl -X POST http://localhost:8001/api/gateway/config \
  -H "Content-Type: application/json" \
  -d '{
    "config": {
      "locrypt": {
        "backend_url": "https://api.locrypt.yourorg.com",
        "gateway_token": "your-actual-token-here"
      }
    }
  }'
```

## Testing Publishing Modes

### On Detection (Immediate)

```bash
curl -X POST http://localhost:8001/api/gateway/config \
  -H "Content-Type: application/json" \
  -d '{
    "config": {
      "publishing": {
        "mode": "on_detection"
      }
    }
  }'
```

### Periodic (Every 30 seconds)

```bash
curl -X POST http://localhost:8001/api/gateway/config \
  -H "Content-Type: application/json" \
  -d '{
    "config": {
      "publishing": {
        "mode": "periodic",
        "interval": 30
      }
    }
  }'
```

### Manual Only

```bash
curl -X POST http://localhost:8001/api/gateway/config \
  -H "Content-Type: application/json" \
  -d '{
    "config": {
      "publishing": {
        "mode": "manual"
      }
    }
  }'

# Use manual publish button to send data
curl -X POST http://localhost:8001/api/gateway/publish-manual
```

## Testing Data Parsing

### Test NMEA Format

Create a test file `test_nmea.txt`:

```
$GPGGA,123519,045.00,N,3.2,E,1,08,150,85.0,M,46.9,M,,*47
```

Configure file radar and verify parsing.

### Test JSON Format

Create a test file `test_json.txt`:

```json
{"detections": 3, "range": "5.2km", "bearing": "120°", "altitude": "250m", "speed": "95kts"}
```

### Test Custom Format

Create a test file `test_custom.txt`:

```
DET:2 RNG:3.5km BRG:045 ALT:150m SPD:85kts
```

## Frontend Testing (UI)

### Access the Web Interface

1. Open browser: https://radar-alert-system.preview.emergentagent.com
2. You should see the dashboard with:
   - Gateway Status indicator
   - Radar Status
   - LoCrypt connection status
   - Statistics (detections, published, errors)
   - Control buttons

### Test Navigation

- Click "Dashboard" - Should show main dashboard
- Click "Configuration" - Should show config panel
- Click "Logs" - Should show activity logs

### Test Controls

1. **Start Monitoring**
   - Click "Start Monitoring"
   - Status should turn green
   - Statistics should start updating

2. **Stop Monitoring**
   - Click "Stop Monitoring"
   - Status should turn red
   - Monitoring stops

3. **Manual Publish**
   - Start monitoring and wait for detection
   - Click "Manual Publish"
   - Should see success notification

4. **Test Connections**
   - Click "Test Radar" - Should show connection result
   - Click "Test LoCrypt" - Should show connection result

### Test Configuration Panel

1. Navigate to Configuration
2. Update LoCrypt settings
3. Change radar type
4. Modify publishing mode
5. Click "Save Configuration"
6. Verify settings persist after refresh

## Electron Desktop Testing

### Run in Development Mode

```bash
cd frontend
yarn electron-dev
```

This should:
1. Start backend automatically
2. Launch desktop window
3. Show system tray icon

### Test Desktop Features

1. **System Tray**
   - Minimize window - Should go to tray
   - Double-click tray icon - Should restore window
   - Right-click tray - Should show menu

2. **Notifications**
   - Start/stop gateway - Should show desktop notification
   - Test connections - Should show result notification

3. **Window State**
   - Resize window - Should persist size
   - Close and reopen - Should remember position

## Performance Testing

### Load Test

```python
# Create a Python script to simulate continuous data
import time
import requests

for i in range(100):
    response = requests.get('http://localhost:8001/api/gateway/status')
    print(f"Request {i}: {response.status_code}")
    time.sleep(0.1)
```

### Memory Test

```bash
# Monitor backend memory usage
ps aux | grep uvicorn

# Monitor for 10 minutes with gateway running
watch -n 10 'ps aux | grep uvicorn'
```

### Connection Stability

```bash
# Test radar auto-reconnect
# 1. Start monitoring
curl -X POST http://localhost:8001/api/gateway/start

# 2. Simulate disconnect by changing config to invalid port
# 3. Check logs for reconnection attempts
tail -f /var/log/supervisor/backend.err.log

# 4. Restore valid config
# 5. Verify automatic reconnection
```

## Troubleshooting Tests

### Backend Logs

```bash
# View backend errors
tail -f /var/log/supervisor/backend.err.log

# View backend output
tail -f /var/log/supervisor/backend.out.log
```

### Frontend Logs

```bash
# View frontend build logs
tail -f /var/log/supervisor/frontend.*.log
```

### API Debugging

```bash
# Test all endpoints
curl http://localhost:8001/api/
curl http://localhost:8001/api/gateway/status
curl http://localhost:8001/api/gateway/config
curl http://localhost:8001/api/gateway/health
```

## Automated Test Suite

Create `test_gateway.sh`:

```bash
#!/bin/bash

echo "=== Testing Drone Radar Gateway ==="

echo "1. Testing API health..."
curl -s http://localhost:8001/api/ | grep -q "Drone Detection" && echo "✓ API healthy" || echo "✗ API failed"

echo "2. Testing status endpoint..."
curl -s http://localhost:8001/api/gateway/status | grep -q "is_running" && echo "✓ Status endpoint working" || echo "✗ Status failed"

echo "3. Starting gateway..."
curl -s -X POST http://localhost:8001/api/gateway/start | grep -q "success" && echo "✓ Gateway started" || echo "✗ Start failed"

sleep 3

echo "4. Verifying monitoring..."
curl -s http://localhost:8001/api/gateway/status | grep -q '"radar_status":"monitoring"' && echo "✓ Monitoring active" || echo "✗ Monitoring failed"

echo "5. Stopping gateway..."
curl -s -X POST http://localhost:8001/api/gateway/stop | grep -q "success" && echo "✓ Gateway stopped" || echo "✗ Stop failed"

echo "=== Test Complete ==="
```

Run: `bash test_gateway.sh`

## Expected Results

### Successful Operation

- ✅ API responds on port 8001
- ✅ Gateway starts and shows "monitoring" status
- ✅ Mock radar generates detections (check stats)
- ✅ Data can be manually published
- ✅ Logs show activity
- ✅ Configuration changes persist
- ✅ Frontend loads without errors
- ✅ Electron app launches successfully

### Common Issues

1. **Backend not starting**: Check Python dependencies
2. **No detections**: Wait longer (mock radar has random intervals 3-8s)
3. **LoCrypt publish fails**: Expected without real credentials (use mock)
4. **Serial port errors**: Check permissions and port name
5. **Frontend not loading**: Check if port 3000 is available

## Next Steps

1. Test with actual radar hardware
2. Configure real LoCrypt credentials
3. Deploy to production environment
4. Build Electron installers for distribution
