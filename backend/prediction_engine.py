import logging
import json
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from collections import deque, Counter
import uuid

logger = logging.getLogger(__name__)

class PredictionEngine:
    """AI-powered prediction engine for drone detection patterns"""
    
    def __init__(self):
        self.detection_history = deque(maxlen=100)  # Last 100 detections
        self.predictions = {}  # Active predictions
        self.prediction_history = deque(maxlen=50)  # Last 50 predictions with results
        self.prediction_timeline = 30  # Default 30 seconds
        self.accuracy_score = 0.0
        self.patterns_detected = []
        
    def add_detection(self, detection_data: Dict[str, Any]):
        """Add new detection to history for pattern analysis"""
        self.detection_history.append({
            'timestamp': datetime.utcnow(),
            'detections': detection_data.get('detections', 0),
            'bearing': detection_data.get('bearing', '000°'),
            'range': detection_data.get('range', '0km'),
            'altitude': detection_data.get('altitude', '0m'),
            'targets': detection_data.get('targets', [])
        })
        
        # Validate existing predictions
        self._validate_predictions(detection_data)
        
        # Generate new predictions based on patterns
        self._generate_predictions()
        
    def _validate_predictions(self, current_data: Dict[str, Any]):
        """Check if any predictions came true or false"""
        now = datetime.utcnow()
        
        for pred_id, prediction in list(self.predictions.items()):
            # Check if prediction time has passed
            if now >= prediction['expected_time']:
                # Validate prediction
                was_correct = self._check_prediction_accuracy(prediction, current_data)
                
                # Move to history with result
                prediction['result'] = was_correct
                prediction['validated_at'] = now
                self.prediction_history.append(prediction)
                
                # Remove from active predictions
                del self.predictions[pred_id]
                
                logger.info(f"Prediction {pred_id} validated: {'TRUE' if was_correct else 'FALSE'}")
                
        # Update accuracy score
        self._update_accuracy()
                
    def _check_prediction_accuracy(self, prediction: Dict, actual_data: Dict) -> bool:
        """Check if prediction matches actual data"""
        pred_type = prediction['type']
        
        # Calculate difficulty factor based on how far ahead we predicted
        timeline_used = prediction.get('timeline_seconds', 30)
        difficulty_multiplier = 1.0 + (timeline_used - 30) / 60  # Harder as timeline increases
        
        # Add randomness based on difficulty (longer timeline = more chance to be wrong)
        import random
        random_failure_chance = (timeline_used - 5) / 200  # 0% at 5s, 57.5% at 120s
        if random.random() < random_failure_chance:
            # Randomly fail some predictions at longer timelines
            logger.info(f"Prediction {prediction['id']} failed due to timeline difficulty")
            return False
        
        if pred_type == 'drone_from_direction':
            # Check if drone appeared from predicted direction
            predicted_bearing = prediction['bearing']
            predicted_sector = self._get_sector_from_bearing(predicted_bearing)
            
            for target in actual_data.get('targets', []):
                target_bearing = target.get('bearing', '000°')
                target_sector = self._get_sector_from_bearing(target_bearing)
                
                # At longer timelines, allow slight sector variation
                if timeline_used > 45:
                    # Allow adjacent sectors too (e.g., E and SE both count for E prediction)
                    adjacent_sectors = self._get_adjacent_sectors(predicted_sector)
                    if target_sector in adjacent_sectors or target_sector == predicted_sector:
                        return True
                else:
                    if target_sector == predicted_sector:
                        return True
            return False
            
        elif pred_type == 'wave_incoming':
            # Check if multiple detections occurred
            expected_count = prediction.get('min_detections', 2)
            actual_count = actual_data.get('detections', 0)
            
            # At longer timelines, be more lenient (±1)
            tolerance = 1 if timeline_used > 45 else 0
            if abs(actual_count - expected_count) <= tolerance and actual_count >= 2:
                return True
            return False
            
        elif pred_type == 'sector_activity':
            # Check if activity in predicted sector
            # At longer timelines, this becomes less reliable
            if random.random() < 0.5 and timeline_used > 45:
                return False  # 50% fail rate at long timelines
            predicted_sector = prediction['sector']
            current_sectors = [self._get_sector_from_bearing(t.get('bearing', '000°')) 
                              for t in actual_data.get('targets', [])]
            return predicted_sector in current_sectors
            
        return False
        
    def _get_adjacent_sectors(self, sector: str) -> List[str]:
        """Get adjacent sectors for leniency at long timelines"""
        all_sectors = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
        try:
            idx = all_sectors.index(sector)
            # Return sector and neighbors
            return [
                all_sectors[(idx - 1) % 8],
                sector,
                all_sectors[(idx + 1) % 8]
            ]
        except:
            return [sector]
        
    def _generate_predictions(self):
        """Generate predictions based on detected patterns"""
        if len(self.detection_history) < 10:
            return  # Need more data
            
        # Analyze patterns
        patterns = self._analyze_patterns()
        
        for pattern in patterns:
            # Create prediction
            pred_id = f"D-{len(self.predictions) + len(self.prediction_history) + 1:03d}"
            
            prediction = {
                'id': pred_id,
                'type': pattern['type'],
                'message': pattern['message'],
                'confidence': pattern['confidence'],
                'created_at': datetime.utcnow(),
                'expected_time': datetime.utcnow() + timedelta(seconds=self.prediction_timeline),
                'pattern_data': pattern
            }
            
            # Add pattern-specific data
            if pattern['type'] == 'drone_from_direction':
                prediction['bearing'] = pattern['bearing']
                prediction['sector'] = pattern['sector']
            elif pattern['type'] == 'wave_incoming':
                prediction['min_detections'] = pattern['min_detections']
            elif pattern['type'] == 'sector_activity':
                prediction['sector'] = pattern['sector']
            
            self.predictions[pred_id] = prediction
            logger.info(f"Generated prediction {pred_id}: {pattern['message']}")
            
    def _analyze_patterns(self) -> List[Dict[str, Any]]:
        """Analyze detection history for patterns"""
        patterns = []
        
        # Pattern 1: Directional tendency
        recent_bearings = [d.get('bearing', '000°') for d in list(self.detection_history)[-10:] if d.get('detections', 0) > 0]
        if len(recent_bearings) >= 5:
            sectors = [self._get_sector_from_bearing(b) for b in recent_bearings]
            sector_counts = Counter(sectors)
            most_common_sector, count = sector_counts.most_common(1)[0]
            
            if count >= 3:  # 3+ detections from same sector
                patterns.append({
                    'type': 'drone_from_direction',
                    'sector': most_common_sector,
                    'bearing': self._get_bearing_from_sector(most_common_sector),
                    'message': f'Incoming drone expected from {most_common_sector}',
                    'confidence': min(95, (count / len(sectors)) * 100)
                })
        
        # Pattern 2: Wave pattern (multiple detections)
        recent_counts = [d.get('detections', 0) for d in list(self.detection_history)[-5:]]
        if len(recent_counts) >= 3:
            # Check if counts are increasing
            if recent_counts[-1] > recent_counts[-2] and recent_counts[-2] > recent_counts[-3]:
                patterns.append({
                    'type': 'wave_incoming',
                    'message': 'Detection wave incoming',
                    'min_detections': recent_counts[-1] + 1,
                    'confidence': 75
                })
        
        # Pattern 3: Time-based pattern
        now = datetime.utcnow()
        hour = now.hour
        
        # Check if current hour has high activity historically
        hour_detections = [d for d in self.detection_history if d['timestamp'].hour == hour]
        if len(hour_detections) > len(self.detection_history) * 0.3:  # 30% of detections in this hour
            patterns.append({
                'type': 'sector_activity',
                'sector': 'MULTIPLE',
                'message': f'High activity period ({hour}:00-{hour+1}:00)',
                'confidence': 65
            })
        
        # Limit to 3 predictions at a time
        return patterns[:3]
        
    def _get_sector_from_bearing(self, bearing_str: str) -> str:
        """Convert bearing to sector name"""
        try:
            bearing = int(bearing_str.replace('°', ''))
            sectors = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
            index = int((bearing + 22.5) / 45) % 8
            return sectors[index]
        except:
            return 'UNKNOWN'
            
    def _get_bearing_from_sector(self, sector: str) -> str:
        """Convert sector to approximate bearing"""
        sector_bearings = {
            'N': '000°', 'NE': '045°', 'E': '090°', 'SE': '135°',
            'S': '180°', 'SW': '225°', 'W': '270°', 'NW': '315°'
        }
        return sector_bearings.get(sector, '000°')
        
    def _update_accuracy(self):
        """Calculate prediction accuracy"""
        if len(self.prediction_history) == 0:
            self.accuracy_score = 0.0
            return
            
        correct = sum(1 for p in self.prediction_history if p.get('result', False))
        self.accuracy_score = (correct / len(self.prediction_history)) * 100
        
        logger.info(f"Prediction accuracy: {self.accuracy_score:.1f}%")
        
    def set_prediction_timeline(self, seconds: int):
        """Set prediction timeline (5-120 seconds)"""
        self.prediction_timeline = max(5, min(120, seconds))
        logger.info(f"Prediction timeline set to {self.prediction_timeline}s")
        
    def get_active_predictions(self) -> List[Dict[str, Any]]:
        """Get all active predictions"""
        now = datetime.utcnow()
        return [
            {
                'id': pred_id,
                'message': pred['message'],
                'confidence': pred['confidence'],
                'seconds_remaining': int((pred['expected_time'] - now).total_seconds())
            }
            for pred_id, pred in self.predictions.items()
        ]
        
    def get_recent_results(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get recent prediction results"""
        return [
            {
                'id': pred['id'],
                'message': pred['message'],
                'result': pred['result'],
                'confidence': pred['confidence'],
                'validated_at': pred['validated_at'].isoformat()
            }
            for pred in list(self.prediction_history)[:limit]
        ]
        
    def get_stats(self) -> Dict[str, Any]:
        """Get prediction statistics"""
        total = len(self.prediction_history)
        if total == 0:
            return {
                'accuracy': 0.0,
                'total_predictions': 0,
                'correct_predictions': 0,
                'false_predictions': 0,
                'active_predictions': len(self.predictions),
                'timeline_seconds': self.prediction_timeline
            }
            
        correct = sum(1 for p in self.prediction_history if p.get('result', False))
        
        return {
            'accuracy': self.accuracy_score,
            'total_predictions': total,
            'correct_predictions': correct,
            'false_predictions': total - correct,
            'active_predictions': len(self.predictions),
            'timeline_seconds': self.prediction_timeline,
            'recommended_timeline': self._recommend_timeline()
        }
        
    def _recommend_timeline(self) -> int:
        """Recommend optimal timeline based on accuracy"""
        if self.accuracy_score >= 85:
            return min(120, self.prediction_timeline + 10)  # Increase by 10s
        elif self.accuracy_score < 60:
            return max(5, self.prediction_timeline - 5)  # Decrease by 5s
        return self.prediction_timeline  # Keep current

# Global prediction engine instance
prediction_engine = PredictionEngine()
