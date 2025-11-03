import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Activity, Radio, Cloud, Settings, PlayCircle, StopCircle, AlertCircle, CheckCircle, Send, FileText, Shield, Radar, Navigation, MapPin } from 'lucide-react';
import '@/App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
const API = `${BACKEND_URL}/api`;

// Military Tactical Color Palette
const DARCY_COLORS = {
  primary: '#0A1628',
  secondary: '#132B47',
  accent: '#1E4A6F',
  teal: '#00D9FF',
  tealDark: '#00A8CC',
  surface: '#0D1B2A',
  border: '#1E3A5F',
  text: '#E8F4F8',
  textMuted: '#8BA3B8',
  success: '#00FF87',
  warning: '#FFB800',
  error: '#FF3366',
  info: '#00D9FF',
  gridLine: 'rgba(0, 217, 255, 0.15)',
  glowTeal: 'rgba(0, 217, 255, 0.3)'
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
    <div className="p-6 space-y-4">
      {/* Top Row - Status Cards */}
      <div className="grid grid-cols-4 gap-4">
        <TacticalCard title="GATEWAY STATUS" colors={colors}>
          <div className="flex items-center justify-between mb-2">
            <div className="w-4 h-4 rounded-full animate-pulse" style={{ backgroundColor: getStatusColor() }}></div>
            <div className="text-xs" style={{ color: colors.textMuted }}>GW-001</div>
          </div>
          <p className="text-2xl font-bold tracking-wider" data-testid="gateway-status" style={{ color: getStatusColor() }}>
            {getStatusText()}
          </p>
        </TacticalCard>

        <TacticalCard title="RADAR STATUS" colors={colors}>
          <div className="flex items-center justify-between mb-2">
            {status?.radar_status === 'monitoring' ? (
              <CheckCircle style={{ color: colors.success }} size={18} />
            ) : (
              <AlertCircle style={{ color: colors.error }} size={18} />
            )}
            <div className="text-xs" style={{ color: colors.textMuted }}>RDR-ALPHA</div>
          </div>
          <p className="text-2xl font-bold tracking-wider capitalize" data-testid="radar-status" style={{ color: status?.radar_status === 'monitoring' ? colors.success : colors.error }}>
            {status?.radar_status || 'OFFLINE'}
          </p>
        </TacticalCard>

        <TacticalCard title="DARCY GATEWAY" colors={colors}>
          <div className="flex items-center justify-between mb-2">
            {status?.darcy_connected ? (
              <Cloud style={{ color: colors.info }} size={18} />
            ) : (
              <AlertCircle style={{ color: colors.warning }} size={18} />
            )}
            <div className="text-xs" style={{ color: colors.textMuted }}>ENCRYPTED</div>
          </div>
          <p className="text-2xl font-bold tracking-wider" style={{ color: status?.darcy_connected ? colors.info : colors.warning }}>
            {status?.darcy_connected ? 'LINKED' : 'STANDBY'}
          </p>
        </TacticalCard>

        <TacticalCard title="UPTIME" colors={colors}>
          <div className="flex items-center justify-between mb-2">
            <Activity size={18} style={{ color: colors.teal }} />
            <div className="text-xs" style={{ color: colors.textMuted }}>RUNTIME</div>
          </div>
          <p className="text-2xl font-bold tracking-wider" style={{ color: colors.teal }}>
            {status?.uptime ? formatUptime(status.uptime) : 'N/A'}
          </p>
        </TacticalCard>
      </div>

      {/* Main Display Grid */}
      <div className="grid grid-cols-12 gap-4" style={{ height: 'calc(100vh - 300px)' }}>
        {/* Left Column - Charts */}
        <div className="col-span-3 space-y-4">
          <SignalWaveform colors={colors} status={status} />
          <FrequencyChart colors={colors} />
          <LocationDisplay colors={colors} status={status} />
        </div>

        {/* Center - Radar Display */}
        <div className="col-span-6">
          <RadarSweepDisplay colors={colors} status={status} />
        </div>

        {/* Right Column - Data Panels */}
        <div className="col-span-3 space-y-4">
          <TargetList colors={colors} status={status} />
          <AltitudeGraph colors={colors} status={status} />
          <SignalStrengthMeter colors={colors} status={status} />
        </div>
      </div>

      {/* Bottom Row - Statistics and Controls */}
      <div className="grid grid-cols-2 gap-4">
        <TacticalCard title="SENSOR METRICS" colors={colors}>
          <div className="grid grid-cols-3 gap-4">
            <MetricDisplay label="DETECTIONS" value={status?.stats?.detections_total || 0} unit="TARGETS" colors={colors} />
            <MetricDisplay label="PUBLISHED" value={status?.stats?.published_total || 0} unit="MSGS" colors={colors} />
            <MetricDisplay label="ERRORS" value={status?.stats?.errors_total || 0} unit="EVENTS" valueColor={colors.error} colors={colors} />
          </div>
        </TacticalCard>

        <TacticalCard title="MISSION CONTROL" colors={colors}>
          <div className="grid grid-cols-4 gap-2">
            {!status?.is_running ? (
              <TacticalButton
                onClick={startGateway}
                disabled={loading}
                color={colors.success}
                icon={PlayCircle}
                label="START"
                testId="start-button"
                small
              />
            ) : (
              <TacticalButton
                onClick={stopGateway}
                disabled={loading}
                color={colors.error}
                icon={StopCircle}
                label="STOP"
                testId="stop-button"
                small
              />
            )}
            <TacticalButton onClick={manualPublish} disabled={loading || !status?.is_running} color={colors.info} icon={Send} label="PUBLISH" testId="manual-publish-button" small />
            <TacticalButton onClick={testRadar} disabled={loading} color={colors.warning} icon={Radio} label="RADAR" testId="test-radar-button" small />
            <TacticalButton onClick={testDarcy} disabled={loading} color={colors.teal} icon={Cloud} label="DARCY" testId="test-darcy-button" small />
          </div>
        </TacticalCard>
      </div>
    </div>
  );
}

function RadarSweepDisplay({ colors, status }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 20;

    let angle = 0;

    const draw = () => {
      // Clear canvas
      ctx.fillStyle = colors.surface;
      ctx.fillRect(0, 0, width, height);

      // Draw grid lines
      ctx.strokeStyle = colors.gridLine;
      ctx.lineWidth = 1;

      // Draw concentric circles
      for (let i = 1; i <= 4; i++) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, (radius / 4) * i, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Draw crosshairs
      ctx.beginPath();
      ctx.moveTo(centerX - radius, centerY);
      ctx.lineTo(centerX + radius, centerY);
      ctx.moveTo(centerX, centerY - radius);
      ctx.lineTo(centerX, centerY + radius);
      ctx.stroke();

      // Draw range rings text
      ctx.fillStyle = colors.textMuted;
      ctx.font = '10px monospace';
      ctx.fillText('10km', centerX + 5, centerY - (radius / 4) + 5);
      ctx.fillText('20km', centerX + 5, centerY - (radius / 2) + 5);
      ctx.fillText('30km', centerX + 5, centerY - (radius * 3 / 4) + 5);
      ctx.fillText('40km', centerX + 5, centerY - radius + 15);

      // Draw compass directions
      ctx.fillStyle = colors.teal;
      ctx.font = 'bold 12px monospace';
      ctx.fillText('N', centerX - 5, centerY - radius - 5);
      ctx.fillText('E', centerX + radius + 10, centerY + 5);
      ctx.fillText('S', centerX - 5, centerY + radius + 15);
      ctx.fillText('W', centerX - radius - 15, centerY + 5);

      // Draw sweep line (if active)
      if (status?.is_running) {
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(angle);
        
        const gradient = ctx.createLinearGradient(0, 0, 0, -radius);
        gradient.addColorStop(0, 'transparent');
        gradient.addColorStop(0.5, colors.glowTeal);
        gradient.addColorStop(1, colors.teal);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, radius, -Math.PI / 6, Math.PI / 6);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
        
        angle += 0.02;
      }

      // Draw target blips
      if (status?.last_published_data) {
        const bearing = parseFloat(status.last_published_data.bearing) || 45;
        const range = parseFloat(status.last_published_data.range) || 5;
        const maxRange = 50; // km
        
        const blipRadius = (range / maxRange) * radius;
        const blipAngle = (bearing - 90) * (Math.PI / 180);
        
        const blipX = centerX + blipRadius * Math.cos(blipAngle);
        const blipY = centerY + blipRadius * Math.sin(blipAngle);
        
        ctx.fillStyle = colors.error;
        ctx.beginPath();
        ctx.arc(blipX, blipY, 6, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = colors.error;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(blipX, blipY, 12, 0, Math.PI * 2);
        ctx.stroke();
      }

      requestAnimationFrame(draw);
    };

    draw();
  }, [colors, status]);

  return (
    <TacticalCard title="RADAR SWEEP - 360° COVERAGE" colors={colors} style={{ height: '100%' }}>
      <canvas 
        ref={canvasRef} 
        width={600} 
        height={600} 
        style={{ width: '100%', height: '100%', display: 'block' }}
      />
    </TacticalCard>
  );
}

function SignalWaveform({ colors, status }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    let dataPoints = Array(100).fill(0).map(() => Math.random() * 0.5);

    const draw = () => {
      ctx.fillStyle = colors.surface;
      ctx.fillRect(0, 0, width, height);

      // Draw grid
      ctx.strokeStyle = colors.gridLine;
      ctx.lineWidth = 0.5;
      for (let i = 0; i <= 4; i++) {
        const y = (height / 4) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw waveform
      if (status?.is_running) {
        dataPoints.shift();
        dataPoints.push(Math.random());
      }

      ctx.strokeStyle = colors.teal;
      ctx.lineWidth = 2;
      ctx.beginPath();
      dataPoints.forEach((point, i) => {
        const x = (i / dataPoints.length) * width;
        const y = height / 2 + (point - 0.5) * height * 0.8;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      requestAnimationFrame(draw);
    };

    draw();
  }, [colors, status]);

  return (
    <TacticalCard title="SIGNAL WAVEFORM" colors={colors}>
      <canvas ref={canvasRef} width={300} height={150} style={{ width: '100%', display: 'block' }} />
    </TacticalCard>
  );
}

function FrequencyChart({ colors }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    const bars = 20;
    let barHeights = Array(bars).fill(0).map(() => Math.random());

    const draw = () => {
      ctx.fillStyle = colors.surface;
      ctx.fillRect(0, 0, width, height);

      const barWidth = width / bars;

      barHeights = barHeights.map(h => h * 0.95 + Math.random() * 0.05);

      barHeights.forEach((h, i) => {
        const barHeight = h * height * 0.8;
        const x = i * barWidth;
        const y = height - barHeight;

        ctx.fillStyle = i === Math.floor(bars / 2) ? colors.warning : colors.teal;
        ctx.fillRect(x + 2, y, barWidth - 4, barHeight);
      });

      requestAnimationFrame(draw);
    };

    draw();
  }, [colors]);

  return (
    <TacticalCard title="FREQUENCY ANALYSIS" colors={colors}>
      <canvas ref={canvasRef} width={300} height={120} style={{ width: '100%', display: 'block' }} />
    </TacticalCard>
  );
}

function LocationDisplay({ colors, status }) {
  return (
    <TacticalCard title="POSITION & LOCATION" colors={colors}>
      <div className="space-y-2 text-xs">
        <div className="flex items-center gap-2">
          <MapPin size={14} style={{ color: colors.teal }} />
          <div>
            <div style={{ color: colors.textMuted }}>LATITUDE</div>
            <div style={{ color: colors.text }} className="font-bold">34.0522° N</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <MapPin size={14} style={{ color: colors.teal }} />
          <div>
            <div style={{ color: colors.textMuted }}>LONGITUDE</div>
            <div style={{ color: colors.text }} className="font-bold">118.2437° W</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Navigation size={14} style={{ color: colors.success }} />
          <div>
            <div style={{ color: colors.textMuted }}>HEADING</div>
            <div style={{ color: colors.text }} className="font-bold">045° NE</div>
          </div>
        </div>
      </div>
    </TacticalCard>
  );
}

function TargetList({ colors, status }) {
  const targets = status?.last_published_data ? [status.last_published_data] : [];

  return (
    <TacticalCard title="TARGET TRACKING" colors={colors}>
      <div className="space-y-2 text-xs">
        {targets.length === 0 ? (
          <div style={{ color: colors.textMuted }} className="text-center py-4">NO TARGETS</div>
        ) : (
          targets.map((target, i) => (
            <div key={i} className="p-2 rounded" style={{ backgroundColor: colors.primary, border: `1px solid ${colors.border}` }}>
              <div className="flex justify-between mb-1">
                <span style={{ color: colors.error }} className="font-bold">TGT-{i + 1}</span>
                <span style={{ color: colors.warning }}>{target.confidence}</span>
              </div>
              <div style={{ color: colors.textMuted }}>
                <div>RNG: {target.range}</div>
                <div>BRG: {target.bearing}</div>
                <div>ALT: {target.altitude}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </TacticalCard>
  );
}

function AltitudeGraph({ colors, status }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    let dataPoints = Array(50).fill(0).map(() => Math.random() * 0.6 + 0.2);

    const draw = () => {
      ctx.fillStyle = colors.surface;
      ctx.fillRect(0, 0, width, height);

      // Draw grid
      ctx.strokeStyle = colors.gridLine;
      ctx.lineWidth = 0.5;
      for (let i = 0; i <= 3; i++) {
        const y = (height / 3) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Update data
      if (status?.is_running) {
        dataPoints.shift();
        dataPoints.push(Math.random() * 0.6 + 0.2);
      }

      // Draw area chart
      ctx.fillStyle = colors.glowTeal;
      ctx.beginPath();
      ctx.moveTo(0, height);
      dataPoints.forEach((point, i) => {
        const x = (i / dataPoints.length) * width;
        const y = height - (point * height);
        ctx.lineTo(x, y);
      });
      ctx.lineTo(width, height);
      ctx.closePath();
      ctx.fill();

      // Draw line
      ctx.strokeStyle = colors.teal;
      ctx.lineWidth = 2;
      ctx.beginPath();
      dataPoints.forEach((point, i) => {
        const x = (i / dataPoints.length) * width;
        const y = height - (point * height);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      requestAnimationFrame(draw);
    };

    draw();
  }, [colors, status]);

  return (
    <TacticalCard title="ALTITUDE PROFILE" colors={colors}>
      <canvas ref={canvasRef} width={300} height={120} style={{ width: '100%', display: 'block' }} />
    </TacticalCard>
  );
}

function SignalStrengthMeter({ colors, status }) {
  const strength = status?.last_published_data?.signalStrength || 0;

  return (
    <TacticalCard title="SIGNAL STRENGTH" colors={colors}>
      <div className="space-y-2">
        <div className="text-3xl font-bold" style={{ color: colors.teal }}>{strength}%</div>
        <div style={{ height: '80px', backgroundColor: colors.primary, borderRadius: '4px', overflow: 'hidden', border: `1px solid ${colors.border}` }}>
          <div 
            style={{ 
              height: '100%', 
              width: `${strength}%`, 
              backgroundColor: strength > 70 ? colors.success : strength > 40 ? colors.warning : colors.error,
              transition: 'all 0.3s'
            }}
          />
        </div>
        <div className="flex justify-between text-xs" style={{ color: colors.textMuted }}>
          <span>WEAK</span>
          <span>STRONG</span>
        </div>
      </div>
    </TacticalCard>
  );
}

// Configuration and Logs components remain the same...
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

          <TacticalButton
            onClick={testRadar}
            disabled={loading}
            color={colors.success}
            icon={Radio}
            label="TEST RADAR CONNECTION"
          />
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

function TacticalCard({ title, children, colors, style = {} }) {
  return (
    <div className="rounded-lg p-4" style={{ 
      backgroundColor: colors.surface,
      border: `1px solid ${colors.border}`,
      boxShadow: `0 0 10px ${colors.gridLine}`,
      ...style
    }}>
      <h3 className="text-xs font-bold mb-3 tracking-widest" style={{ 
        color: colors.teal,
        borderBottom: `1px solid ${colors.border}`,
        paddingBottom: '6px'
      }}>
        {title}
      </h3>
      {children}
    </div>
  );
}

function MetricDisplay({ label, value, unit, valueColor, colors }) {
  return (
    <div>
      <p className="text-xs mb-1 tracking-wider" style={{ color: colors.textMuted }}>{label}</p>
      <p className="text-2xl font-bold" style={{ color: valueColor || colors.teal }}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
      <p className="text-xs tracking-wider" style={{ color: colors.textMuted }}>{unit}</p>
    </div>
  );
}

function TacticalButton({ onClick, disabled, color, icon: Icon, label, testId, small = false }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center justify-center gap-2 ${small ? 'px-2 py-2' : 'px-4 py-3'} rounded font-bold text-xs tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
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
      {Icon && <Icon size={small ? 14 : 16} />}
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
