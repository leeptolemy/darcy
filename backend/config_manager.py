import os
import json
import yaml
import logging
from typing import Dict, Any, Optional
from pathlib import Path
from cryptography.fernet import Fernet
import base64

logger = logging.getLogger(__name__)

class ConfigManager:
    """Manage application configuration with encryption support"""
    
    def __init__(self, config_path: str = "config.yaml"):
        self.config_path = Path(config_path)
        self.config: Dict[str, Any] = {}
        self.encryption_key = self._get_or_create_key()
        self.cipher = Fernet(self.encryption_key)
        
    def _get_or_create_key(self) -> bytes:
        """Get or create encryption key"""
        key_file = Path(".encryption_key")
        
        if key_file.exists():
            with open(key_file, 'rb') as f:
                return f.read()
        else:
            key = Fernet.generate_key()
            with open(key_file, 'wb') as f:
                f.write(key)
            return key
            
    def encrypt_value(self, value: str) -> str:
        """Encrypt a sensitive value"""
        encrypted = self.cipher.encrypt(value.encode())
        return f"encrypted:{base64.b64encode(encrypted).decode()}"
        
    def decrypt_value(self, encrypted_value: str) -> str:
        """Decrypt a sensitive value"""
        if not encrypted_value.startswith('encrypted:'):
            return encrypted_value  # Not encrypted
            
        try:
            encrypted_part = encrypted_value.replace('encrypted:', '')
            encrypted_bytes = base64.b64decode(encrypted_part)
            decrypted = self.cipher.decrypt(encrypted_bytes)
            return decrypted.decode()
        except Exception as e:
            logger.error(f"Decryption failed: {e}")
            return encrypted_value
            
    def load_config(self) -> Dict[str, Any]:
        """Load configuration from file"""
        
        if not self.config_path.exists():
            logger.warning(f"Config file not found: {self.config_path}")
            return self._get_default_config()
            
        try:
            with open(self.config_path, 'r') as f:
                self.config = yaml.safe_load(f) or {}
                
            # Decrypt sensitive values
            if 'locrypt' in self.config and 'gateway_token' in self.config['locrypt']:
                token = self.config['locrypt']['gateway_token']
                self.config['locrypt']['gateway_token'] = self.decrypt_value(token)
                
            logger.info("Configuration loaded successfully")
            return self.config
            
        except Exception as e:
            logger.error(f"Failed to load config: {e}")
            return self._get_default_config()
            
    def save_config(self, config: Dict[str, Any]):
        """Save configuration to file"""
        
        try:
            # Encrypt sensitive values before saving
            config_to_save = config.copy()
            
            if 'locrypt' in config_to_save and 'gateway_token' in config_to_save['locrypt']:
                token = config_to_save['locrypt']['gateway_token']
                if not token.startswith('encrypted:'):
                    config_to_save['locrypt']['gateway_token'] = self.encrypt_value(token)
                    
            with open(self.config_path, 'w') as f:
                yaml.dump(config_to_save, f, default_flow_style=False)
                
            self.config = config
            logger.info("Configuration saved successfully")
            
        except Exception as e:
            logger.error(f"Failed to save config: {e}")
            raise
            
    def _get_default_config(self) -> Dict[str, Any]:
        """Get default configuration"""
        return {
            'locrypt': {
                'backend_url': 'https://api.locrypt.example.com',
                'gateway_token': ''
            },
            'radar': {
                'type': 'mock',  # mock, serial, tcp, usb, file
                'connection': {
                    'port': '/dev/ttyUSB0',
                    'baudrate': 9600,
                    'timeout': 5
                }
            },
            'publishing': {
                'mode': 'on_detection',  # on_detection, periodic, change_based, manual
                'interval': 30,
                'retry_attempts': 3
            },
            'radar_data': {
                'station_id': 'RADAR-ALPHA-01',
                'station_name': 'North Sector Radar',
                'anonymize': True
            },
            'logging': {
                'level': 'INFO',
                'file': 'logs/radar_gateway.log',
                'max_size': '10MB'
            }
        }
        
    def get(self, key: str, default: Any = None) -> Any:
        """Get configuration value"""
        keys = key.split('.')
        value = self.config
        
        for k in keys:
            if isinstance(value, dict):
                value = value.get(k)
                if value is None:
                    return default
            else:
                return default
                
        return value
        
    def set(self, key: str, value: Any):
        """Set configuration value"""
        keys = key.split('.')
        config = self.config
        
        for k in keys[:-1]:
            if k not in config:
                config[k] = {}
            config = config[k]
            
        config[keys[-1]] = value
