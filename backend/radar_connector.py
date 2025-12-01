import asyncio
import serial
import socket
import json
import logging
from typing import Optional, Dict, Any, Callable
from abc import ABC, abstractmethod
from datetime import datetime
import pynmea2

logger = logging.getLogger(__name__)

class RadarConnector(ABC):
    """Base class for all radar connectors"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.is_connected = False
        self.is_monitoring = False
        self.on_data_callback: Optional[Callable] = None
        
    @abstractmethod
    async def connect(self) -> bool:
        """Establish connection to radar"""
        pass
        
    @abstractmethod
    async def disconnect(self):
        """Close connection to radar"""
        pass
        
    @abstractmethod
    async def read_data(self) -> Optional[Dict[str, Any]]:
        """Read data from radar"""
        pass
        
    def set_data_callback(self, callback: Callable):
        """Set callback function for data reception"""
        self.on_data_callback = callback
        
    async def start_monitoring(self):
        """Start continuous monitoring loop"""
        self.is_monitoring = True
        logger.info(f"Started monitoring {self.__class__.__name__}")
        
        while self.is_monitoring:
            try:
                if not self.is_connected:
                    await self.connect()
                    await asyncio.sleep(5)
                    continue
                    
                data = await self.read_data()
                if data and self.on_data_callback:
                    await self.on_data_callback(data)
                    
                await asyncio.sleep(0.1)  # Small delay to prevent CPU overload
                
            except Exception as e:
                logger.error(f"Error in monitoring loop: {e}")
                self.is_connected = False
                await asyncio.sleep(10)  # Wait before retry
                
    async def stop_monitoring(self):
        """Stop monitoring loop"""
        self.is_monitoring = False
        await self.disconnect()
        logger.info(f"Stopped monitoring {self.__class__.__name__}")


class SerialRadarConnector(RadarConnector):
    """Serial port radar connector (RS-232/485)"""
    
    def __init__(self, config: Dict[str, Any]):
        super().__init__(config)
        self.serial_connection: Optional[serial.Serial] = None
        
    async def connect(self) -> bool:
        try:
            port = self.config.get('port', '/dev/ttyUSB0')
            baudrate = self.config.get('baudrate', 9600)
            timeout = self.config.get('timeout', 1)
            
            self.serial_connection = serial.Serial(
                port=port,
                baudrate=baudrate,
                timeout=timeout
            )
            self.is_connected = True
            logger.info(f"Connected to serial port {port} at {baudrate} baud")
            return True
        except Exception as e:
            logger.error(f"Failed to connect to serial port: {e}")
            self.is_connected = False
            return False
            
    async def disconnect(self):
        if self.serial_connection and self.serial_connection.is_open:
            self.serial_connection.close()
            self.is_connected = False
            logger.info("Serial port disconnected")
            
    async def read_data(self) -> Optional[Dict[str, Any]]:
        if not self.serial_connection or not self.serial_connection.is_open:
            return None
            
        try:
            if self.serial_connection.in_waiting > 0:
                line = self.serial_connection.readline().decode('utf-8', errors='ignore').strip()
                if line:
                    return {'raw_data': line, 'source': 'serial', 'timestamp': datetime.utcnow().isoformat()}
        except Exception as e:
            logger.error(f"Error reading serial data: {e}")
            self.is_connected = False
            
        return None


class TCPRadarConnector(RadarConnector):
    """TCP/IP socket radar connector"""
    
    def __init__(self, config: Dict[str, Any]):
        super().__init__(config)
        self.socket: Optional[socket.socket] = None
        
    async def connect(self) -> bool:
        try:
            host = self.config.get('host', 'localhost')
            port = self.config.get('port', 5000)
            timeout = self.config.get('timeout', 5)
            
            self.socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            self.socket.settimeout(timeout)
            await asyncio.get_event_loop().run_in_executor(
                None, self.socket.connect, (host, port)
            )
            self.is_connected = True
            logger.info(f"Connected to TCP radar at {host}:{port}")
            return True
        except Exception as e:
            logger.error(f"Failed to connect to TCP radar: {e}")
            self.is_connected = False
            return False
            
    async def disconnect(self):
        if self.socket:
            try:
                self.socket.close()
            except:
                pass
            self.is_connected = False
            logger.info("TCP connection closed")
            
    async def read_data(self) -> Optional[Dict[str, Any]]:
        if not self.socket:
            return None
            
        try:
            data = await asyncio.get_event_loop().run_in_executor(
                None, self.socket.recv, 1024
            )
            if data:
                decoded = data.decode('utf-8', errors='ignore').strip()
                return {'raw_data': decoded, 'source': 'tcp', 'timestamp': datetime.utcnow().isoformat()}
        except socket.timeout:
            pass  # Normal timeout, no data available
        except Exception as e:
            logger.error(f"Error reading TCP data: {e}")
            self.is_connected = False
            
        return None


class FileRadarConnector(RadarConnector):
    """File-based radar connector for testing"""
    
    def __init__(self, config: Dict[str, Any]):
        super().__init__(config)
        self.file_path = config.get('path', 'radar_data.txt')
        self.current_line = 0
        self.lines = []
        
    async def connect(self) -> bool:
        try:
            with open(self.file_path, 'r') as f:
                self.lines = f.readlines()
            self.is_connected = True
            logger.info(f"Loaded {len(self.lines)} lines from {self.file_path}")
            return True
        except Exception as e:
            logger.error(f"Failed to load file: {e}")
            self.is_connected = False
            return False
            
    async def disconnect(self):
        self.is_connected = False
        self.current_line = 0
        
    async def read_data(self) -> Optional[Dict[str, Any]]:
        if not self.lines:
            return None
            
        if self.current_line >= len(self.lines):
            self.current_line = 0  # Loop back to start
            
        line = self.lines[self.current_line].strip()
        self.current_line += 1
        
        await asyncio.sleep(1)  # Simulate realistic data rate
        
        return {'raw_data': line, 'source': 'file', 'timestamp': datetime.utcnow().isoformat()}


class MockRadarConnector(RadarConnector):
    """Mock radar connector with REALISTIC drone movement"""
    
    def __init__(self, config: Dict[str, Any]):
        super().__init__(config)
        self.detection_count = 0
        self.start_time = datetime.utcnow()
        self.active_drones = {}  # Track drones over time
        self.drone_id_counter = 0
        
    async def connect(self) -> bool:
        self.is_connected = True
        self.start_time = datetime.utcnow()
        logger.info("Mock radar connected - REALISTIC MOVEMENT MODE")
        return True
        
    async def disconnect(self):
        self.is_connected = False
        logger.info("Mock radar disconnected")
        
    async def read_data(self) -> Optional[Dict[str, Any]]:
        import random
        
        await asyncio.sleep(random.uniform(2, 4))
        
        elapsed = (datetime.utcnow() - self.start_time).total_seconds()
        
        # Spawn new drones occasionally (every 25-35 seconds)
        if random.random() < 0.15 or len(self.active_drones) == 0:
            self._spawn_new_drone(elapsed)
        
        # Update existing drones (move them closer)
        self._update_drone_positions()
        
        # Remove drones that are too close (<0.5km) or too old
        self._cleanup_drones()
        
        # Create detection data from active drones
        targets = []
        for drone_id, drone in self.active_drones.items():
            targets.append({
                'id': drone['id'],
                'type': 'DRONE',
                'range': f'{drone["range"]:.2f}km',
                'bearing': f'{int(drone["bearing"]):03d}°',
                'altitude': f'{int(drone["altitude"])}m',
                'speed': f'{int(drone["speed"])}kts',
                'latitude': drone['latitude'],
                'longitude': drone['longitude']
            })
        
        if len(targets) > 0 or True:
            main_target = targets[0] if targets else None
            signal_strength = random.randint(70, 95) if len(targets) > 0 else random.randint(30, 50)
            confidence = 'HIGH' if signal_strength > 80 else 'MEDIUM' if signal_strength > 60 else 'LOW'
            
            return {
                'raw_data': json.dumps({
                    'detections': len(targets),
                    'range': main_target['range'] if main_target else '0km',
                    'bearing': main_target['bearing'] if main_target else '000°',
                    'altitude': main_target['altitude'] if main_target else '0m',
                    'speed': main_target['speed'] if main_target else '0kts',
                    'confidence': confidence,
                    'signalStrength': signal_strength,
                    'latitude': main_target['latitude'] if main_target else 34.0522,
                    'longitude': main_target['longitude'] if main_target else -118.2437,
                    'targets': targets
                }),
                'source': 'mock_realistic',
                'timestamp': datetime.utcnow().isoformat(),
                'detection_count': self.detection_count
            }
            
        return None
        
    def _spawn_new_drone(self, elapsed: float):
        """Spawn a new drone at outer edge with movement toward base"""
        import random
        
        self.drone_id_counter += 1
        drone_id = f'TGT-{self.drone_id_counter:03d}'
        
        # PATTERN 1: Every 20s from EAST (more frequent)
        pattern_1_active = int(elapsed) % 20 < 3
        # PATTERN 2: Every 30s from NORTH  
        pattern_2_active = int(elapsed) % 30 < 3
        # PATTERN 3: Every 60s from WEST
        pattern_3_active = int(elapsed) % 60 < 3
        
        if pattern_1_active:
            # Spawn from East (085-095°)
            bearing = random.randint(85, 95)
            range_km = random.uniform(42, 48)  # Start far (near max range)
        elif pattern_2_active:
            # Spawn from North (350-010°)
            bearing = random.choice([355, 358, 0, 2, 5, 8])
            range_km = random.uniform(40, 47)
        elif pattern_3_active:
            # Spawn from West (265-275°)
            bearing = random.randint(265, 275)
            range_km = random.uniform(38, 46)
        else:
            # Random spawn (30% of time)
            if random.random() < 0.3:
                bearing = random.randint(0, 359)
                range_km = random.uniform(35, 48)
            else:
                return  # Don't spawn
        
        # Inbound speed (approaching)
        speed_kts = random.randint(60, 140)  # Typical drone speeds
        
        # Altitude varies
        altitude_m = random.randint(100, 600)
        
        # Calculate GPS position (Cluj-Napoca base)
        base_lat = 46.7712
        base_lon = 23.6236
        
        import math
        R = 6371.0
        lat1 = math.radians(base_lat)
        lon1 = math.radians(base_lon)
        brng = math.radians(bearing)
        
        lat2 = math.asin(
            math.sin(lat1) * math.cos(range_km / R) +
            math.cos(lat1) * math.sin(range_km / R) * math.cos(brng)
        )
        lon2 = lon1 + math.atan2(
            math.sin(brng) * math.sin(range_km / R) * math.cos(lat1),
            math.cos(range_km / R) - math.sin(lat1) * math.sin(lat2)
        )
        
        drone_lat = math.degrees(lat2)
        drone_lon = math.degrees(lon2)
        
        self.active_drones[drone_id] = {
            'id': drone_id,
            'bearing': bearing,
            'range': range_km,
            'altitude': altitude_m,
            'speed': speed_kts,
            'latitude': drone_lat,
            'longitude': drone_lon,
            'spawn_time': datetime.utcnow(),
            'approach_rate': speed_kts * 0.514 / 3600  # Convert kts to km/s
        }
        
        logger.info(f"Spawned {drone_id} at {range_km:.1f}km, {bearing}°, moving at {speed_kts}kts")
        
    def _update_drone_positions(self):
        """Move all active drones closer to base (realistic movement)"""
        import random
        for drone_id, drone in list(self.active_drones.items()):
            # Move closer based on speed
            # Speed in kts, convert to km per update (every 2-4 seconds)
            distance_moved = drone['approach_rate'] * 3  # Approximate 3 seconds per update
            
            drone['range'] -= distance_moved
            
            # Update GPS position
            import math
            base_lat = 46.7712
            base_lon = 23.6236
            
            R = 6371.0
            lat1 = math.radians(base_lat)
            lon1 = math.radians(base_lon)
            brng = math.radians(drone['bearing'])
            
            lat2 = math.asin(
                math.sin(lat1) * math.cos(drone['range'] / R) +
                math.cos(lat1) * math.sin(drone['range'] / R) * math.cos(brng)
            )
            lon2 = lon1 + math.atan2(
                math.sin(brng) * math.sin(drone['range'] / R) * math.cos(lat1),
                math.cos(drone['range'] / R) - math.sin(lat1) * math.sin(lat2)
            )
            
            drone['latitude'] = math.degrees(lat2)
            drone['longitude'] = math.degrees(lon2)
            
            # Slight bearing variation (±1-2 degrees for realism)
            if random.random() < 0.3:
                drone['bearing'] += random.uniform(-2, 2)
                drone['bearing'] = drone['bearing'] % 360
                
    def _cleanup_drones(self):
        """Remove drones that are too close or too old"""
        for drone_id, drone in list(self.active_drones.items()):
            # Remove if too close (<0.5km) - "landed" or passed base
            if drone['range'] < 0.5:
                logger.info(f"{drone_id} removed - reached base")
                del self.active_drones[drone_id]
                continue
                
            # Remove if too old (>5 minutes) - left range
            age = (datetime.utcnow() - drone['spawn_time']).total_seconds()
            if age > 300:
                logger.info(f"{drone_id} removed - too old")
                del self.active_drones[drone_id]


def create_connector(radar_type: str, config: Dict[str, Any]) -> RadarConnector:
    """Factory function to create appropriate radar connector"""
    
    connectors = {
        'serial': SerialRadarConnector,
        'tcp': TCPRadarConnector,
        'file': FileRadarConnector,
        'mock': MockRadarConnector
    }
    
    connector_class = connectors.get(radar_type.lower())
    if not connector_class:
        raise ValueError(f"Unknown radar type: {radar_type}")
        
    return connector_class(config)
