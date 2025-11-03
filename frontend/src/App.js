import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Activity, Radio, Cloud, Settings, PlayCircle, StopCircle, AlertCircle, CheckCircle, Send, FileText } from 'lucide-react';
import '@/App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
const API = `${BACKEND_URL}/api`;

// Darcy Brand Colors (from logo)
const DARCY_COLORS = {
  primary: '#1A2B47',      // Dark Navy Blue
  secondary: '#2A3F5F',    // Lighter Navy
  accent: '#3D5A80',       // Blue accent
  background: '#0F1419',   // Very dark background
  surface: '#1A2332',      // Surface dark
  border: '#2A3F5F',       // Border color
  text: '#F8F7F3',         // Off-white text
  textMuted: '#B8C5D6',    // Muted text
  success: '#4A9B8E',      // Teal green
  warning: '#D4A574',      // Gold
  error: '#C74444',        // Red
  info: '#5B8DBE'          // Light blue
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
    if (!status) return 'Unknown';
    if (status.is_running && status.radar_status === 'monitoring') return 'Monitoring';
    if (status.is_running) return 'Running';
    return 'Stopped';
  };

  return (
    <div className="flex h-screen" style={{ backgroundColor: DARCY_COLORS.background, color: DARCY_COLORS.text }}>
      {/* Sidebar */}
      <div className="w-64" style={{ backgroundColor: DARCY_COLORS.primary, borderRight: `1px solid ${DARCY_COLORS.border}` }}>
        <div className="p-4" style={{ borderBottom: `1px solid ${DARCY_COLORS.border}` }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: DARCY_COLORS.accent }}>
              <Radio size={24} style={{ color: DARCY_COLORS.text }} />
            </div>
            <h1 className="text-xl font-bold">Darcy</h1>
          </div>
          <p className="text-xs" style={{ color: DARCY_COLORS.textMuted }}>Drone Detection Gateway</p>
        </div>

        <nav className="p-4 space-y-2">
          <button
            onClick={() => setActiveView('dashboard')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all"
            style={{
              backgroundColor: activeView === 'dashboard' ? DARCY_COLORS.accent : 'transparent',
              color: DARCY_COLORS.text
            }}
            onMouseEnter={(e) => {
              if (activeView !== 'dashboard') {
                e.target.style.backgroundColor = DARCY_COLORS.secondary;
              }
            }}
            onMouseLeave={(e) => {
              if (activeView !== 'dashboard') {
                e.target.style.backgroundColor = 'transparent';
              }
            }}
            data-testid="nav-dashboard"
          >
            <Activity size={20} />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => setActiveView('config')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all"
            style={{
              backgroundColor: activeView === 'config' ? DARCY_COLORS.accent : 'transparent',
              color: DARCY_COLORS.text
            }}
            onMouseEnter={(e) => {
              if (activeView !== 'config') {
                e.target.style.backgroundColor = DARCY_COLORS.secondary;
              }
            }}
            onMouseLeave={(e) => {
              if (activeView !== 'config') {
                e.target.style.backgroundColor = 'transparent';
              }
            }}
            data-testid="nav-config"
          >
            <Settings size={20} />
            <span>Configuration</span>
          </button>

          <button
            onClick={() => setActiveView('logs')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all"
            style={{
              backgroundColor: activeView === 'logs' ? DARCY_COLORS.accent : 'transparent',
              color: DARCY_COLORS.text
            }}
            onMouseEnter={(e) => {
              if (activeView !== 'logs') {
                e.target.style.backgroundColor = DARCY_COLORS.secondary;
              }
            }}
            onMouseLeave={(e) => {
              if (activeView !== 'logs') {
                e.target.style.backgroundColor = 'transparent';
              }
            }}
            data-testid="nav-logs"
          >
            <FileText size={20} />
            <span>Logs</span>
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
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
  );
}

function Dashboard({ status, loading, getStatusColor, getStatusText, startGateway, stopGateway, manualPublish, testRadar, testDarcy, colors }) {
  return (
    <div className="p-8">
      <div className="mb-6">
        <h2 className="text-3xl font-bold mb-2" style={{ color: colors.text }}>Radar Gateway Dashboard</h2>
        <p style={{ color: colors.textMuted }}>Real-time monitoring and control</p>
      </div>

      {/* Status Header */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="rounded-lg p-6" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
          <div className="flex items-center justify-between mb-3">
            <span style={{ color: colors.textMuted }}>Gateway Status</span>
            <div className="w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor: getStatusColor() }}></div>
          </div>
          <p className="text-2xl font-bold" data-testid="gateway-status" style={{ color: colors.text }}>{getStatusText()}</p>
        </div>

        <div className="rounded-lg p-6" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
          <div className="flex items-center justify-between mb-3">
            <span style={{ color: colors.textMuted }}>Radar Status</span>
            {status?.radar_status === 'monitoring' ? (
              <CheckCircle style={{ color: colors.success }} size={20} />
            ) : (
              <AlertCircle style={{ color: colors.error }} size={20} />
            )}
          </div>
          <p className="text-2xl font-bold capitalize" data-testid="radar-status" style={{ color: colors.text }}>
            {status?.radar_status || 'Unknown'}
          </p>
        </div>

        <div className="rounded-lg p-6" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
          <div className="flex items-center justify-between mb-3">
            <span style={{ color: colors.textMuted }}>Darcy</span>
            {status?.darcy_connected ? (
              <Cloud style={{ color: colors.info }} size={20} />
            ) : (
              <AlertCircle style={{ color: colors.warning }} size={20} />
            )}
          </div>
          <p className="text-2xl font-bold" style={{ color: colors.text }}>
            {status?.darcy_connected ? 'Connected' : 'Not Configured'}
          </p>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <StatCard title="Detections" value={status?.stats?.detections_total || 0} colors={colors} />
        <StatCard title="Published" value={status?.stats?.published_total || 0} colors={colors} />
        <StatCard title="Errors" value={status?.stats?.errors_total || 0} colors={colors} valueColor={colors.error} />
        <StatCard
          title="Uptime"
          value={status?.uptime ? formatUptime(status.uptime) : 'N/A'}
          isText
          colors={colors}
        />
      </div>

      {/* Controls */}
      <div className="rounded-lg p-6 mb-8" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
        <h3 className="text-lg font-semibold mb-4" style={{ color: colors.text }}>Gateway Controls</h3>
        <div className="flex gap-4 flex-wrap">
          {!status?.is_running ? (
            <button
              onClick={startGateway}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              style={{ backgroundColor: colors.success, color: colors.text }}
              data-testid="start-button"
            >
              <PlayCircle size={20} />
              Start Monitoring
            </button>
          ) : (
            <button
              onClick={stopGateway}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              style={{ backgroundColor: colors.error, color: colors.text }}
              data-testid="stop-button"
            >
              <StopCircle size={20} />
              Stop Monitoring
            </button>
          )}

          <button
            onClick={manualPublish}
            disabled={loading || !status?.is_running}
            className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            style={{ backgroundColor: colors.info, color: colors.text }}
            data-testid="manual-publish-button"
          >
            <Send size={20} />
            Manual Publish
          </button>

          <button
            onClick={testRadar}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            style={{ backgroundColor: colors.secondary, color: colors.text }}
            data-testid="test-radar-button"
          >
            Test Radar
          </button>

          <button
            onClick={testDarcy}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            style={{ backgroundColor: colors.secondary, color: colors.text }}
            data-testid="test-darcy-button"
          >
            Test Darcy
          </button>
        </div>
      </div>

      {/* Last Detection */}
      {status?.last_published_data && (
        <div className="rounded-lg p-6" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
          <h3 className="text-lg font-semibold mb-4" style={{ color: colors.text }}>Last Published Data</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <DataField label="Detections" value={status.last_published_data.detections} colors={colors} />
            <DataField label="Range" value={status.last_published_data.range} colors={colors} />
            <DataField label="Bearing" value={status.last_published_data.bearing} colors={colors} />
            <DataField label="Altitude" value={status.last_published_data.altitude} colors={colors} />
            <DataField label="Speed" value={status.last_published_data.speed} colors={colors} />
            <DataField label="Confidence" value={status.last_published_data.confidence} colors={colors} />
            <DataField label="Signal" value={`${status.last_published_data.signalStrength}%`} colors={colors} />
            <DataField
              label="Time"
              value={new Date(status.last_published_data.timestamp).toLocaleTimeString()}
              colors={colors}
            />
          </div>
        </div>
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
      <div className="p-8">
        <p style={{ color: colors.text }}>Loading configuration...</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h2 className="text-3xl font-bold mb-2" style={{ color: colors.text }}>Configuration</h2>
        <p style={{ color: colors.textMuted }}>Configure radar and Darcy gateway settings</p>
      </div>

      <div className="space-y-6">
        {/* Darcy Settings */}
        <div className="rounded-lg p-6" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: colors.text }}>
            <Cloud size={20} style={{ color: colors.info }} />
            Darcy Gateway Settings
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: colors.text }}>Backend URL</label>
              <input
                type="text"
                value={localConfig.darcy?.backend_url || ''}
                onChange={(e) => updateNestedValue('darcy.backend_url', e.target.value)}
                className="w-full px-4 py-2 rounded-lg focus:ring-2 focus:outline-none"
                style={{
                  backgroundColor: colors.background,
                  border: `1px solid ${colors.border}`,
                  color: colors.text,
                  '--tw-ring-color': colors.accent
                }}
                placeholder="https://api.darcy.example.com"
                data-testid="darcy-url-input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: colors.text }}>Gateway Token</label>
              <input
                type="password"
                value={localConfig.darcy?.gateway_token || ''}
                onChange={(e) => updateNestedValue('darcy.gateway_token', e.target.value)}
                className="w-full px-4 py-2 rounded-lg focus:ring-2 focus:outline-none"
                style={{
                  backgroundColor: colors.background,
                  border: `1px solid ${colors.border}`,
                  color: colors.text
                }}
                placeholder="Enter gateway token"
                data-testid="gateway-token-input"
              />
            </div>

            <button
              onClick={testDarcy}
              disabled={loading}
              className="px-4 py-2 rounded-lg font-medium disabled:opacity-50 transition-all"
              style={{ backgroundColor: colors.info, color: colors.text }}
            >
              Test Connection
            </button>
          </div>
        </div>

        {/* Radar Settings */}
        <div className="rounded-lg p-6" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: colors.text }}>
            <Radio size={20} style={{ color: colors.success }} />
            Radar Settings
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: colors.text }}>Radar Type</label>
              <select
                value={localConfig.radar?.type || 'mock'}
                onChange={(e) => updateNestedValue('radar.type', e.target.value)}
                className="w-full px-4 py-2 rounded-lg focus:ring-2 focus:outline-none"
                style={{
                  backgroundColor: colors.background,
                  border: `1px solid ${colors.border}`,
                  color: colors.text
                }}
                data-testid="radar-type-select"
              >
                <option value="mock">Mock (Testing)</option>
                <option value="serial">Serial Port (RS-232/485)</option>
                <option value="tcp">TCP/IP Socket</option>
                <option value="file">File Input</option>
              </select>
            </div>

            {localConfig.radar?.type === 'serial' && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: colors.text }}>Serial Port</label>
                  <input
                    type="text"
                    value={localConfig.radar?.connection?.port || ''}
                    onChange={(e) => updateNestedValue('radar.connection.port', e.target.value)}
                    className="w-full px-4 py-2 rounded-lg"
                    style={{
                      backgroundColor: colors.background,
                      border: `1px solid ${colors.border}`,
                      color: colors.text
                    }}
                    placeholder="/dev/ttyUSB0 or COM3"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: colors.text }}>Baud Rate</label>
                  <select
                    value={localConfig.radar?.connection?.baudrate || 9600}
                    onChange={(e) => updateNestedValue('radar.connection.baudrate', parseInt(e.target.value))}
                    className="w-full px-4 py-2 rounded-lg"
                    style={{
                      backgroundColor: colors.background,
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
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: colors.text }}>Host</label>
                  <input
                    type="text"
                    value={localConfig.radar?.connection?.host || ''}
                    onChange={(e) => updateNestedValue('radar.connection.host', e.target.value)}
                    className="w-full px-4 py-2 rounded-lg"
                    style={{
                      backgroundColor: colors.background,
                      border: `1px solid ${colors.border}`,
                      color: colors.text
                    }}
                    placeholder="192.168.1.100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: colors.text }}>Port</label>
                  <input
                    type="number"
                    value={localConfig.radar?.connection?.port || 5000}
                    onChange={(e) => updateNestedValue('radar.connection.port', parseInt(e.target.value))}
                    className="w-full px-4 py-2 rounded-lg"
                    style={{
                      backgroundColor: colors.background,
                      border: `1px solid ${colors.border}`,
                      color: colors.text
                    }}
                  />
                </div>
              </>
            )}

            {localConfig.radar?.type === 'file' && (
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: colors.text }}>File Path</label>
                <input
                  type="text"
                  value={localConfig.radar?.connection?.path || ''}
                  onChange={(e) => updateNestedValue('radar.connection.path', e.target.value)}
                  className="w-full px-4 py-2 rounded-lg"
                  style={{
                    backgroundColor: colors.background,
                    border: `1px solid ${colors.border}`,
                    color: colors.text
                  }}
                  placeholder="/path/to/radar_data.txt"
                />
              </div>
            )}

            <button
              onClick={testRadar}
              disabled={loading}
              className="px-4 py-2 rounded-lg font-medium disabled:opacity-50 transition-all"
              style={{ backgroundColor: colors.success, color: colors.text }}
            >
              Test Radar Connection
            </button>
          </div>
        </div>

        {/* Publishing Settings */}
        <div className="rounded-lg p-6" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
          <h3 className="text-lg font-semibold mb-4" style={{ color: colors.text }}>Publishing Settings</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: colors.text }}>Publishing Mode</label>
              <select
                value={localConfig.publishing?.mode || 'on_detection'}
                onChange={(e) => updateNestedValue('publishing.mode', e.target.value)}
                className="w-full px-4 py-2 rounded-lg"
                style={{
                  backgroundColor: colors.background,
                  border: `1px solid ${colors.border}`,
                  color: colors.text
                }}
                data-testid="publish-mode-select"
              >
                <option value="on_detection">On Detection (Immediate)</option>
                <option value="periodic">Periodic (Timed)</option>
                <option value="change_based">Change-Based</option>
                <option value="manual">Manual Only</option>
              </select>
            </div>

            {localConfig.publishing?.mode === 'periodic' && (
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: colors.text }}>Interval (seconds)</label>
                <input
                  type="number"
                  value={localConfig.publishing?.interval || 30}
                  onChange={(e) => updateNestedValue('publishing.interval', parseInt(e.target.value))}
                  className="w-full px-4 py-2 rounded-lg"
                  style={{
                    backgroundColor: colors.background,
                    border: `1px solid ${colors.border}`,
                    color: colors.text
                  }}
                  min="5"
                  max="300"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: colors.text }}>Station ID</label>
              <input
                type="text"
                value={localConfig.radar_data?.station_id || ''}
                onChange={(e) => updateNestedValue('radar_data.station_id', e.target.value)}
                className="w-full px-4 py-2 rounded-lg"
                style={{
                  backgroundColor: colors.background,
                  border: `1px solid ${colors.border}`,
                  color: colors.text
                }}
                placeholder="RADAR-ALPHA-01"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: colors.text }}>Station Name</label>
              <input
                type="text"
                value={localConfig.radar_data?.station_name || ''}
                onChange={(e) => updateNestedValue('radar_data.station_name', e.target.value)}
                className="w-full px-4 py-2 rounded-lg"
                style={{
                  backgroundColor: colors.background,
                  border: `1px solid ${colors.border}`,
                  color: colors.text
                }}
                placeholder="North Sector Radar"
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={localConfig.radar_data?.anonymize || false}
                onChange={(e) => updateNestedValue('radar_data.anonymize', e.target.checked)}
                className="w-5 h-5 rounded"
                style={{
                  backgroundColor: colors.background,
                  border: `1px solid ${colors.border}`
                }}
              />
              <label className="text-sm" style={{ color: colors.text }}>Anonymize Station ID (recommended)</label>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={loading}
          className="w-full px-6 py-3 rounded-lg font-medium disabled:opacity-50 transition-all"
          style={{ backgroundColor: colors.accent, color: colors.text }}
          data-testid="save-config-button"
        >
          Save Configuration
        </button>
      </div>
    </div>
  );
}

function LogsView({ logs, fetchLogs, colors }) {
  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold mb-2" style={{ color: colors.text }}>Activity Logs</h2>
          <p style={{ color: colors.textMuted }}>Recent publish events</p>
        </div>
        <button
          onClick={fetchLogs}
          className="px-4 py-2 rounded-lg font-medium transition-all"
          style={{ backgroundColor: colors.accent, color: colors.text }}
        >
          Refresh
        </button>
      </div>

      <div className="rounded-lg overflow-hidden" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead style={{ backgroundColor: colors.primary, borderBottom: `1px solid ${colors.border}` }}>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{ color: colors.textMuted }}>Timestamp</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{ color: colors.textMuted }}>Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{ color: colors.textMuted }}>Data Preview</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{ color: colors.textMuted }}>Token</th>
              </tr>
            </thead>
            <tbody style={{ borderTop: `1px solid ${colors.border}` }}>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center" style={{ color: colors.textMuted }}>
                    No logs available
                  </td>
                </tr>
              ) : (
                logs.map((log, index) => (
                  <tr key={index} style={{ borderBottom: `1px solid ${colors.border}` }}>
                    <td className="px-6 py-4 text-sm" style={{ color: colors.text }}>
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className="px-2 py-1 rounded text-xs font-medium"
                        style={{ backgroundColor: colors.info, color: colors.text }}
                      >
                        {log.data_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-mono max-w-md truncate" style={{ color: colors.textMuted }}>
                      {log.data.substring(0, 80)}...
                    </td>
                    <td className="px-6 py-4 text-sm" style={{ color: colors.textMuted }}>{log.gateway_token}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, valueColor, isText = false, colors }) {
  return (
    <div className="rounded-lg p-6" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
      <p className="text-sm mb-2" style={{ color: colors.textMuted }}>{title}</p>
      <p className="text-3xl font-bold" style={{ color: valueColor || colors.info }} data-testid={`stat-${title.toLowerCase()}`}>
        {isText ? value : value.toLocaleString()}
      </p>
    </div>
  );
}

function DataField({ label, value, colors }) {
  return (
    <div>
      <p className="text-xs mb-1" style={{ color: colors.textMuted }}>{label}</p>
      <p className="font-medium" style={{ color: colors.text }}>{value || 'N/A'}</p>
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
