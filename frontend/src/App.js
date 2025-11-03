import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Activity, Radio, Cloud, Settings, PlayCircle, StopCircle, AlertCircle, CheckCircle, Send, FileText } from 'lucide-react';
import '@/App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
const API = `${BACKEND_URL}/api`;

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
    }, 3000); // Refresh every 3 seconds

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

  const testLoCrypt = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API}/gateway/test-locrypt`);
      if (response.data.success) {
        showNotification('LoCrypt Test Passed', response.data.message);
      } else {
        showNotification('LoCrypt Test Failed', response.data.message);
      }
    } catch (error) {
      showNotification('Error', 'LoCrypt test failed');
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
    if (!status) return 'bg-gray-500';
    if (status.is_running && status.radar_status === 'monitoring') return 'bg-green-500';
    if (status.is_running) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getStatusText = () => {
    if (!status) return 'Unknown';
    if (status.is_running && status.radar_status === 'monitoring') return 'Monitoring';
    if (status.is_running) return 'Running';
    return 'Stopped';
  };

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 border-r border-gray-700">
        <div className="p-4 border-b border-gray-700">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Radio className="text-blue-500" />
            Radar Gateway
          </h1>
          <p className="text-xs text-gray-400 mt-1">Drone Detection System</p>
        </div>

        <nav className="p-4 space-y-2">
          <button
            onClick={() => setActiveView('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeView === 'dashboard' ? 'bg-blue-600 text-white' : 'hover:bg-gray-700'
            }`}
            data-testid="nav-dashboard"
          >
            <Activity size={20} />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => setActiveView('config')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeView === 'config' ? 'bg-blue-600 text-white' : 'hover:bg-gray-700'
            }`}
            data-testid="nav-config"
          >
            <Settings size={20} />
            <span>Configuration</span>
          </button>

          <button
            onClick={() => setActiveView('logs')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeView === 'logs' ? 'bg-blue-600 text-white' : 'hover:bg-gray-700'
            }`}
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
            testLoCrypt={testLoCrypt}
          />
        )}

        {activeView === 'config' && (
          <Configuration
            config={config}
            loading={loading}
            saveConfig={saveConfig}
            testRadar={testRadar}
            testLoCrypt={testLoCrypt}
          />
        )}

        {activeView === 'logs' && <LogsView logs={logs} fetchLogs={fetchLogs} />}
      </div>
    </div>
  );
}

function Dashboard({ status, loading, getStatusColor, getStatusText, startGateway, stopGateway, manualPublish, testRadar, testLoCrypt }) {
  return (
    <div className="p-8">
      <div className="mb-6">
        <h2 className="text-3xl font-bold mb-2">Radar Gateway Dashboard</h2>
        <p className="text-gray-400">Real-time monitoring and control</p>
      </div>

      {/* Status Header */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-400">Gateway Status</span>
            <div className={`w-3 h-3 rounded-full ${getStatusColor()} animate-pulse`}></div>
          </div>
          <p className="text-2xl font-bold" data-testid="gateway-status">{getStatusText()}</p>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-400">Radar Status</span>
            {status?.radar_status === 'monitoring' ? (
              <CheckCircle className="text-green-500" size={20} />
            ) : (
              <AlertCircle className="text-red-500" size={20} />
            )}
          </div>
          <p className="text-2xl font-bold capitalize" data-testid="radar-status">
            {status?.radar_status || 'Unknown'}
          </p>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-400">LoCrypt</span>
            {status?.locrypt_connected ? (
              <Cloud className="text-blue-500" size={20} />
            ) : (
              <AlertCircle className="text-yellow-500" size={20} />
            )}
          </div>
          <p className="text-2xl font-bold">
            {status?.locrypt_connected ? 'Connected' : 'Not Configured'}
          </p>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <StatCard title="Detections" value={status?.stats?.detections_total || 0} />
        <StatCard title="Published" value={status?.stats?.published_total || 0} />
        <StatCard title="Errors" value={status?.stats?.errors_total || 0} color="text-red-400" />
        <StatCard
          title="Uptime"
          value={status?.uptime ? formatUptime(status.uptime) : 'N/A'}
          isText
        />
      </div>

      {/* Controls */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-8">
        <h3 className="text-lg font-semibold mb-4">Gateway Controls</h3>
        <div className="flex gap-4">
          {!status?.is_running ? (
            <button
              onClick={startGateway}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              data-testid="start-button"
            >
              <PlayCircle size={20} />
              Start Monitoring
            </button>
          ) : (
            <button
              onClick={stopGateway}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              data-testid="stop-button"
            >
              <StopCircle size={20} />
              Stop Monitoring
            </button>
          )}

          <button
            onClick={manualPublish}
            disabled={loading || !status?.is_running}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            data-testid="manual-publish-button"
          >
            <Send size={20} />
            Manual Publish
          </button>

          <button
            onClick={testRadar}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            data-testid="test-radar-button"
          >
            Test Radar
          </button>

          <button
            onClick={testLoCrypt}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            data-testid="test-locrypt-button"
          >
            Test LoCrypt
          </button>
        </div>
      </div>

      {/* Last Detection */}
      {status?.last_published_data && (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold mb-4">Last Published Data</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <DataField label="Detections" value={status.last_published_data.detections} />
            <DataField label="Range" value={status.last_published_data.range} />
            <DataField label="Bearing" value={status.last_published_data.bearing} />
            <DataField label="Altitude" value={status.last_published_data.altitude} />
            <DataField label="Speed" value={status.last_published_data.speed} />
            <DataField label="Confidence" value={status.last_published_data.confidence} />
            <DataField label="Signal" value={`${status.last_published_data.signalStrength}%`} />
            <DataField
              label="Time"
              value={new Date(status.last_published_data.timestamp).toLocaleTimeString()}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function Configuration({ config, loading, saveConfig, testRadar, testLoCrypt }) {
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
        <p>Loading configuration...</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h2 className="text-3xl font-bold mb-2">Configuration</h2>
        <p className="text-gray-400">Configure radar and LoCrypt settings</p>
      </div>

      <div className="space-y-6">
        {/* LoCrypt Settings */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Cloud size={20} className="text-blue-500" />
            LoCrypt Gateway Settings
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Backend URL</label>
              <input
                type="text"
                value={localConfig.locrypt?.backend_url || ''}
                onChange={(e) => updateNestedValue('locrypt.backend_url', e.target.value)}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="https://api.locrypt.example.com"
                data-testid="locrypt-url-input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Gateway Token</label>
              <input
                type="password"
                value={localConfig.locrypt?.gateway_token || ''}
                onChange={(e) => updateNestedValue('locrypt.gateway_token', e.target.value)}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Enter gateway token"
                data-testid="gateway-token-input"
              />
            </div>

            <button
              onClick={testLoCrypt}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium disabled:opacity-50 transition-colors"
            >
              Test Connection
            </button>
          </div>
        </div>

        {/* Radar Settings */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Radio size={20} className="text-green-500" />
            Radar Settings
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Radar Type</label>
              <select
                value={localConfig.radar?.type || 'mock'}
                onChange={(e) => updateNestedValue('radar.type', e.target.value)}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
                  <label className="block text-sm font-medium mb-2">Serial Port</label>
                  <input
                    type="text"
                    value={localConfig.radar?.connection?.port || ''}
                    onChange={(e) => updateNestedValue('radar.connection.port', e.target.value)}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="/dev/ttyUSB0 or COM3"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Baud Rate</label>
                  <select
                    value={localConfig.radar?.connection?.baudrate || 9600}
                    onChange={(e) => updateNestedValue('radar.connection.baudrate', parseInt(e.target.value))}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
                  <label className="block text-sm font-medium mb-2">Host</label>
                  <input
                    type="text"
                    value={localConfig.radar?.connection?.host || ''}
                    onChange={(e) => updateNestedValue('radar.connection.host', e.target.value)}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="192.168.1.100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Port</label>
                  <input
                    type="number"
                    value={localConfig.radar?.connection?.port || 5000}
                    onChange={(e) => updateNestedValue('radar.connection.port', parseInt(e.target.value))}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </>
            )}

            {localConfig.radar?.type === 'file' && (
              <div>
                <label className="block text-sm font-medium mb-2">File Path</label>
                <input
                  type="text"
                  value={localConfig.radar?.connection?.path || ''}
                  onChange={(e) => updateNestedValue('radar.connection.path', e.target.value)}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="/path/to/radar_data.txt"
                />
              </div>
            )}

            <button
              onClick={testRadar}
              disabled={loading}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-medium disabled:opacity-50 transition-colors"
            >
              Test Radar Connection
            </button>
          </div>
        </div>

        {/* Publishing Settings */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold mb-4">Publishing Settings</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Publishing Mode</label>
              <select
                value={localConfig.publishing?.mode || 'on_detection'}
                onChange={(e) => updateNestedValue('publishing.mode', e.target.value)}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
                <label className="block text-sm font-medium mb-2">Interval (seconds)</label>
                <input
                  type="number"
                  value={localConfig.publishing?.interval || 30}
                  onChange={(e) => updateNestedValue('publishing.interval', parseInt(e.target.value))}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  min="5"
                  max="300"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">Station ID</label>
              <input
                type="text"
                value={localConfig.radar_data?.station_id || ''}
                onChange={(e) => updateNestedValue('radar_data.station_id', e.target.value)}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="RADAR-ALPHA-01"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Station Name</label>
              <input
                type="text"
                value={localConfig.radar_data?.station_name || ''}
                onChange={(e) => updateNestedValue('radar_data.station_name', e.target.value)}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="North Sector Radar"
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={localConfig.radar_data?.anonymize || false}
                onChange={(e) => updateNestedValue('radar_data.anonymize', e.target.checked)}
                className="w-5 h-5 bg-gray-900 border border-gray-700 rounded"
              />
              <label className="text-sm">Anonymize Station ID (recommended)</label>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={loading}
          className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium disabled:opacity-50 transition-colors"
          data-testid="save-config-button"
        >
          Save Configuration
        </button>
      </div>
    </div>
  );
}

function LogsView({ logs, fetchLogs }) {
  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold mb-2">Activity Logs</h2>
          <p className="text-gray-400">Recent publish events</p>
        </div>
        <button
          onClick={fetchLogs}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
        >
          Refresh
        </button>
      </div>

      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-900 border-b border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Timestamp</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Data Preview</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Token</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-gray-400">
                    No logs available
                  </td>
                </tr>
              ) : (
                logs.map((log, index) => (
                  <tr key={index} className="hover:bg-gray-700 transition-colors">
                    <td className="px-6 py-4 text-sm">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="px-2 py-1 bg-blue-900 text-blue-300 rounded text-xs font-medium">
                        {log.data_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-gray-400 max-w-md truncate">
                      {log.data.substring(0, 80)}...
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">{log.gateway_token}</td>
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

function StatCard({ title, value, color = 'text-blue-400', isText = false }) {
  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <p className="text-gray-400 text-sm mb-2">{title}</p>
      <p className={`text-3xl font-bold ${color}`} data-testid={`stat-${title.toLowerCase()}`}>
        {isText ? value : value.toLocaleString()}
      </p>
    </div>
  );
}

function DataField({ label, value }) {
  return (
    <div>
      <p className="text-gray-400 text-xs mb-1">{label}</p>
      <p className="font-medium">{value || 'N/A'}</p>
    </div>
  );
}

function formatUptime(uptimeStr) {
  // Parse uptime string like "0:05:32.123456"
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
