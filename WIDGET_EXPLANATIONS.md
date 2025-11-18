# DARCY Dashboard - Widget Explanation (Simple Language)

## What Each Widget Shows & Where Data Comes From

### LEFT COLUMN 1

**1. MISSION**
- **Shows**: Number of drones, total detections, uptime, threat level (CLEAR/GUARDED/ELEVATED/HIGH)
- **Source**: Radar system (counts how many drones detected)
- **Simple**: "Are there drones? How many? How long have we been watching?"

**2. SIGNAL**
- **Shows**: Wavy line going up and down (like a heartbeat monitor)
- **Source**: Radar signal strength over time
- **Simple**: "Is the radar receiving clear signals?"

**3. STATS**
- **Shows**: How accurate our detections are (89%), false alarms (23.5%)
- **Source**: System calculates correct vs incorrect detections
- **Simple**: "How good is our radar at finding real drones vs mistakes?"

### LEFT COLUMN 2

**4. DRONE MODEL**
- **Shows**: Type of drone (DJI Phantom 4), number of propellers (4), confidence (87%)
- **Source**: AI analyzes size, speed, and flight pattern to guess drone type
- **Simple**: "What kind of drone is it? How sure are we?"

**5. FREQ SPEC**
- **Shows**: 30 colored bars showing radio frequencies (like music equalizer)
- **Source**: Radio frequency scanner listening to drone communications
- **Simple**: "What radio channels is the drone using to communicate?"

**6. TRACK Q**
- **Shows**: Quality percentage for tracking each drone (85%, 75%)
- **Source**: Radar lock quality - how well we're following the drone
- **Simple**: "How clearly can we see each drone?"

### LEFT COLUMN 3

**7. RF FREQ**
- **Shows**: Main frequencies (2.4GHz, 5.8GHz), channel bars
- **Source**: Radio spectrum analyzer detecting drone control signals
- **Simple**: "What WiFi/radio frequencies is the drone using?"

**8. DOPPLER**
- **Shows**: Number of moving drones, approaching count, fastest speed
- **Source**: Doppler radar (measures speed by radio wave frequency shift)
- **Simple**: "Which drones are moving toward us? How fast?"

**9. TRAJECTORY**
- **Shows**: Direction drone is heading, speed, predicted position in 30 seconds
- **Source**: Math calculation from current position + speed + direction
- **Simple**: "Where will this drone be in 30 seconds?"

### LEFT COLUMN 4

**10. BATTERY**
- **Shows**: Estimated battery % (45%), flight time remaining (~18 minutes)
- **Source**: AI estimates from flight time and typical drone battery life
- **Simple**: "How much longer can this drone fly before battery dies?"

**11. ALTITUDE**
- **Shows**: How many drones at different heights (0-200m, 200-400m, etc.)
- **Source**: Radar measures height above ground
- **Simple**: "How high up are the drones flying?"

**12. WEATHER**
- **Shows**: Temperature (24°C), wind speed (15kts), visibility (10km)
- **Source**: Weather station or internet weather API
- **Simple**: "What's the weather? Does wind affect drones?"

### CENTER (BIG RADAR)

**13. RADAR SWEEP**
- **Shows**: Circular radar with rotating sweep line, drone icons with info boxes
- **Source**: Main radar system showing 360° view around base
- **Simple**: "Where are all the drones? What direction? How far?"
- **Data Points**:
  - Range circles: 10km, 20km, 30km, 40km
  - Compass: N, E, S, W
  - Drone icons: Pink triangles with pulsing rings
  - Info boxes: ID, distance, direction, size, threat level

### RIGHT COLUMN 1

**14. THREAT MTX** (Matrix/Grid)
- **Shows**: Heat map grid - distance vs height
- **Source**: Plots each drone on grid (how far × how high)
- **Simple**: "Visual chart showing if drones are close+low (dangerous) or far+high (safer)"

**15. BEARING**
- **Shows**: Count of drones in each direction (N, NE, E, SE, S, SW, W, NW)
- **Source**: Radar bearing data grouped by 8 compass directions
- **Simple**: "How many drones from each direction?"

**16. SYSTEM**
- **Shows**: Radar hardware health (TX✓, RX✓, Antenna✓, CPU 34%)
- **Source**: Internal system diagnostics
- **Simple**: "Is all our equipment working properly?"

### RIGHT COLUMN 2

**17. SIGINT** (Signal Intelligence)
- **Shows**: Communication signals detected (WiFi, Video, Telemetry), encryption type
- **Source**: Radio interceptor listening to drone communications
- **Simple**: "What signals is the drone sending? Can we listen to it?"

**18. POSITION**
- **Shows**: GPS coordinates (Latitude, Longitude), compass heading
- **Source**: Our radar station's GPS location
- **Simple**: "Where exactly are we located? Which way are we facing?"

**19. POWER**
- **Shows**: Electricity voltage (230V), power usage (2.85kW), backup battery (92%)
- **Source**: Power monitoring system
- **Simple**: "Do we have electricity? Is backup battery charged?"

### RIGHT COLUMN 3

**20. TARGETS**
- **Shows**: List of all detected drones with range, bearing, altitude, speed
- **Source**: Radar system - all current detections
- **Simple**: "Quick list of every drone we see right now"

**21. GEO MAP**
- **Shows**: Grid map with base station (green) and drone positions (red triangles)
- **Source**: GPS coordinates converted to map positions
- **Simple**: "Where are drones on a map relative to our location?"

**22. NETWORK**
- **Shows**: Internet latency (45ms), upload speed (89%), download speed (78%)
- **Source**: Network connection monitor
- **Simple**: "Is our internet working to send data to LoCrypt?"

### RIGHT COLUMN 4

**23. SIGNAL STR** (Strength)
- **Shows**: Percentage (0-100%), colored bar, confidence level
- **Source**: Radar signal strength measurement
- **Simple**: "How clear is our radar signal? Are we detecting well?"

**24. ALERT LOG**
- **Shows**: List of recent warnings for each detected drone
- **Source**: System generates alert when drone detected
- **Simple**: "What warnings have we had recently?"

**25. AIRSPACE**
- **Shows**: Airspace type (Class B), authority (FAA), violations count
- **Source**: Airspace database + drone altitude checks
- **Simple**: "What airspace rules apply here? Are drones breaking rules?"

### BOTTOM ROW (WIDE PANELS)

**26. EVENT LOG**
- **Shows**: Scrolling list of everything that happened (detections, system events)
- **Source**: System records every action with timestamp
- **Simple**: "History of everything that happened - like a diary"

**27. LOCRYPT TX** (Transmission)
- **Shows**: How many messages sent to LoCrypt, success rate, recent sends
- **Source**: Counts every time we send data to LoCrypt chat
- **Simple**: "Are we successfully sending alerts to the team chat?"

**28. SECTOR COV** (Coverage)
- **Shows**: 8-segment bar showing which directions are monitored
- **Source**: Radar coverage analysis
- **Simple**: "Which directions can our radar see? Any blind spots?"

**29. SPEED DIST** (Distribution)
- **Shows**: How many drones in each speed range (0-50kts, 50-100kts, etc.)
- **Source**: Groups detected drones by their speed
- **Simple**: "Are drones hovering, slow, or very fast?"

**30. CORRELATION**
- **Shows**: Swarm detection - if multiple drones are working together
- **Source**: AI analyzes if drones move in formation
- **Simple**: "Are these drones coordinated? Is it a swarm attack?"

**31. TIMELINE**
- **Shows**: Current time, mission elapsed time, shift end time
- **Source**: System clock
- **Simple**: "What time is it? How long have we been monitoring?"

**32. EM SPECTRUM**
- **Shows**: Which radio frequency bands are active (VHF, UHF, SHF, EHF)
- **Source**: Electromagnetic spectrum analyzer
- **Simple**: "What radio frequencies are being used around us?"

**33. AI PREDICTION**
- **Shows**: AI predictions (e.g., "Drone from E in 30s"), accuracy score, TRUE/FALSE history
- **Source**: AI analyzes patterns in past detections
- **Simple**: "Can AI predict where next drone will come from? Is it usually right?"

**34. LOCRYPT DATA**
- **Shows**: Exactly what data we're sending to LoCrypt chat groups
- **Source**: Formatted summary of all key metrics
- **Simple**: "What information are team members in the chat receiving?"

**35. DANGER ZONES**
- **Shows**: Map of Cluj-Napoca with danger circles around threats
- **Source**: GPS calculations creating safe/unsafe zones
- **Simple**: "Where should people avoid? Show me danger areas on a map!"

### BOTTOM CONTROL BAR (14 Buttons)

- **START/STOP**: Turn radar monitoring on/off
- **PUB**: Manually send data to LoCrypt now
- **RADAR**: Test if radar hardware working
- **DARCY**: Test connection to gateway
- **DETECT Counter**: Total drones found
- **MSGS Counter**: Total alerts sent
- **ERRORS Counter**: Problems encountered
- **OK Icon**: System health good
- **SEC Icon**: Security/encryption active
- **Clock**: Current time
- **Battery Icon**: Backup power level
- **WiFi Icon**: Internet connection
- **Cloud Icon**: Gateway connected to LoCrypt

---

## Data Source Summary

| Widget | Primary Source |
|--------|---------------|
| Mission, Targets, Alert Log | **Main Radar System** |
| Signal, Freq Spec, Signal Str | **Radio Receiver** |
| Drone Model, Battery, Trajectory | **AI Estimation** |
| RF Freq, SIGINT, EM Spectrum | **Radio Scanner** |
| Stats, Track Q, Correlation | **AI Analysis** |
| Doppler | **Doppler Radar** |
| Altitude, Bearing, Threat Matrix | **Radar + Math** |
| Position, Geo Map, Danger Zones | **GPS + Calculations** |
| Weather | **Weather Station/API** |
| System, Power, Network | **Internal Sensors** |
| Event Log, LoCrypt TX | **System Logs** |
| Sector Coverage | **Radar Coverage Map** |
| Speed Distribution | **Speed Data Grouped** |
| Timeline | **System Clock** |
| AI Prediction | **AI Pattern Detection** |
| LoCrypt Data | **Data Formatter** |

---

## In One Sentence Per Widget

1. **Mission**: How many drones and threat level
2. **Signal**: Is radar signal clean?
3. **Stats**: How accurate are we?
4. **Drone Model**: What type of drone?
5. **Freq Spec**: Radio frequency bars
6. **Track Q**: How well are we tracking?
7. **RF Freq**: What frequencies detected?
8. **Doppler**: Which drones are moving?
9. **Trajectory**: Where will it go?
10. **Battery**: How long can it fly?
11. **Altitude**: How high up?
12. **Weather**: Temperature and wind
13. **Radar Sweep**: WHERE IS EVERYTHING? (main display)
14. **Threat Matrix**: Distance vs height grid
15. **Bearing**: Drones from which direction?
16. **System**: Is equipment healthy?
17. **SIGINT**: What's it transmitting?
18. **Position**: Where are we?
19. **Power**: Do we have electricity?
20. **Targets**: Quick list of all drones
21. **Geo Map**: Drones on a map
22. **Network**: Is internet working?
23. **Signal Strength**: How strong is radar?
24. **Alert Log**: Recent warnings
25. **Airspace**: Are rules being broken?
26. **Event Log**: History of everything
27. **LoCrypt TX**: Messages sent successfully?
28. **Sector Coverage**: Blind spots?
29. **Speed Distribution**: Fast or slow drones?
30. **Correlation**: Working together?
31. **Timeline**: What time is it?
32. **EM Spectrum**: Radio bands active?
33. **AI Prediction**: What will happen next?
34. **LoCrypt Data**: What data are we sharing?
35. **Danger Zones**: Where to avoid?

---

**Now implementing the advanced features with 3D visualizations...**
