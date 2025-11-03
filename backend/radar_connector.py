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
    """Mock radar connector for testing/demo"""
    
    def __init__(self, config: Dict[str, Any]):
        super().__init__(config)
        self.detection_count = 0
        
    async def connect(self) -> bool:
        self.is_connected = True
        logger.info("Mock radar connected")
        return True
        
    async def disconnect(self):
        self.is_connected = False
        logger.info("Mock radar disconnected")
        
    async def read_data(self) -> Optional[Dict[str, Any]]:
        import random
        
        await asyncio.sleep(random.uniform(3, 8))  # Random interval
        
        # Simulate detection event
        if random.random() < 0.3:  # 30% chance of detection
            self.detection_count += 1
            bearing = random.randint(0, 359)
            range_km = round(random.uniform(0.5, 10.0), 2)
            altitude = random.randint(50, 500)
            speed = random.randint(20, 150)
            
            # Generate NMEA-like sentence
            nmea_sentence = f"$GPGGA,123519,{bearing:03d}.00,N,{range_km:.2f},E,1,08,{altitude},{speed}.0,M,46.9,M,,*47"
            
            return {
                'raw_data': nmea_sentence,
                'source': 'mock',
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
