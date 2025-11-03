import logging
import json
import re
from typing import Dict, Any, Optional
from datetime import datetime
import pynmea2

logger = logging.getLogger(__name__)

class RadarDataProcessor:
    """Process and parse radar data from various formats"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.station_id = config.get('station_id', 'RADAR-UNKNOWN')
        self.station_name = config.get('station_name', 'Unknown Station')
        self.anonymize = config.get('anonymize', True)
        
    def process_raw_data(self, raw_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Process raw radar data into standardized format"""
        
        raw_string = raw_data.get('raw_data', '')
        source = raw_data.get('source', 'unknown')
        
        # Try different parsers
        parsed = None
        
        # Try NMEA format first
        parsed = self._parse_nmea(raw_string)
        
        # Try JSON format
        if not parsed:
            parsed = self._parse_json(raw_string)
            
        # Try custom format
        if not parsed:
            parsed = self._parse_custom(raw_string)
            
        if not parsed:
            logger.warning(f"Could not parse data: {raw_string[:100]}")
            return None
            
        # Validate and enrich
        validated = self._validate_data(parsed)
        if not validated:
            return None
            
        # Add metadata
        validated['radarId'] = self.station_id if not self.anonymize else f"RADAR-{hash(self.station_id) % 10000:04d}"
        validated['stationName'] = self.station_name
        validated['timestamp'] = raw_data.get('timestamp', datetime.utcnow().isoformat())
        validated['source'] = source
        
        return validated
        
    def _parse_nmea(self, data: str) -> Optional[Dict[str, Any]]:
        """Parse NMEA format sentences"""
        
        if not data.startswith('$'):
            return None
            
        try:
            msg = pynmea2.parse(data)
            
            result = {
                'detections': 1,
                'confidence': 'HIGH',
                'signalStrength': 85
            }
            
            # Extract data based on sentence type
            if hasattr(msg, 'latitude'):
                result['bearing'] = f"{getattr(msg, 'latitude', 0):.2f}°"
            if hasattr(msg, 'longitude'):
                result['range'] = f"{getattr(msg, 'longitude', 0):.2f}km"
            if hasattr(msg, 'altitude'):
                result['altitude'] = f"{getattr(msg, 'altitude', 0)}m"
            if hasattr(msg, 'spd_over_grnd'):
                result['speed'] = f"{getattr(msg, 'spd_over_grnd', 0)}kts"
                
            return result
            
        except Exception as e:
            logger.debug(f"NMEA parse failed: {e}")
            return None
            
    def _parse_json(self, data: str) -> Optional[Dict[str, Any]]:
        """Parse JSON format data"""
        
        try:
            parsed = json.loads(data)
            
            # Expected fields: detections, range, bearing, altitude, speed, targets
            result = {
                'detections': parsed.get('detections', 0),
                'range': parsed.get('range', 'N/A'),
                'bearing': parsed.get('bearing', 'N/A'),
                'altitude': parsed.get('altitude', 'N/A'),
                'speed': parsed.get('speed', 'N/A'),
                'confidence': parsed.get('confidence', 'MEDIUM'),
                'signalStrength': parsed.get('signalStrength', 75),
                'latitude': parsed.get('latitude', 0),
                'longitude': parsed.get('longitude', 0),
                'targets': parsed.get('targets', [])
            }
            return result
        except Exception as e:
            logger.debug(f"JSON parse failed: {e}")
            return None
            
    def _parse_custom(self, data: str) -> Optional[Dict[str, Any]]:
        """Parse custom radar format"""
        
        # Example custom format: "DET:2 RNG:3.5km BRG:045 ALT:150m SPD:85kts"
        try:
            result = {}
            
            # Extract detections
            det_match = re.search(r'DET:?(\d+)', data, re.IGNORECASE)
            if det_match:
                result['detections'] = int(det_match.group(1))
                
            # Extract range
            rng_match = re.search(r'RNG:?([\d.]+)(km|m)?', data, re.IGNORECASE)
            if rng_match:
                result['range'] = f"{rng_match.group(1)}{rng_match.group(2) or 'km'}"
                
            # Extract bearing
            brg_match = re.search(r'BRG:?(\d+)', data, re.IGNORECASE)
            if brg_match:
                result['bearing'] = f"{brg_match.group(1)}°"
                
            # Extract altitude
            alt_match = re.search(r'ALT:?(\d+)(m|ft)?', data, re.IGNORECASE)
            if alt_match:
                result['altitude'] = f"{alt_match.group(1)}{alt_match.group(2) or 'm'}"
                
            # Extract speed
            spd_match = re.search(r'SPD:?(\d+)(kts|kmh)?', data, re.IGNORECASE)
            if spd_match:
                result['speed'] = f"{spd_match.group(1)}{spd_match.group(2) or 'kts'}"
                
            if result:
                result.setdefault('detections', 1)
                result.setdefault('confidence', 'MEDIUM')
                result.setdefault('signalStrength', 70)
                return result
                
        except Exception as e:
            logger.debug(f"Custom parse failed: {e}")
            
        return None
        
    def _validate_data(self, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Validate parsed data"""
        
        # Check required fields
        if 'detections' not in data:
            return None
            
        # Validate detections count
        detections = data.get('detections', 0)
        if detections < 0 or detections > 100:
            logger.warning(f"Invalid detection count: {detections}")
            return None
            
        # Validate bearing if present
        bearing_str = data.get('bearing', '')
        if bearing_str and bearing_str != 'N/A':
            try:
                bearing_val = float(bearing_str.replace('°', ''))
                if bearing_val < 0 or bearing_val > 360:
                    logger.warning(f"Invalid bearing: {bearing_val}")
                    return None
            except:
                pass
                
        # Validate range
        range_str = data.get('range', '')
        if range_str and range_str != 'N/A':
            try:
                range_val = float(re.sub(r'[^\d.]', '', range_str))
                if range_val < 0 or range_val > 50:  # 50km max
                    logger.warning(f"Invalid range: {range_val}")
                    return None
            except:
                pass
                
        return data
