import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
import math

logger = logging.getLogger(__name__)

class DangerZonePredictor:
    def __init__(self, base_location: Dict[str, float]):
        self.base_location = base_location
        
    def calculate_danger_zones(self, predictions: List[Dict], current_data: Dict, timeline_minutes: int = 5) -> List[Dict[str, Any]]:
        danger_zones = []
        if current_data and current_data.get('targets'):
            for target in current_data['targets']:
                zone = self._create_zone_from_target(target, 'IMMEDIATE', 'HIGH')
                if zone:
                    danger_zones.append(zone)
        for pred in predictions:
            if pred.get('type') == 'drone_from_direction':
                zone = self._create_predicted_zone(pred, timeline_minutes)
                if zone:
                    danger_zones.append(zone)
        return danger_zones
        
    def _create_zone_from_target(self, target: Dict, zone_type: str, threat_level: str) -> Optional[Dict]:
        try:
            bearing_str = target.get('bearing', '000°')
            range_str = target.get('range', '0km')
            bearing = float(bearing_str.replace('°', ''))
            range_km = float(range_str.replace('km', ''))
            target_lat, target_lon = self._calculate_position(self.base_location['lat'], self.base_location['lon'], range_km, bearing)
            altitude_str = target.get('altitude', '0m')
            altitude_m = float(altitude_str.replace('m', '').replace('ft', ''))
            danger_radius_km = max(0.5, min(3.0, altitude_m / 300))
            return {'id': target.get('id', 'UNKNOWN'), 'type': zone_type, 'threat_level': threat_level, 'center': {'lat': target_lat, 'lon': target_lon}, 'radius_km': danger_radius_km, 'bearing_from_base': bearing, 'distance_from_base_km': range_km, 'estimated_time': 'NOW', 'details': f"{target.get('id')} at {range_str}, {bearing_str}, {target.get('altitude')}"}
        except Exception as e:
            return None
            
    def _create_predicted_zone(self, prediction: Dict, timeline_minutes: int) -> Optional[Dict]:
        try:
            sector = prediction.get('sector', 'N')
            bearing = self._sector_to_bearing(sector)
            predicted_range_km = 20.0
            pred_lat, pred_lon = self._calculate_position(self.base_location['lat'], self.base_location['lon'], predicted_range_km, bearing)
            danger_radius_km = 5.0
            seconds_remaining = prediction.get('seconds_remaining', 0)
            eta = datetime.utcnow() + timedelta(seconds=seconds_remaining)
            return {'id': prediction['id'], 'type': 'PREDICTED', 'threat_level': 'MEDIUM', 'center': {'lat': pred_lat, 'lon': pred_lon}, 'radius_km': danger_radius_km, 'bearing_from_base': bearing, 'distance_from_base_km': predicted_range_km, 'estimated_time': eta.strftime('%H:%M:%S'), 'details': f"AI: {prediction['message']}", 'confidence': prediction.get('confidence', 50)}
        except:
            return None
            
    def _calculate_position(self, base_lat: float, base_lon: float, distance_km: float, bearing: float) -> tuple:
        R = 6371.0
        lat1 = math.radians(base_lat)
        lon1 = math.radians(base_lon)
        brng = math.radians(bearing)
        lat2 = math.asin(math.sin(lat1) * math.cos(distance_km / R) + math.cos(lat1) * math.sin(distance_km / R) * math.cos(brng))
        lon2 = lon1 + math.atan2(math.sin(brng) * math.sin(distance_km / R) * math.cos(lat1), math.cos(distance_km / R) - math.sin(lat1) * math.sin(lat2))
        return math.degrees(lat2), math.degrees(lon2)
        
    def _sector_to_bearing(self, sector: str) -> float:
        return {'N': 0, 'NE': 45, 'E': 90, 'SE': 135, 'S': 180, 'SW': 225, 'W': 270, 'NW': 315}.get(sector, 0)
        
    def format_for_locrypt(self, danger_zones: List[Dict], sos: bool = False, group_name: str = '') -> Dict[str, Any]:
        m = []
        if sos:
            m.append("⚠️⚠️⚠️ SOS - EMERGENCY DRONE ALERT ⚠️⚠️⚠️")
        else:
            m.append("🚨 DRONE DETECTION ALERT")
        m.extend(["", f"📍 BASE: Cluj-Napoca ({self.base_location['lat']:.4f}°N, {self.base_location['lon']:.4f}°E)", f"📅 {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}", "", f"🎯 DANGER ZONES: {len(danger_zones)}", ""])
        for i, z in enumerate(danger_zones, 1):
            m.append(f"{i}. {'🔴 IMMEDIATE' if z['type'] == 'IMMEDIATE' else '🟡 PREDICTED'} - {z['id']}")
            m.extend([f"   • Loc: {z['center']['lat']:.4f}°N, {z['center']['lon']:.4f}°E", f"   • From base: {z['distance_from_base_km']:.1f}km at {z['bearing_from_base']:.0f}°", f"   • Danger radius: {z['radius_km']:.1f}km", f"   • ETA: {z['estimated_time']}"])
            if z.get('confidence'):
                m.append(f"   • Confidence: {z['confidence']:.0f}%")
            m.extend([f"   • {z['details']}", ""])
        if sos:
            m.extend(["⚠️ IMMEDIATE ACTION REQUIRED", "⚠️ SEEK SHELTER OR AVOID AREAS"])
        else:
            m.append("ℹ️ Stay alert")
        return {'message_text': '\n'.join(m), 'danger_zones': danger_zones, 'sos': sos, 'base_location': self.base_location, 'group_name': group_name, 'timestamp': datetime.utcnow().isoformat(), 'total_zones': len(danger_zones)}

danger_zone_predictor = DangerZonePredictor({'lat': 46.7712, 'lon': 23.6236})
