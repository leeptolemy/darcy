import asyncio
import logging
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
from radar_connector import create_connector, RadarConnector
from data_processor import RadarDataProcessor
from locrypt_client import DarcyClient
from config_manager import ConfigManager

logger = logging.getLogger(__name__)

class GatewayManager:
    """Main gateway manager coordinating all components"""
    
    def __init__(self):
        self.config_manager = ConfigManager()
        self.config = self.config_manager.load_config()
        
        self.radar_connector: Optional[RadarConnector] = None
        self.data_processor: Optional[RadarDataProcessor] = None
        self.darcy_client: Optional[DarcyClient] = None
        
        self.is_running = False
        self.last_detection_time: Optional[datetime] = None
        self.last_detection_count = 0
        self.last_published_data: Optional[Dict[str, Any]] = None
        
        self.stats = {
            'start_time': None,
            'detections_total': 0,
            'published_total': 0,
            'errors_total': 0,
            'last_error': None
        }
        
    def initialize(self):
        """Initialize all components"""
        try:
            # Initialize data processor
            radar_config = self.config.get('radar_data', {})
            self.data_processor = RadarDataProcessor(radar_config)
            
            # Initialize Darcy client
            darcy_config = self.config.get('darcy', {})
            backend_url = darcy_config.get('backend_url', '')
            gateway_token = darcy_config.get('gateway_token', '')
            
            if backend_url and gateway_token:
                self.darcy_client = DarcyClient(backend_url, gateway_token)
                logger.info("Darcy client initialized")
            else:
                logger.warning("Darcy credentials not configured")
                
            # Initialize radar connector
            radar_type = self.config.get('radar', {}).get('type', 'mock')
            radar_conn_config = self.config.get('radar', {}).get('connection', {})
            
            self.radar_connector = create_connector(radar_type, radar_conn_config)
            self.radar_connector.set_data_callback(self._on_radar_data)
            logger.info(f"Radar connector initialized: {radar_type}")
            
            return True
            
        except Exception as e:
            logger.error(f"Initialization failed: {e}")
            return False
            
    async def start(self):
        """Start the gateway"""
        if self.is_running:
            return {"success": False, "message": "Gateway already running"}
            
        if not self.radar_connector:
            if not self.initialize():
                return {"success": False, "message": "Initialization failed"}
                
        self.is_running = True
        self.stats['start_time'] = datetime.utcnow().isoformat()
        
        # Start radar monitoring in background
        asyncio.create_task(self.radar_connector.start_monitoring())
        
        logger.info("Gateway started")
        return {"success": True, "message": "Gateway started successfully"}
        
    async def stop(self):
        """Stop the gateway"""
        if not self.is_running:
            return {"success": False, "message": "Gateway not running"}
            
        self.is_running = False
        
        if self.radar_connector:
            await self.radar_connector.stop_monitoring()
            
        logger.info("Gateway stopped")
        return {"success": True, "message": "Gateway stopped successfully"}
        
    async def _on_radar_data(self, raw_data: Dict[str, Any]):
        """Callback when radar data is received"""
        try:
            # Process raw data
            if not self.data_processor:
                return
                
            processed = self.data_processor.process_raw_data(raw_data)
            if not processed:
                return
                
            self.stats['detections_total'] += 1
            self.last_detection_time = datetime.utcnow()
            
            detection_count = processed.get('detections', 0)
            
            logger.info(f"Radar detection: {detection_count} targets")
            
            # Determine if we should publish
            should_publish = self._should_publish(processed, detection_count)
            
            if should_publish:
                await self._publish_data(processed)
                
        except Exception as e:
            logger.error(f"Error processing radar data: {e}")
            self.stats['errors_total'] += 1
            self.stats['last_error'] = str(e)
            
    def _should_publish(self, data: Dict[str, Any], detection_count: int) -> bool:
        """Determine if data should be published based on mode"""
        
        mode = self.config.get('publishing', {}).get('mode', 'on_detection')
        
        if mode == 'manual':
            return False  # Only manual trigger
            
        if mode == 'on_detection':
            return detection_count > 0
            
        if mode == 'periodic':
            interval = self.config.get('publishing', {}).get('interval', 30)
            if not self.last_published_data:
                return True
            # Check if enough time has passed
            # (simplified - in production track last publish time)
            return True
            
        if mode == 'change_based':
            # Publish if detection count changed
            changed = detection_count != self.last_detection_count
            self.last_detection_count = detection_count
            return changed
            
        return False
        
    async def _publish_data(self, data: Dict[str, Any]):
        """Publish data to Darcy"""
        if not self.darcy_client:
            logger.warning("Darcy client not configured")
            return
            
        success = await self.darcy_client.publish_data(data)
        
        if success:
            self.stats['published_total'] += 1
            self.last_published_data = data
            logger.info("Data published to Darcy")
        else:
            # Queue for retry
            await self.darcy_client.queue_data(data)
            logger.warning("Data queued for retry")
            
    async def manual_publish(self):
        """Manually trigger data publish"""
        if self.last_published_data:
            await self._publish_data(self.last_published_data)
            return {"success": True, "message": "Data published"}
        else:
            return {"success": False, "message": "No data available to publish"}
            
    async def test_radar_connection(self) -> Dict[str, Any]:
        """Test radar connection"""
        if not self.radar_connector:
            return {"success": False, "message": "Radar not configured"}
            
        try:
            connected = await self.radar_connector.connect()
            await self.radar_connector.disconnect()
            
            if connected:
                return {"success": True, "message": "Radar connection successful"}
            else:
                return {"success": False, "message": "Radar connection failed"}
        except Exception as e:
            return {"success": False, "message": str(e)}
            
    async def test_darcy_connection(self) -> Dict[str, Any]:
        """Test Darcy connection"""
        if not self.darcy_client:
            return {"success": False, "message": "Darcy not configured"}
            
        return await self.darcy_client.test_connection()
        
    def get_status(self) -> Dict[str, Any]:
        """Get current gateway status"""
        
        uptime = None
        if self.stats['start_time']:
            start = datetime.fromisoformat(self.stats['start_time'])
            uptime = str(datetime.utcnow() - start)
            
        radar_status = "disconnected"
        if self.radar_connector:
            if self.radar_connector.is_connected:
                radar_status = "connected"
            if self.radar_connector.is_monitoring:
                radar_status = "monitoring"
                
        return {
            'is_running': self.is_running,
            'radar_status': radar_status,
            'locrypt_connected': self.locrypt_client is not None,
            'uptime': uptime,
            'last_detection': self.last_detection_time.isoformat() if self.last_detection_time else None,
            'stats': self.stats,
            'locrypt_stats': self.locrypt_client.get_stats() if self.locrypt_client else {},
            'last_published_data': self.last_published_data
        }
        
    def update_config(self, new_config: Dict[str, Any]):
        """Update configuration"""
        self.config_manager.save_config(new_config)
        self.config = new_config
        logger.info("Configuration updated")
        
    def get_config(self) -> Dict[str, Any]:
        """Get current configuration"""
        return self.config

# Global gateway instance
gateway_manager = GatewayManager()
