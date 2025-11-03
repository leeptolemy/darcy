from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone

# Import gateway manager
from gateway_manager import gateway_manager

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
        if 'locrypt' in config and 'gateway_token' in config['locrypt']:
            token = config['locrypt']['gateway_token']
            if token:
                config['locrypt']['gateway_token'] = token[:10] + "..." if len(token) > 10 else "***"
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

@api_router.post("/gateway/test-locrypt")
async def test_locrypt():
    """Test LoCrypt connection"""
    try:
        result = await gateway_manager.test_locrypt_connection()
        return result
    except Exception as e:
        logging.error(f"Error testing LoCrypt: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/gateway/health")
async def health_check():
    """Health check endpoint for LoCrypt"""
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

@api_router.post("/gateway/publish-data")
async def publish_data(request: GatewayPublishRequest):
    """
    LoCrypt gateway endpoint for publishing sensor data
    This is the endpoint that the app publishes TO (simulated)
    """
    try:
        # Validate gateway token (in production, check against database)
        if not request.gateway_token:
            raise HTTPException(status_code=401, detail="Invalid gateway token")
        
        # Log the received data
        logging.info(f"Received radar data: {request.encrypted_data[:100]}...")
        
        # Store in MongoDB
        doc = {
            'id': str(uuid.uuid4()),
            'gateway_token': request.gateway_token[:10] + "...",  # Masked
            'data': request.encrypted_data,
            'data_type': request.data_type,
            'timestamp': datetime.utcnow().isoformat()
        }
        await db.published_data.insert_one(doc)
        
        return {"message": "Sensor data published successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error publishing data: {e}")
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