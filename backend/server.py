from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import asyncio
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone

# Import gateway manager
from gateway_manager import gateway_manager
from prediction_engine import prediction_engine
from danger_zone_predictor import danger_zone_predictor

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI(title="Drone Detection Radar Gateway")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

class ConfigUpdate(BaseModel):
    config: Dict[str, Any]

class GatewayPublishRequest(BaseModel):
    gateway_token: str
    encrypted_data: str
    data_type: str = "radar"

# ============= Radar Gateway Endpoints =============

@api_router.get("/")
async def root():
    return {"message": "Drone Detection Radar Gateway API", "version": "1.0.0"}

@api_router.get("/gateway/status")
async def get_gateway_status():
    """Get current gateway status"""
    try:
        status = gateway_manager.get_status()
        return status
    except Exception as e:
        logging.error(f"Error getting status: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/gateway/start")
async def start_gateway():
    """Start the gateway monitoring"""
    try:
        result = await gateway_manager.start()
        return result
    except Exception as e:
        logging.error(f"Error starting gateway: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/gateway/stop")
async def stop_gateway():
    """Stop the gateway monitoring"""
    try:
        result = await gateway_manager.stop()
        return result
    except Exception as e:
        logging.error(f"Error stopping gateway: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/gateway/publish-manual")
async def manual_publish():
    """Manually trigger data publish"""
    try:
        result = await gateway_manager.manual_publish()
        return result
    except Exception as e:
        logging.error(f"Error publishing: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/gateway/config")
async def get_config():
    """Get current configuration"""
    try:
        config = gateway_manager.get_config()
        # Mask sensitive data
        if 'darcy' in config and 'gateway_token' in config['darcy']:
            token = config['darcy']['gateway_token']
            if token:
                config['darcy']['gateway_token'] = token[:10] + "..." if len(token) > 10 else "***"
        return config
    except Exception as e:
        logging.error(f"Error getting config: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/gateway/config")
async def update_config(config_data: ConfigUpdate):
    """Update gateway configuration"""
    try:
        gateway_manager.update_config(config_data.config)
        return {"success": True, "message": "Configuration updated"}
    except Exception as e:
        logging.error(f"Error updating config: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/gateway/test-radar")
async def test_radar():
    """Test radar connection"""
    try:
        result = await gateway_manager.test_radar_connection()
        return result
    except Exception as e:
        logging.error(f"Error testing radar: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/gateway/test-darcy")
async def test_darcy():
    """Test Darcy connection"""
    try:
        result = await gateway_manager.test_darcy_connection()
        return result
    except Exception as e:
        logging.error(f"Error testing Darcy: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/gateway/health")
async def health_check():
    """Health check endpoint for Darcy"""
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

@api_router.post("/gateway/publish-data")
async def publish_data(request: GatewayPublishRequest):
    """
    Darcy gateway endpoint for publishing sensor data
    This is the endpoint that the app publishes TO (simulated LoCrypt endpoint)
    """
    try:
        # Validate gateway token (in production, check against database)
        if not request.gateway_token:
            raise HTTPException(status_code=401, detail="Invalid gateway token")
        
        # Parse encrypted data to extract key metrics for LoCrypt format
        try:
            import json
            data = json.loads(request.encrypted_data)
            
            # Format for LoCrypt display (matching their UI expectations)
            locrypt_formatted_data = {
                'radarId': data.get('radarId', 'UNKNOWN'),
                'detections': data.get('detections', 0),
                'range': data.get('range', 'N/A'),
                'bearing': data.get('bearing', 'N/A'),
                'altitude': data.get('altitude', 'N/A'),
                'speed': data.get('speed', 'N/A'),
                'signalStrength': data.get('signalStrength', 0),
                'confidence': data.get('confidence', 'UNKNOWN'),
                'threatLevel': 'HIGH' if data.get('detections', 0) > 2 else 'MEDIUM' if data.get('detections', 0) > 0 else 'LOW',
                'timestamp': data.get('timestamp', datetime.utcnow().isoformat())
            }
            
        except:
            locrypt_formatted_data = {}
        
        # Log the received data
        logging.info(f"Received radar data: {request.encrypted_data[:100]}...")
        
        # Store in MongoDB
        doc = {
            'id': str(uuid.uuid4()),
            'gateway_token': request.gateway_token[:10] + "...",  # Masked
            'data': request.encrypted_data,
            'formatted_data': locrypt_formatted_data,
            'data_type': request.data_type,
            'timestamp': datetime.utcnow().isoformat()
        }
        await db.published_data.insert_one(doc)
        
        return {"message": "Sensor data published successfully", "formatted_data": locrypt_formatted_data}
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error publishing data: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/gateway/key-metrics")
async def get_key_metrics():
    """
    Get the most important metrics for LoCrypt display
    Matches the format shown in LoCrypt app
    """
    try:
        status = gateway_manager.get_status()
        data = status.get('last_published_data')
        
        # Find closest/most threatening target
        closest_range = 999
        primary_target = None
        
        if data and data.get('targets'):
            for target in data['targets']:
                range_match = target.get('range', '999km').replace('km', '')
                try:
                    range_val = float(range_match)
                    if range_val < closest_range:
                        closest_range = range_val
                        primary_target = target
                except:
                    pass
        
        # Return LoCrypt-compatible format
        key_metrics = {
            'radarId': data.get('radarId', 'RADAR-ALPHA-001') if data else 'RADAR-ALPHA-001',
            'detections': data.get('detections', 0) if data else 0,
            'range': f"{closest_range}km" if primary_target else (data.get('range', 'N/A') if data else 'N/A'),
            'bearing': primary_target.get('bearing', data.get('bearing', 'N/A')) if primary_target else (data.get('bearing', 'N/A') if data else 'N/A'),
            'altitude': primary_target.get('altitude', data.get('altitude', 'N/A')) if primary_target else (data.get('altitude', 'N/A') if data else 'N/A'),
            'speed': primary_target.get('speed', data.get('speed', 'N/A')) if primary_target else (data.get('speed', 'N/A') if data else 'N/A'),
            'signalStrength': data.get('signalStrength', 0) if data else 0,
            'confidence': data.get('confidence', 'LOW') if data else 'LOW',
            'threatLevel': 'HIGH' if (data and data.get('detections', 0) > 2) else 'MEDIUM' if (data and data.get('detections', 0) > 0) else 'LOW',
            'timestamp': data.get('timestamp') if data else datetime.utcnow().isoformat(),
            'targets_detail': data.get('targets', []) if data else []
        }
        
        return key_metrics
    except Exception as e:
        logging.error(f"Error getting key metrics: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/predictions/active")
async def get_active_predictions():
    """Get active AI predictions"""
    try:
        predictions = prediction_engine.get_active_predictions()
        return {"predictions": predictions}
    except Exception as e:
        logging.error(f"Error getting predictions: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/predictions/history")
async def get_prediction_history(limit: int = 10):
    """Get prediction history with results"""
    try:
        history = prediction_engine.get_recent_results(limit)
        return {"history": history}
    except Exception as e:
        logging.error(f"Error getting prediction history: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/predictions/stats")
async def get_prediction_stats():
    """Get prediction statistics and accuracy"""
    try:
        stats = prediction_engine.get_stats()
        return stats
    except Exception as e:
        logging.error(f"Error getting prediction stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/predictions/set-timeline")
async def set_prediction_timeline(seconds: int):
    """Set prediction timeline (5-120 seconds)"""
    try:
        prediction_engine.set_prediction_timeline(seconds)
        return {"success": True, "timeline": prediction_engine.prediction_timeline}
    except Exception as e:
        logging.error(f"Error setting timeline: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/gateway/logs")
async def get_logs(limit: int = 100):
    """Get recent log entries"""
    try:
        logs = await db.published_data.find({}, {"_id": 0}).sort("timestamp", -1).to_list(limit)
        return {"logs": logs, "count": len(logs)}
    except Exception as e:
        logging.error(f"Error getting logs: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/gateway/current-data")
async def get_current_data():
    """Get current radar data for real-time display"""
    try:
        status = gateway_manager.get_status()
        return {
            "current_data": status.get('last_published_data'),
            "stats": status.get('stats'),
            "is_running": status.get('is_running'),
            "radar_status": status.get('radar_status')
        }
    except Exception as e:
        logging.error(f"Error getting current data: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/danger-zones/calculate")
async def calculate_danger_zones(timeline_minutes: int = 5):
    """Calculate danger zones for next N minutes"""
    try:
        status = gateway_manager.get_status()
        current_data = status.get('last_published_data')
        
        pred_list = []
        for pred_id, pred in prediction_engine.predictions.items():
            pred_list.append({
                'id': pred_id,
                'type': pred['type'],
                'message': pred['message'],
                'confidence': pred['confidence'],
                'seconds_remaining': int((pred['expected_time'] - datetime.utcnow()).total_seconds()),
                'sector': pred.get('sector', 'N')
            })
        
        zones = danger_zone_predictor.calculate_danger_zones(pred_list, current_data, timeline_minutes)
        return {"zones": zones, "count": len(zones), "base_location": danger_zone_predictor.base_location}
    except Exception as e:
        logging.error(f"Error calculating danger zones: {e}")
        raise HTTPException(status_code=500, detail=str(e))

class LocryptShareRequest(BaseModel):
    group_id: str
    group_name: str
    sos: bool = False
    radius_km: float = 5.0

@api_router.post("/locrypt/share-danger-zones")
async def share_to_locrypt(request: LocryptShareRequest):
    """Share danger zone alert to LoCrypt group"""
    try:
        status = gateway_manager.get_status()
        current_data = status.get('last_published_data')
        
        pred_list = []
        for pred_id, pred in prediction_engine.predictions.items():
            pred_list.append({
                'id': pred_id,
                'type': pred['type'],
                'message': pred['message'],
                'confidence': pred['confidence'],
                'seconds_remaining': int((pred['expected_time'] - datetime.utcnow()).total_seconds()),
                'sector': pred.get('sector', 'N')
            })
        
        zones = danger_zone_predictor.calculate_danger_zones(pred_list, current_data, 5)
        formatted_data = danger_zone_predictor.format_for_locrypt(zones, request.sos, request.group_name)
        
        logging.info(f"Sharing to LoCrypt {request.group_name}: {len(zones)} zones, SOS={request.sos}")
        
        doc = {
            'id': str(uuid.uuid4()),
            'type': 'locrypt_danger_alert',
            'group_id': request.group_id,
            'group_name': request.group_name,
            'sos': request.sos,
            'message': formatted_data['message_text'],
            'danger_zones': zones,
            'timestamp': datetime.utcnow().isoformat()
        }
        await db.locrypt_alerts.insert_one(doc)
        
        return {
            "success": True, 
            "message": f"Alert shared to {request.group_name}",
            "zones_shared": len(zones),
            "sos": request.sos,
            "preview": formatted_data['message_text']
        }
    except Exception as e:
        logging.error(f"Error sharing: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/locrypt/groups")
async def get_locrypt_groups():
    """Get available LoCrypt groups"""
    return {
        "groups": [
            {"id": "grp_001", "name": "Emergency Response Team", "members": 12},
            {"id": "grp_002", "name": "Security Operations", "members": 8},
            {"id": "grp_003", "name": "Airport Control Tower", "members": 5},
            {"id": "grp_004", "name": "Military Command", "members": 15},
            {"id": "grp_005", "name": "Police Dispatch", "members": 20}
        ]
    }

@api_router.post("/gateway/toggle-mock")
async def toggle_mock_mode(enable: bool = True):
    """Toggle mock radar mode"""
    try:
        # Update config to use mock radar
        current_config = gateway_manager.get_config()
        current_config['radar']['type'] = 'mock' if enable else current_config['radar'].get('type', 'mock')
        gateway_manager.update_config(current_config)
        
        # Restart if running
        if gateway_manager.is_running:
            await gateway_manager.stop()
            await asyncio.sleep(1)
            await gateway_manager.start()
        
        return {"success": True, "message": f"Mock mode {'enabled' if enable else 'disabled'}"}
    except Exception as e:
        logging.error(f"Error toggling mock mode: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============= Legacy Endpoints =============

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    _ = await db.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    
    return status_checks

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()