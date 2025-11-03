import asyncio
import logging
import json
from typing import Dict, Any, Optional
from datetime import datetime
from collections import deque
import aiohttp

logger = logging.getLogger(__name__)

class LoCryptClient:
    """Client for publishing data to LoCrypt gateway"""
    
    def __init__(self, backend_url: str, gateway_token: str):
        self.backend_url = backend_url.rstrip('/')
        self.gateway_token = gateway_token
        self.publish_queue = deque(maxlen=100)  # Max 100 queued messages
        self.retry_attempts = 3
        self.is_publishing = False
        self.stats = {
            'published_today': 0,
            'failed_today': 0,
            'last_published': None,
            'last_error': None
        }
        
    async def publish_data(self, radar_data: Dict[str, Any]) -> bool:
        """Publish radar data to LoCrypt gateway"""
        
        endpoint = f"{self.backend_url}/api/gateway/publish-data"
        
        payload = {
            'gateway_token': self.gateway_token,
            'encrypted_data': json.dumps(radar_data),
            'data_type': 'radar'
        }
        
        for attempt in range(self.retry_attempts):
            try:
                async with aiohttp.ClientSession() as session:
                    async with session.post(
                        endpoint,
                        json=payload,
                        timeout=aiohttp.ClientTimeout(total=10)
                    ) as response:
                        
                        if response.status == 200:
                            result = await response.json()
                            logger.info(f"Data published successfully: {result.get('message')}")
                            self.stats['published_today'] += 1
                            self.stats['last_published'] = datetime.utcnow().isoformat()
                            return True
                        else:
                            error_text = await response.text()
                            logger.error(f"Publish failed (HTTP {response.status}): {error_text}")
                            self.stats['last_error'] = f"HTTP {response.status}"
                            
            except asyncio.TimeoutError:
                logger.warning(f"Publish timeout (attempt {attempt + 1}/{self.retry_attempts})")
                self.stats['last_error'] = "Timeout"
            except Exception as e:
                logger.error(f"Publish error (attempt {attempt + 1}/{self.retry_attempts}): {e}")
                self.stats['last_error'] = str(e)
                
            # Exponential backoff
            if attempt < self.retry_attempts - 1:
                await asyncio.sleep(2 ** attempt)
                
        self.stats['failed_today'] += 1
        return False
        
    async def queue_data(self, radar_data: Dict[str, Any]):
        """Add data to publish queue"""
        self.publish_queue.append({
            'data': radar_data,
            'timestamp': datetime.utcnow().isoformat()
        })
        logger.info(f"Data queued. Queue size: {len(self.publish_queue)}")
        
    async def process_queue(self):
        """Process queued messages"""
        
        if self.is_publishing:
            return  # Already processing
            
        self.is_publishing = True
        
        try:
            while self.publish_queue:
                item = self.publish_queue.popleft()
                success = await self.publish_data(item['data'])
                
                if not success:
                    # Re-queue if failed
                    self.publish_queue.appendleft(item)
                    break  # Stop processing on failure
                    
                await asyncio.sleep(1)  # Rate limit
        finally:
            self.is_publishing = False
            
    async def test_connection(self) -> Dict[str, Any]:
        """Test connection to LoCrypt backend"""
        
        endpoint = f"{self.backend_url}/api/gateway/health"
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    endpoint,
                    timeout=aiohttp.ClientTimeout(total=5)
                ) as response:
                    
                    if response.status == 200:
                        return {'success': True, 'message': 'Connection successful'}
                    else:
                        return {'success': False, 'message': f'HTTP {response.status}'}
                        
        except Exception as e:
            return {'success': False, 'message': str(e)}
            
    def get_stats(self) -> Dict[str, Any]:
        """Get publishing statistics"""
        return {
            **self.stats,
            'queue_size': len(self.publish_queue),
            'is_publishing': self.is_publishing
        }
        
    def reset_daily_stats(self):
        """Reset daily statistics"""
        self.stats['published_today'] = 0
        self.stats['failed_today'] = 0
