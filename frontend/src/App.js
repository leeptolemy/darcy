import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Activity, Radio, Cloud, Settings, PlayCircle, StopCircle, AlertCircle, CheckCircle, Send, FileText, Shield, Radar } from 'lucide-react';
import '@/App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
const API = `${BACKEND_URL}/api`;

// Military Tactical Color Palette
const DARCY_COLORS = {
  primary: '#0A1628',        // Very dark navy
  secondary: '#132B47',      // Dark navy blue (from logo)
  accent: '#1E4A6F',         // Medium navy
  teal: '#00D9FF',          // Bright tactical teal (radar color)
  tealDark: '#00A8CC',      // Dark teal
  surface: '#0D1B2A',        // Surface dark
  border: '#1E3A5F',         // Border color
  text: '#E8F4F8',          // Off-white text
  textMuted: '#8BA3B8',     // Muted text
  success: '#00FF87',        // Bright green (military)
  warning: '#FFB800',        // Amber warning
  error: '#FF3366',          // Red alert
  info: '#00D9FF',          // Info teal
  gridLine: 'rgba(0, 217, 255, 0.15)', // Subtle grid lines
  glowTeal: 'rgba(0, 217, 255, 0.3)'   // Glow effect
};

function App() {
  const [activeView, setActiveView] = useState('dashboard');
  const [status, setStatus] = useState(null);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    fetchStatus();
    fetchConfig();
    fetchLogs();

    const interval = setInterval(() => {
      if (activeView === 'dashboard') {
        fetchStatus();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [activeView]);

  const fetchStatus = async () => {
    try {
      const response = await axios.get(`${API}/gateway/status`);
      setStatus(response.data);
    } catch (error) {
      console.error('Error fetching status:', error);
    }
  };

  const fetchConfig = async () => {
    try {
      const response = await axios.get(`${API}/gateway/config`);
      setConfig(response.data);
    } catch (error) {
      console.error('Error fetching config:', error);
    }
  };

  const fetchLogs = async () => {
    try {
      const response = await axios.get(`${API}/gateway/logs?limit=50`);
      setLogs(response.data.logs || []);
    } catch (error) {
      console.error('Error fetching logs:', error);
    }
  };

  const startGateway = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API}/gateway/start`);
      if (response.data.success) {
        showNotification('Gateway Started', 'Radar monitoring is now active');
        fetchStatus();
      }
    } catch (error) {
      showNotification('Error', error.response?.data?.detail || 'Failed to start gateway');
    }
    setLoading(false);
  };

  const stopGateway = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API}/gateway/stop`);
      if (response.data.success) {
        showNotification('Gateway Stopped', 'Radar monitoring has been stopped');
        fetchStatus();
      }
    } catch (error) {
      showNotification('Error', error.response?.data?.detail || 'Failed to stop gateway');
    }
    setLoading(false);
  };

  const manualPublish = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API}/gateway/publish-manual`);
      if (response.data.success) {
        showNotification('Data Published', 'Manual publish successful');
      } else {
        showNotification('Publish Failed', response.data.message);
      }
    } catch (error) {
      showNotification('Error', error.response?.data?.detail || 'Failed to publish');
    }
    setLoading(false);
  };

  const testRadar = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API}/gateway/test-radar`);
      if (response.data.success) {
        showNotification('Radar Test Passed', response.data.message);
      } else {
        showNotification('Radar Test Failed', response.data.message);
      }
    } catch (error) {
      showNotification('Error', 'Radar test failed');
    }
    setLoading(false);
  };

  const testDarcy = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API}/gateway/test-darcy`);
      if (response.data.success) {
        showNotification('Darcy Test Passed', response.data.message);
      } else {
        showNotification('Darcy Test Failed', response.data.message);
      }
    } catch (error) {
      showNotification('Error', 'Darcy test failed');
    }
    setLoading(false);
  };

  const saveConfig = async (newConfig) => {
    setLoading(true);
    try {
      await axios.post(`${API}/gateway/config`, { config: newConfig });
      showNotification('Config Saved', 'Configuration updated successfully');
      fetchConfig();
    } catch (error) {
      showNotification('Error', 'Failed to save configuration');
    }
    setLoading(false);
  };

  const showNotification = (title, message) => {
    if (window.electronAPI) {
      window.electronAPI.showNotification(title, message);
    } else {
      alert(`${title}: ${message}`);
    }
  };

  const getStatusColor = () => {
    if (!status) return DARCY_COLORS.textMuted;
    if (status.is_running && status.radar_status === 'monitoring') return DARCY_COLORS.success;
    if (status.is_running) return DARCY_COLORS.warning;
    return DARCY_COLORS.error;
  };

  const getStatusText = () => {
    if (!status) return 'UNKNOWN';
    if (status.is_running && status.radar_status === 'monitoring') return 'ACTIVE';
    if (status.is_running) return 'STANDBY';
    return 'OFFLINE';
  };

  return (
    <div className="flex h-screen" style={{ backgroundColor: DARCY_COLORS.primary, color: DARCY_COLORS.text, fontFamily: 'monospace' }}>
      {/* Tactical Header Bar */}
      <div className="fixed top-0 left-0 right-0 z-50" style={{ 
        backgroundColor: DARCY_COLORS.secondary,
        borderBottom: `2px solid ${DARCY_COLORS.teal}`,
        boxShadow: `0 0 20px ${DARCY_COLORS.glowTeal}`
      }}>
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-4">
            {/* Logo and Branding */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ 
                  backgroundColor: DARCY_COLORS.teal,
                  boxShadow: `0 0 15px ${DARCY_COLORS.teal}`
                }}>
                  <Radar size={28} style={{ color: DARCY_COLORS.primary }} strokeWidth={2.5} />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor: DARCY_COLORS.success }}></div>
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-wider" style={{ 
                  color: DARCY_COLORS.teal,
                  textShadow: `0 0 10px ${DARCY_COLORS.glowTeal}`,
                  letterSpacing: '0.15em'
                }}>DARCY</h1>
                <p className="text-xs tracking-wide" style={{ color: DARCY_COLORS.textMuted, letterSpacing: '0.1em' }}>DRONE RADAR CONTROL SYSTEM</p>
              </div>
            </div>
            
            {/* Status Indicator */}
            <div className="ml-8 px-4 py-2 rounded" style={{ 
              backgroundColor: 'rgba(0, 217, 255, 0.1)',
              border: `1px solid ${DARCY_COLORS.teal}`
            }}>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: getStatusColor() }}></div>
                <span className="text-xs font-bold tracking-wider" style={{ color: getStatusColor() }}>
                  {getStatusText()}
                </span>
              </div>
            </div>
          </div>

          {/* System Info */}
          <div className="flex items-center gap-6 text-xs" style={{ color: DARCY_COLORS.textMuted }}>
            <div className="flex items-center gap-2">
              <Shield size={14} style={{ color: DARCY_COLORS.teal }} />
              <span>SECURE CONNECTION</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: DARCY_COLORS.success }}></div>
              <span>SYSTEMS NOMINAL</span>
            </div>
            <div>{new Date().toLocaleTimeString('en-US', { hour12: false })}</div>
          </div>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex w-full" style={{ marginTop: '80px' }}>
        {/* Sidebar */}
        <div className="w-64" style={{ 
          backgroundColor: DARCY_COLORS.secondary,
          borderRight: `1px solid ${DARCY_COLORS.border}`
        }}>
          <nav className="p-4 space-y-2">
            <NavButton 
              active={activeView === 'dashboard'} 
              onClick={() => setActiveView('dashboard')}
              icon={Activity}
              label="TACTICAL DASHBOARD"
              colors={DARCY_COLORS}
              testId="nav-dashboard"
            />
            
            <NavButton 
              active={activeView === 'config'} 
              onClick={() => setActiveView('config')}
              icon={Settings}
              label="SYSTEM CONFIG"
              colors={DARCY_COLORS}
              testId="nav-config"
            />
            
            <NavButton 
              active={activeView === 'logs'} 
              onClick={() => setActiveView('logs')}
              icon={FileText}
              label="ACTIVITY LOG"
              colors={DARCY_COLORS}
              testId="nav-logs"
            />
          </nav>

          {/* Sidebar Footer */}
          <div className="absolute bottom-0 left-0 right-0 w-64 p-4 text-xs" style={{ 
            borderTop: `1px solid ${DARCY_COLORS.border}`,
            backgroundColor: DARCY_COLORS.primary
          }}>
            <div className="space-y-1" style={{ color: DARCY_COLORS.textMuted }}>
              <div className="flex justify-between">
                <span>VERSION</span>
                <span style={{ color: DARCY_COLORS.teal }}>1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span>BUILD</span>
                <span style={{ color: DARCY_COLORS.teal }}>2025.11.03</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto" style={{ backgroundColor: DARCY_COLORS.primary }}>
          {activeView === 'dashboard' && (
            <Dashboard
              status={status}
              loading={loading}
              getStatusColor={getStatusColor}
              getStatusText={getStatusText}
              startGateway={startGateway}
              stopGateway={stopGateway}
              manualPublish={manualPublish}
              testRadar={testRadar}
              testDarcy={testDarcy}
              colors={DARCY_COLORS}
            />
          )}

          {activeView === 'config' && (
            <Configuration
              config={config}
              loading={loading}
              saveConfig={saveConfig}
              testRadar={testRadar}
              testDarcy={testDarcy}
              colors={DARCY_COLORS}
            />
          )}

          {activeView === 'logs' && <LogsView logs={logs} fetchLogs={fetchLogs} colors={DARCY_COLORS} />}
        </div>
      </div>
    </div>
  );
}

function NavButton({ active, onClick, icon: Icon, label, colors, testId }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 rounded font-medium transition-all text-xs tracking-wider"
      style={{
        backgroundColor: active ? colors.accent : 'transparent',
        color: active ? colors.teal : colors.text,
        border: `1px solid ${active ? colors.teal : 'transparent'}`,
        boxShadow: active ? `0 0 10px ${colors.glowTeal}` : 'none'
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.backgroundColor = colors.surface;
          e.currentTarget.style.borderColor = colors.border;
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.borderColor = 'transparent';
        }
      }}
      data-testid={testId}
    >
      <Icon size={18} />
      <span>{label}</span>
    </button>
  );
}

function Dashboard({ status, loading, getStatusColor, getStatusText, startGateway, stopGateway, manualPublish, testRadar, testDarcy, colors }) {
  return (
    <div className="p-6 space-y-6">
      {/* Main Status Grid */}
      <div className="grid grid-cols-3 gap-4">
        <TacticalCard title="GATEWAY STATUS" colors={colors}>
          <div className="flex items-center justify-between mb-3">
            <div className="w-4 h-4 rounded-full animate-pulse" style={{ backgroundColor: getStatusColor() }}></div>
            <div className="text-xs" style={{ color: colors.textMuted }}>SYSTEM ID: GW-001</div>
          </div>
          <p className="text-3xl font-bold tracking-wider" data-testid="gateway-status" style={{ color: getStatusColor() }}>
            {getStatusText()}
          </p>
        </TacticalCard>

        <TacticalCard title="RADAR STATUS" colors={colors}>
          <div className="flex items-center justify-between mb-3">
            {status?.radar_status === 'monitoring' ? (
              <CheckCircle style={{ color: colors.success }} size={20} />
            ) : (
              <AlertCircle style={{ color: colors.error }} size={20} />
            )}
            <div className="text-xs" style={{ color: colors.textMuted }}>RADAR ID: RDR-ALPHA</div>
          </div>
          <p className="text-3xl font-bold tracking-wider capitalize" data-testid="radar-status" style={{ color: status?.radar_status === 'monitoring' ? colors.success : colors.error }}>
            {status?.radar_status || 'OFFLINE'}
          </p>
        </TacticalCard>

        <TacticalCard title="DARCY GATEWAY" colors={colors}>
          <div className="flex items-center justify-between mb-3">
            {status?.darcy_connected ? (
              <Cloud style={{ color: colors.info }} size={20} />
            ) : (
              <AlertCircle style={{ color: colors.warning }} size={20} />
            )}
            <div className="text-xs" style={{ color: colors.textMuted }}>ENCRYPTED LINK</div>
          </div>
          <p className="text-3xl font-bold tracking-wider" style={{ color: status?.darcy_connected ? colors.info : colors.warning }}>
            {status?.darcy_connected ? 'LINKED' : 'STANDBY'}
          </p>
        </TacticalCard>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-4 gap-4">
        <TacticalStatCard 
          title="DETECTIONS" 
          value={status?.stats?.detections_total || 0} 
          unit="TARGETS"
          colors={colors} 
        />
        <TacticalStatCard 
          title="PUBLISHED" 
          value={status?.stats?.published_total || 0} 
          unit="TRANSMISSIONS"
          colors={colors} 
        />
        <TacticalStatCard 
          title="ERRORS" 
          value={status?.stats?.errors_total || 0} 
          unit="INCIDENTS"
          valueColor={colors.error}
          colors={colors} 
        />
        <TacticalStatCard 
          title="UPTIME" 
          value={status?.uptime ? formatUptime(status.uptime) : 'N/A'} 
          unit="RUNTIME"
          isText
          colors={colors} 
        />
      </div>

      {/* Control Panel */}
      <TacticalCard title="MISSION CONTROL" colors={colors}>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {!status?.is_running ? (
            <TacticalButton
              onClick={startGateway}
              disabled={loading}
              color={colors.success}
              icon={PlayCircle}
              label="START"
              testId="start-button"
            />
          ) : (
            <TacticalButton
              onClick={stopGateway}
              disabled={loading}
              color={colors.error}
              icon={StopCircle}
              label="STOP"
              testId="stop-button"
            />
          )}

          <TacticalButton
            onClick={manualPublish}
            disabled={loading || !status?.is_running}
            color={colors.info}
            icon={Send}
            label="PUBLISH"
            testId="manual-publish-button"
          />

          <TacticalButton
            onClick={testRadar}
            disabled={loading}
            color={colors.warning}
            icon={Radio}
            label="TEST RADAR"
            testId="test-radar-button"
          />

          <TacticalButton
            onClick={testDarcy}
            disabled={loading}
            color={colors.teal}
            icon={Cloud}
            label="TEST DARCY"
            testId="test-darcy-button"
          />
        </div>
      </TacticalCard>

      {/* Detection Data */}
      {status?.last_published_data && (
        <TacticalCard title="LAST DETECTION DATA" colors={colors}>
          <div className="grid grid-cols-4 gap-6">
            <DataField label="TARGETS" value={status.last_published_data.detections} colors={colors} />
            <DataField label="RANGE" value={status.last_published_data.range} colors={colors} />
            <DataField label="BEARING" value={status.last_published_data.bearing} colors={colors} />
            <DataField label="ALTITUDE" value={status.last_published_data.altitude} colors={colors} />
            <DataField label="SPEED" value={status.last_published_data.speed} colors={colors} />
            <DataField label="CONFIDENCE" value={status.last_published_data.confidence} colors={colors} />
            <DataField label="SIGNAL" value={`${status.last_published_data.signalStrength}%`} colors={colors} />
            <DataField
              label="TIMESTAMP"
              value={new Date(status.last_published_data.timestamp).toLocaleTimeString()}
              colors={colors}
            />
          </div>
        </TacticalCard>
      )}
    </div>
  );
}

function Configuration({ config, loading, saveConfig, testRadar, testDarcy, colors }) {
  const [localConfig, setLocalConfig] = useState(config);

  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  const handleSave = () => {
    saveConfig(localConfig);
  };

  const updateNestedValue = (path, value) => {
    const keys = path.split('.');
    const newConfig = JSON.parse(JSON.stringify(localConfig));
    let current = newConfig;

    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }

    current[keys[keys.length - 1]] = value;
    setLocalConfig(newConfig);
  };

  if (!localConfig) {
    return (
      <div className="p-6">
        <p style={{ color: colors.text }}>LOADING CONFIGURATION...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <TacticalCard title="DARCY GATEWAY CONFIGURATION" colors={colors}>
        <div className="space-y-4">
          <TacticalInput
            label="BACKEND URL"
            value={localConfig.darcy?.backend_url || ''}
            onChange={(e) => updateNestedValue('darcy.backend_url', e.target.value)}
            placeholder="https://api.darcy.example.com"
            colors={colors}
            testId="darcy-url-input"
          />

          <TacticalInput
            label="GATEWAY TOKEN"
            type="password"
            value={localConfig.darcy?.gateway_token || ''}
            onChange={(e) => updateNestedValue('darcy.gateway_token', e.target.value)}
            placeholder="Enter encrypted gateway token"
            colors={colors}
            testId="gateway-token-input"
          />

          <TacticalButton
            onClick={testDarcy}
            disabled={loading}
            color={colors.teal}
            icon={Cloud}
            label="TEST CONNECTION"
          />
        </div>
      </TacticalCard>

      <TacticalCard title="RADAR SYSTEM CONFIGURATION" colors={colors}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold mb-2 tracking-wider" style={{ color: colors.teal }}>RADAR TYPE</label>
            <select
              value={localConfig.radar?.type || 'mock'}
              onChange={(e) => updateNestedValue('radar.type', e.target.value)}
              className="w-full px-4 py-2 rounded font-mono text-sm"
              style={{
                backgroundColor: colors.surface,
                border: `1px solid ${colors.border}`,
                color: colors.text
              }}
              data-testid="radar-type-select"
            >
              <option value="mock">MOCK (TESTING)</option>
              <option value="serial">SERIAL PORT (RS-232/485)</option>
              <option value="tcp">TCP/IP SOCKET</option>
              <option value="file">FILE INPUT</option>
            </select>
          </div>

          {localConfig.radar?.type === 'serial' && (
            <>
              <TacticalInput
                label="SERIAL PORT"
                value={localConfig.radar?.connection?.port || ''}
                onChange={(e) => updateNestedValue('radar.connection.port', e.target.value)}
                placeholder="/dev/ttyUSB0 or COM3"
                colors={colors}
              />

              <div>
                <label className="block text-xs font-bold mb-2 tracking-wider" style={{ color: colors.teal }}>BAUD RATE</label>
                <select
                  value={localConfig.radar?.connection?.baudrate || 9600}
                  onChange={(e) => updateNestedValue('radar.connection.baudrate', parseInt(e.target.value))}
                  className="w-full px-4 py-2 rounded font-mono text-sm"
                  style={{
                    backgroundColor: colors.surface,
                    border: `1px solid ${colors.border}`,
                    color: colors.text
                  }}
                >
                  <option value="9600">9600</option>
                  <option value="19200">19200</option>
                  <option value="38400">38400</option>
                  <option value="57600">57600</option>
                  <option value="115200">115200</option>
                </select>
              </div>
            </>
          )}

          {localConfig.radar?.type === 'tcp' && (
            <>
              <TacticalInput
                label="HOST ADDRESS"
                value={localConfig.radar?.connection?.host || ''}
                onChange={(e) => updateNestedValue('radar.connection.host', e.target.value)}
                placeholder="192.168.1.100"
                colors={colors}
              />

              <TacticalInput
                label="PORT"
                type="number"
                value={localConfig.radar?.connection?.port || 5000}
                onChange={(e) => updateNestedValue('radar.connection.port', parseInt(e.target.value))}
                colors={colors}
              />
            </>
          )}

          {localConfig.radar?.type === 'file' && (
            <TacticalInput
              label="FILE PATH"
              value={localConfig.radar?.connection?.path || ''}
              onChange={(e) => updateNestedValue('radar.connection.path', e.target.value)}
              placeholder="/path/to/radar_data.txt"
              colors={colors}
            />
          )}

          <TacticalButton
            onClick={testRadar}
            disabled={loading}
            color={colors.success}
            icon={Radio}
            label="TEST RADAR CONNECTION"
          />
        </div>
      </TacticalCard>

      <TacticalCard title="PUBLISHING CONFIGURATION" colors={colors}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold mb-2 tracking-wider" style={{ color: colors.teal }}>PUBLISHING MODE</label>
            <select
              value={localConfig.publishing?.mode || 'on_detection'}
              onChange={(e) => updateNestedValue('publishing.mode', e.target.value)}
              className="w-full px-4 py-2 rounded font-mono text-sm"
              style={{
                backgroundColor: colors.surface,
                border: `1px solid ${colors.border}`,
                color: colors.text
              }}
              data-testid="publish-mode-select"
            >
              <option value="on_detection">ON DETECTION (IMMEDIATE)</option>
              <option value="periodic">PERIODIC (TIMED)</option>
              <option value="change_based">CHANGE-BASED</option>
              <option value="manual">MANUAL ONLY</option>
            </select>
          </div>

          {localConfig.publishing?.mode === 'periodic' && (
            <TacticalInput
              label="INTERVAL (SECONDS)"
              type="number"
              value={localConfig.publishing?.interval || 30}
              onChange={(e) => updateNestedValue('publishing.interval', parseInt(e.target.value))}
              min="5"
              max="300"
              colors={colors}
            />
          )}

          <TacticalInput
            label="STATION ID"
            value={localConfig.radar_data?.station_id || ''}
            onChange={(e) => updateNestedValue('radar_data.station_id', e.target.value)}
            placeholder="RADAR-ALPHA-01"
            colors={colors}
          />

          <TacticalInput
            label="STATION NAME"
            value={localConfig.radar_data?.station_name || ''}
            onChange={(e) => updateNestedValue('radar_data.station_name', e.target.value)}
            placeholder="North Sector Radar"
            colors={colors}
          />

          <div className="flex items-center gap-3 px-4 py-3 rounded" style={{ 
            backgroundColor: 'rgba(0, 217, 255, 0.05)',
            border: `1px solid ${colors.border}`
          }}>
            <input
              type="checkbox"
              checked={localConfig.radar_data?.anonymize || false}
              onChange={(e) => updateNestedValue('radar_data.anonymize', e.target.checked)}
              className="w-5 h-5"
            />
            <label className="text-sm font-mono" style={{ color: colors.text }}>ANONYMIZE STATION ID (RECOMMENDED)</label>
          </div>
        </div>
      </TacticalCard>

      <button
        onClick={handleSave}
        disabled={loading}
        className="w-full px-6 py-4 rounded font-bold text-sm tracking-widest transition-all disabled:opacity-50"
        style={{
          backgroundColor: colors.teal,
          color: colors.primary,
          border: `2px solid ${colors.teal}`,
          boxShadow: `0 0 20px ${colors.glowTeal}`
        }}
        data-testid="save-config-button"
      >
        SAVE CONFIGURATION
      </button>
    </div>
  );
}

function LogsView({ logs, fetchLogs, colors }) {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-wider" style={{ color: colors.teal }}>ACTIVITY LOG</h2>
        <button
          onClick={fetchLogs}
          className="px-4 py-2 rounded font-mono text-xs tracking-wider transition-all"
          style={{
            backgroundColor: colors.accent,
            color: colors.teal,
            border: `1px solid ${colors.teal}`
          }}
        >
          REFRESH
        </button>
      </div>

      <TacticalCard title="TRANSMISSION LOG" colors={colors}>
        <div className="overflow-x-auto">
          <table className="w-full font-mono text-xs">
            <thead style={{ borderBottom: `2px solid ${colors.border}` }}>
              <tr>
                <th className="px-4 py-3 text-left tracking-wider" style={{ color: colors.teal }}>TIMESTAMP</th>
                <th className="px-4 py-3 text-left tracking-wider" style={{ color: colors.teal }}>TYPE</th>
                <th className="px-4 py-3 text-left tracking-wider" style={{ color: colors.teal }}>DATA PREVIEW</th>
                <th className="px-4 py-3 text-left tracking-wider" style={{ color: colors.teal }}>TOKEN</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-4 py-8 text-center" style={{ color: colors.textMuted }}>
                    NO LOGS AVAILABLE
                  </td>
                </tr>
              ) : (
                logs.map((log, index) => (
                  <tr key={index} style={{ borderBottom: `1px solid ${colors.border}` }}>
                    <td className="px-4 py-3" style={{ color: colors.text }}>
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="px-2 py-1 rounded text-xs font-bold"
                        style={{ backgroundColor: colors.teal, color: colors.primary }}
                      >
                        {log.data_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 max-w-md truncate" style={{ color: colors.textMuted }}>
                      {log.data.substring(0, 60)}...
                    </td>
                    <td className="px-4 py-3" style={{ color: colors.textMuted }}>{log.gateway_token}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </TacticalCard>
    </div>
  );
}

function TacticalCard({ title, children, colors }) {
  return (
    <div className="rounded-lg p-6" style={{ 
      backgroundColor: colors.surface,
      border: `1px solid ${colors.border}`,
      boxShadow: `0 0 10px ${colors.gridLine}`
    }}>
      <h3 className="text-sm font-bold mb-4 tracking-widest" style={{ 
        color: colors.teal,
        borderBottom: `2px solid ${colors.border}`,
        paddingBottom: '8px'
      }}>
        {title}
      </h3>
      {children}
    </div>
  );
}

function TacticalStatCard({ title, value, unit, valueColor, isText = false, colors }) {
  return (
    <div className="rounded p-4" style={{ 
      backgroundColor: colors.surface,
      border: `1px solid ${colors.border}`
    }}>
      <p className="text-xs mb-2 tracking-wider" style={{ color: colors.textMuted }}>{title}</p>
      <p className="text-3xl font-bold mb-1" style={{ color: valueColor || colors.teal }} data-testid={`stat-${title.toLowerCase()}`}>
        {isText ? value : value.toLocaleString()}
      </p>
      <p className="text-xs tracking-wider" style={{ color: colors.textMuted }}>{unit}</p>
    </div>
  );
}

function TacticalButton({ onClick, disabled, color, icon: Icon, label, testId }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex items-center justify-center gap-2 px-4 py-3 rounded font-bold text-xs tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      style={{
        backgroundColor: 'transparent',
        color: color,
        border: `2px solid ${color}`,
        boxShadow: disabled ? 'none' : `0 0 10px ${color}`
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.backgroundColor = color;
          e.currentTarget.style.color = '#0A1628';
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.color = color;
        }
      }}
      data-testid={testId}
    >
      {Icon && <Icon size={16} />}
      <span>{label}</span>
    </button>
  );
}

function TacticalInput({ label, type = "text", value, onChange, placeholder, colors, testId, ...props }) {
  return (
    <div>
      <label className="block text-xs font-bold mb-2 tracking-wider" style={{ color: colors.teal }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full px-4 py-2 rounded font-mono text-sm focus:outline-none"
        style={{
          backgroundColor: colors.surface,
          border: `1px solid ${colors.border}`,
          color: colors.text,
        }}
        onFocus={(e) => {
          e.target.style.borderColor = colors.teal;
          e.target.style.boxShadow = `0 0 10px ${colors.glowTeal}`;
        }}
        onBlur={(e) => {
          e.target.style.borderColor = colors.border;
          e.target.style.boxShadow = 'none';
        }}
        data-testid={testId}
        {...props}
      />
    </div>
  );
}

function DataField({ label, value, colors }) {
  return (
    <div>
      <p className="text-xs mb-1 tracking-wider" style={{ color: colors.textMuted }}>{label}</p>
      <p className="font-bold text-lg" style={{ color: colors.teal }}>{value || 'N/A'}</p>
    </div>
  );
}

function formatUptime(uptimeStr) {
  const parts = uptimeStr.split(':');
  if (parts.length === 3) {
    const hours = parseInt(parts[0]);
    const minutes = parseInt(parts[1]);
    const seconds = parseInt(parts[2].split('.')[0]);

    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  }
  return uptimeStr;
}

export default App;
