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
    """Mock radar connector with PATTERNED data for AI training"""
    
    def __init__(self, config: Dict[str, Any]):
        super().__init__(config)
        self.detection_count = 0
        self.start_time = datetime.utcnow()
        
    async def connect(self) -> bool:
        self.is_connected = True
        self.start_time = datetime.utcnow()
        logger.info("Mock radar connected - PATTERN MODE for AI training")
        return True
        
    async def disconnect(self):
        self.is_connected = False
        logger.info("Mock radar disconnected")
        
    async def read_data(self) -> Optional[Dict[str, Any]]:
        import random
        
        await asyncio.sleep(random.uniform(2, 4))  # Every 2-4 seconds
        
        self.detection_count += 1
        elapsed = (datetime.utcnow() - self.start_time).total_seconds()
        
        # PATTERN 1: Every 20 seconds, drone from EAST (090°)
        pattern_1_active = int(elapsed) % 20 < 5  # Active for 5 seconds every 20 seconds
        
        # PATTERN 2: Every 30 seconds, wave of 3 drones
        pattern_2_active = int(elapsed) % 30 < 8  # Active for 8 seconds every 30 seconds
        
        # PATTERN 3: Every 60 seconds, drone from NORTH (000°)
        pattern_3_active = int(elapsed) % 60 < 6  # Active for 6 seconds every 60 seconds
        
        targets = []
        num_targets = 0
        
        # Apply patterns
        if pattern_1_active:
            # Drone from EAST (080-100°)
            bearing = random.randint(85, 95)
            range_km = round(random.uniform(5.0, 25.0), 2)
            altitude = random.randint(150, 400)
            speed = random.randint(60, 120)
            
            targets.append({
                'id': f'TGT-{self.detection_count:03d}',
                'type': 'DRONE',
                'range': f'{range_km}km',
                'bearing': f'{bearing:03d}°',
                'altitude': f'{altitude}m',
                'speed': f'{speed}kts',
                'latitude': round(34.0522 + random.uniform(-0.2, 0.2), 4),
                'longitude': round(-118.2437 + random.uniform(-0.2, 0.2), 4)
            })
            num_targets += 1
        
        if pattern_2_active:
            # Wave of 3 drones from various directions
            for i in range(2):  # Add 2 more drones
                bearing = random.randint(0, 359)
                range_km = round(random.uniform(10.0, 35.0), 2)
                altitude = random.randint(100, 600)
                speed = random.randint(40, 150)
                
                targets.append({
                    'id': f'TGT-{self.detection_count + i + 1:03d}',
                    'type': 'DRONE',
                    'range': f'{range_km}km',
                    'bearing': f'{bearing:03d}°',
                    'altitude': f'{altitude}m',
                    'speed': f'{speed}kts',
                    'latitude': round(34.0522 + random.uniform(-0.3, 0.3), 4),
                    'longitude': round(-118.2437 + random.uniform(-0.3, 0.3), 4)
                })
            num_targets += 2
        
        if pattern_3_active:
            # Drone from NORTH (350-010°)
            bearing = random.choice([355, 358, 0, 2, 5, 8])
            range_km = round(random.uniform(8.0, 20.0), 2)
            altitude = random.randint(200, 500)
            speed = random.randint(70, 140)
            
            targets.append({
                'id': f'TGT-{self.detection_count + 10:03d}',
                'type': 'DRONE',
                'range': f'{range_km}km',
                'bearing': f'{bearing:03d}°',
                'altitude': f'{altitude}m',
                'speed': f'{speed}kts',
                'latitude': round(34.0522 + random.uniform(-0.15, 0.15), 4),
                'longitude': round(-118.2437 + random.uniform(-0.15, 0.15), 4)
            })
            num_targets += 1
        
        # 30% chance of random drone (to add some unpredictability)
        if random.random() < 0.3 and num_targets == 0:
            bearing = random.randint(0, 359)
            range_km = round(random.uniform(2.0, 45.0), 2)
            altitude = random.randint(50, 800)
            speed = random.randint(20, 180)
            
            targets.append({
                'id': f'TGT-{self.detection_count:03d}',
                'type': 'DRONE',
                'range': f'{range_km}km',
                'bearing': f'{bearing:03d}°',
                'altitude': f'{altitude}m',
                'speed': f'{speed}kts',
                'latitude': round(34.0522 + random.uniform(-0.5, 0.5), 4),
                'longitude': round(-118.2437 + random.uniform(-0.5, 0.5), 4)
            })
            num_targets = 1
        
        if num_targets > 0 or True:  # Always send telemetry
            main_target = targets[0] if targets else None
            signal_strength = random.randint(65, 95) if num_targets > 0 else random.randint(30, 50)
            confidence = 'HIGH' if signal_strength > 80 else 'MEDIUM' if signal_strength > 60 else 'LOW'
            
            return {
                'raw_data': json.dumps({
                    'detections': num_targets,
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
                'source': 'mock_patterned',
                'timestamp': datetime.utcnow().isoformat(),
                'detection_count': self.detection_count
            }
            
        return None


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
