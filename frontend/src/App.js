import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Activity, Radio, Cloud, Settings, PlayCircle, StopCircle, AlertCircle, CheckCircle, Send, FileText, Shield, Radar, Navigation, MapPin, Target, Plane } from 'lucide-react';
import '@/App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
const API = `${BACKEND_URL}/api`;

const DARCY_COLORS = {
  primary: '#0A1628', secondary: '#132B47', accent: '#1E4A6F', teal: '#00D9FF', tealDark: '#00A8CC',
  surface: '#0D1B2A', border: '#1E3A5F', text: '#E8F4F8', textMuted: '#8BA3B8', success: '#00FF87',
  warning: '#FFB800', error: '#FF3366', info: '#00D9FF', gridLine: 'rgba(0, 217, 255, 0.15)', glowTeal: 'rgba(0, 217, 255, 0.3)'
};

function App() {
  const [activeView, setActiveView] = useState('dashboard');
  const [status, setStatus] = useState(null);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    fetchStatus(); fetchConfig(); fetchLogs();
    const interval = setInterval(() => { fetchStatus(); }, 2000);
    return () => clearInterval(interval);
  }, []);

  const fetchStatus = async () => { try { const response = await axios.get(`${API}/gateway/status`); setStatus(response.data); } catch (error) { console.error('Error:', error); } };
  const fetchConfig = async () => { try { const response = await axios.get(`${API}/gateway/config`); setConfig(response.data); } catch (error) { console.error('Error:', error); } };
  const fetchLogs = async () => { try { const response = await axios.get(`${API}/gateway/logs?limit=50`); setLogs(response.data.logs || []); } catch (error) { console.error('Error:', error); } };
  const startGateway = async () => { setLoading(true); try { const response = await axios.post(`${API}/gateway/start`); if (response.data.success) { fetchStatus(); } } catch (error) {} setLoading(false); };
  const stopGateway = async () => { setLoading(true); try { const response = await axios.post(`${API}/gateway/stop`); if (response.data.success) { fetchStatus(); } } catch (error) {} setLoading(false); };
  const manualPublish = async () => { setLoading(true); try { await axios.post(`${API}/gateway/publish-manual`); } catch (error) {} setLoading(false); };
  const testRadar = async () => { setLoading(true); try { await axios.post(`${API}/gateway/test-radar`); } catch (error) {} setLoading(false); };
  const testDarcy = async () => { setLoading(true); try { await axios.post(`${API}/gateway/test-darcy`); } catch (error) {} setLoading(false); };
  const saveConfig = async (newConfig) => { setLoading(true); try { await axios.post(`${API}/gateway/config`, { config: newConfig }); fetchConfig(); } catch (error) {} setLoading(false); };

  const getStatusColor = () => { if (!status) return DARCY_COLORS.textMuted; if (status.is_running && status.radar_status === 'monitoring') return DARCY_COLORS.success; if (status.is_running) return DARCY_COLORS.warning; return DARCY_COLORS.error; };
  const getStatusText = () => { if (!status) return 'UNKNOWN'; if (status.is_running && status.radar_status === 'monitoring') return 'ACTIVE'; if (status.is_running) return 'STANDBY'; return 'OFFLINE'; };

  return (
    <div className="flex h-screen" style={{ backgroundColor: DARCY_COLORS.primary, color: DARCY_COLORS.text, fontFamily: 'monospace' }}>
      <div className="fixed top-0 left-0 right-0 z-50" style={{ backgroundColor: DARCY_COLORS.secondary, borderBottom: `2px solid ${DARCY_COLORS.teal}`, boxShadow: `0 0 20px ${DARCY_COLORS.glowTeal}` }}>
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: DARCY_COLORS.teal, boxShadow: `0 0 15px ${DARCY_COLORS.teal}` }}>
                  <Radar size={28} style={{ color: DARCY_COLORS.primary }} strokeWidth={2.5} />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor: DARCY_COLORS.success }}></div>
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-wider" style={{ color: DARCY_COLORS.teal, textShadow: `0 0 10px ${DARCY_COLORS.glowTeal}`, letterSpacing: '0.15em' }}>DARCY</h1>
                <p className="text-xs tracking-wide" style={{ color: DARCY_COLORS.textMuted, letterSpacing: '0.1em' }}>DRONE RADAR CONTROL SYSTEM</p>
              </div>
            </div>
            <div className="ml-8 px-4 py-2 rounded" style={{ backgroundColor: 'rgba(0, 217, 255, 0.1)', border: `1px solid ${DARCY_COLORS.teal}` }}>
              <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: getStatusColor() }}></div><span className="text-xs font-bold tracking-wider" style={{ color: getStatusColor() }}>{getStatusText()}</span></div>
            </div>
            <div className="ml-4 flex items-center gap-2 px-3 py-2 rounded" style={{ backgroundColor: status?.radar_status === 'monitoring' ? 'rgba(0, 255, 135, 0.1)' : 'rgba(255, 179, 0, 0.1)', border: `1px solid ${status?.radar_status === 'monitoring' ? DARCY_COLORS.success : DARCY_COLORS.warning}` }}>
              <span className="text-xs tracking-wider" style={{ color: DARCY_COLORS.textMuted }}>MOCK DATA</span>
              <div className="w-10 h-5 rounded-full flex items-center px-1 transition-all" style={{ backgroundColor: status?.radar_status === 'monitoring' ? DARCY_COLORS.success : DARCY_COLORS.textMuted }}>
                <div className="w-3 h-3 rounded-full bg-white transition-all" style={{ marginLeft: status?.radar_status === 'monitoring' ? '16px' : '0px' }} />
              </div>
              <span className="text-xs font-bold" style={{ color: status?.radar_status === 'monitoring' ? DARCY_COLORS.success : DARCY_COLORS.warning }}>{status?.radar_status === 'monitoring' ? 'ON' : 'OFF'}</span>
            </div>
          </div>
          <div className="flex items-center gap-6 text-xs" style={{ color: DARCY_COLORS.textMuted }}>
            <div className="flex items-center gap-2"><Shield size={14} style={{ color: DARCY_COLORS.teal }} /><span>SECURE</span></div>
            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: DARCY_COLORS.success }}></div><span>NOMINAL</span></div>
            <div className="font-mono">{new Date().toLocaleTimeString('en-US', { hour12: false })}</div>
          </div>
        </div>
      </div>

      <div className="flex w-full" style={{ marginTop: '80px' }}>
        <div className="w-64" style={{ backgroundColor: DARCY_COLORS.secondary, borderRight: `1px solid ${DARCY_COLORS.border}` }}>
          <nav className="p-4 space-y-2">
            <NavButton active={activeView === 'dashboard'} onClick={() => setActiveView('dashboard')} icon={Activity} label="TACTICAL DASHBOARD" colors={DARCY_COLORS} testId="nav-dashboard" />
            <NavButton active={activeView === 'config'} onClick={() => setActiveView('config')} icon={Settings} label="SYSTEM CONFIG" colors={DARCY_COLORS} testId="nav-config" />
            <NavButton active={activeView === 'logs'} onClick={() => setActiveView('logs')} icon={FileText} label="ACTIVITY LOG" colors={DARCY_COLORS} testId="nav-logs" />
          </nav>
          <div className="absolute bottom-0 left-0 w-64 p-4 text-xs" style={{ borderTop: `1px solid ${DARCY_COLORS.border}`, backgroundColor: DARCY_COLORS.primary }}>
            <div className="space-y-1" style={{ color: DARCY_COLORS.textMuted }}><div className="flex justify-between"><span>VERSION</span><span style={{ color: DARCY_COLORS.teal }}>1.0.0</span></div><div className="flex justify-between"><span>BUILD</span><span style={{ color: DARCY_COLORS.teal }}>2025.11.03</span></div></div>
          </div>
        </div>

        <div className="flex-1 overflow-auto" style={{ backgroundColor: DARCY_COLORS.primary }}>
          {activeView === 'dashboard' && <Dashboard status={status} loading={loading} getStatusColor={getStatusColor} getStatusText={getStatusText} startGateway={startGateway} stopGateway={stopGateway} manualPublish={manualPublish} testRadar={testRadar} testDarcy={testDarcy} colors={DARCY_COLORS} />}
          {activeView === 'config' && <Configuration config={config} loading={loading} saveConfig={saveConfig} testRadar={testRadar} testDarcy={testDarcy} colors={DARCY_COLORS} />}
          {activeView === 'logs' && <LogsView logs={logs} fetchLogs={fetchLogs} colors={DARCY_COLORS} />}
        </div>
      </div>
    </div>
  );
}

function Dashboard({ status, loading, getStatusColor, getStatusText, startGateway, stopGateway, manualPublish, testRadar, testDarcy, colors }) {
  const data = status?.last_published_data;
  const targets = data?.targets || [];

  return (
    <div className="p-6 space-y-4">
      <div className="grid grid-cols-4 gap-4">
        <TacticalCard title="GATEWAY STATUS" colors={colors}><div className="flex items-center justify-between mb-2"><div className="w-4 h-4 rounded-full animate-pulse" style={{ backgroundColor: getStatusColor() }}></div><div className="text-xs" style={{ color: colors.textMuted }}>GW-001</div></div><p className="text-2xl font-bold tracking-wider" data-testid="gateway-status" style={{ color: getStatusColor() }}>{getStatusText()}</p></TacticalCard>
        <TacticalCard title="RADAR STATUS" colors={colors}><div className="flex items-center justify-between mb-2">{status?.radar_status === 'monitoring' ? <CheckCircle style={{ color: colors.success }} size={18} /> : <AlertCircle style={{ color: colors.error }} size={18} />}<div className="text-xs" style={{ color: colors.textMuted }}>RDR-ALPHA</div></div><p className="text-2xl font-bold tracking-wider capitalize" data-testid="radar-status" style={{ color: status?.radar_status === 'monitoring' ? colors.success : colors.error }}>{status?.radar_status || 'OFFLINE'}</p></TacticalCard>
        <TacticalCard title="DARCY GATEWAY" colors={colors}><div className="flex items-center justify-between mb-2">{status?.darcy_connected ? <Cloud style={{ color: colors.info }} size={18} /> : <AlertCircle style={{ color: colors.warning }} size={18} />}<div className="text-xs" style={{ color: colors.textMuted }}>ENCRYPTED</div></div><p className="text-2xl font-bold tracking-wider" style={{ color: status?.darcy_connected ? colors.info : colors.warning }}>{status?.darcy_connected ? 'LINKED' : 'STANDBY'}</p></TacticalCard>
        <TacticalCard title="UPTIME" colors={colors}><div className="flex items-center justify-between mb-2"><Activity size={18} style={{ color: colors.teal }} /><div className="text-xs" style={{ color: colors.textMuted }}>RUNTIME</div></div><p className="text-2xl font-bold tracking-wider" style={{ color: colors.teal }}>{status?.uptime ? formatUptime(status.uptime) : 'N/A'}</p></TacticalCard>
      </div>

      <div className="grid grid-cols-12 gap-4" style={{ height: 'calc(100vh - 300px)' }}>
        <div className="col-span-3 space-y-4"><SignalWaveform colors={colors} status={status} /><FrequencyChart colors={colors} status={status} /><LocationDisplay colors={colors} data={data} /></div>
        <div className="col-span-6"><RadarSweepDisplay colors={colors} status={status} data={data} targets={targets} /></div>
        <div className="col-span-3 space-y-4"><TargetList colors={colors} targets={targets} /><GeoMapWidget colors={colors} targets={targets} /><SignalStrengthMeter colors={colors} data={data} /></div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <TacticalCard title="SENSOR METRICS" colors={colors}><div className="grid grid-cols-3 gap-4"><MetricDisplay label="DETECTIONS" value={status?.stats?.detections_total || 0} unit="TARGETS" colors={colors} /><MetricDisplay label="PUBLISHED" value={status?.stats?.published_total || 0} unit="MSGS" colors={colors} /><MetricDisplay label="ERRORS" value={status?.stats?.errors_total || 0} unit="EVENTS" valueColor={colors.error} colors={colors} /></div></TacticalCard>
        <TacticalCard title="MISSION CONTROL" colors={colors}><div className="grid grid-cols-4 gap-2">{!status?.is_running ? <TacticalButton onClick={startGateway} disabled={loading} color={colors.success} icon={PlayCircle} label="START" testId="start-button" small /> : <TacticalButton onClick={stopGateway} disabled={loading} color={colors.error} icon={StopCircle} label="STOP" testId="stop-button" small />}<TacticalButton onClick={manualPublish} disabled={loading || !status?.is_running} color={colors.info} icon={Send} label="PUBLISH" testId="manual-publish-button" small /><TacticalButton onClick={testRadar} disabled={loading} color={colors.warning} icon={Radio} label="RADAR" testId="test-radar-button" small /><TacticalButton onClick={testDarcy} disabled={loading} color={colors.teal} icon={Cloud} label="DARCY" testId="test-darcy-button" small /></div></TacticalCard>
      </div>
    </div>
  );
}

function RadarSweepDisplay({ colors, status, data, targets }) {
  const canvasRef = useRef(null);
  const [angle, setAngle] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width, height = canvas.height, centerX = width / 2, centerY = height / 2, radius = Math.min(width, height) / 2 - 50;
    let currentAngle = angle, animationId;

    const drawDrone = (x, y, droneSize, label, threatLevel) => {
      ctx.save();
      const pulse = Math.sin(Date.now() / 300) * 0.3 + 0.7;
      ctx.shadowBlur = 25 * pulse;
      ctx.shadowColor = colors.error;
      
      // Outer pulsing ring
      ctx.strokeStyle = colors.error;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, y, droneSize + 18, 0, Math.PI * 2);
      ctx.stroke();
      
      // Middle ring
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, droneSize + 10, 0, Math.PI * 2);
      ctx.stroke();
      
      // Filled center
      ctx.fillStyle = colors.error;
      ctx.beginPath();
      ctx.arc(x, y, droneSize, 0, Math.PI * 2);
      ctx.fill();
      
      // Drone icon (triangle/plane shape)
      ctx.fillStyle = colors.text;
      ctx.beginPath();
      ctx.moveTo(x, y - droneSize * 0.6);
      ctx.lineTo(x - droneSize * 0.5, y + droneSize * 0.4);
      ctx.lineTo(x + droneSize * 0.5, y + droneSize * 0.4);
      ctx.closePath();
      ctx.fill();
      
      ctx.shadowBlur = 0;
      
      // Label background
      ctx.fillStyle = 'rgba(255, 51, 102, 0.9)';
      ctx.fillRect(x + 25, y - 20, 80, 45);
      
      // Border
      ctx.strokeStyle = colors.error;
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 25, y - 20, 80, 45);
      
      // Text
      ctx.fillStyle = colors.text;
      ctx.font = 'bold 11px monospace';
      ctx.fillText(label, x + 30, y - 8);
      ctx.font = '9px monospace';
      ctx.fillText(`SIZE: ${droneSize}m`, x + 30, y + 4);
      ctx.fillStyle = threatLevel === 'HIGH' ? colors.error : threatLevel === 'MEDIUM' ? colors.warning : colors.info;
      ctx.fillText(threatLevel, x + 30, y + 16);
      
      ctx.restore();
    };

    const draw = () => {
      ctx.fillStyle = colors.surface;
      ctx.fillRect(0, 0, width, height);

      // Circles
      ctx.strokeStyle = colors.gridLine;
      ctx.lineWidth = 1.5;
      for (let i = 1; i <= 4; i++) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, (radius / 4) * i, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Crosshairs
      ctx.beginPath();
      ctx.moveTo(centerX - radius, centerY);
      ctx.lineTo(centerX + radius, centerY);
      ctx.moveTo(centerX, centerY - radius);
      ctx.lineTo(centerX, centerY + radius);
      ctx.stroke();

      // Range labels
      ctx.fillStyle = colors.teal;
      ctx.font = 'bold 12px monospace';
      ['10km', '20km', '30km', '40km'].forEach((label, i) => {
        ctx.fillText(label, centerX + 10, centerY - (radius / 4) * (i + 1) + 5);
      });

      // Compass
      ctx.font = 'bold 18px monospace';
      ctx.shadowBlur = 10;
      ctx.shadowColor = colors.teal;
      ctx.fillText('N', centerX - 8, centerY - radius - 12);
      ctx.fillText('E', centerX + radius + 18, centerY + 6);
      ctx.fillText('S', centerX - 8, centerY + radius + 22);
      ctx.fillText('W', centerX - radius - 25, centerY + 6);
      ctx.shadowBlur = 0;

      // Sweep beam
      if (status?.is_running) {
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(currentAngle);
        const gradient = ctx.createLinearGradient(0, 0, 0, -radius);
        gradient.addColorStop(0, 'transparent');
        gradient.addColorStop(0.3, colors.glowTeal);
        gradient.addColorStop(1, colors.teal + '60');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, radius, -Math.PI / 5, Math.PI / 5);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        currentAngle += 0.04;
      }

      // Draw drones
      targets.forEach((target, idx) => {
        const bearingMatch = target.bearing?.match(/([\d.]+)/);
        const rangeMatch = target.range?.match(/([\d.]+)/);
        const altMatch = target.altitude?.match(/([\d.]+)/);
        
        if (bearingMatch && rangeMatch) {
          const bearing = parseFloat(bearingMatch[1]);
          const range = parseFloat(rangeMatch[1]);
          const altitude = altMatch ? parseFloat(altMatch[1]) : 100;
          const maxRange = 50;
          const blipRadius = (range / maxRange) * radius;
          const blipAngle = (bearing - 90) * (Math.PI / 180);
          const blipX = centerX + blipRadius * Math.cos(blipAngle);
          const blipY = centerY + blipRadius * Math.sin(blipAngle);
          const droneSize = Math.max(10, Math.min(20, 25 - (altitude / 50)));
          const threatLevel = range < 5 ? 'HIGH' : range < 20 ? 'MEDIUM' : 'LOW';
          drawDrone(blipX, blipY, droneSize, target.id || `T${idx}`, threatLevel);
        }
      });

      animationId = requestAnimationFrame(draw);
    };

    draw();
    setAngle(currentAngle);
    return () => { if (animationId) cancelAnimationFrame(animationId); };
  }, [colors, status, targets, angle]);

  return (
    <TacticalCard title="RADAR SWEEP - 360° COVERAGE" colors={colors} style={{ height: '100%' }}>
      <div className="relative">
        <canvas ref={canvasRef} width={700} height={700} style={{ width: '100%', height: '100%', display: 'block' }} />
        {data && (
          <div className="absolute top-4 left-4 text-xs space-y-1 px-3 py-2 rounded" style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)', border: `1px solid ${colors.teal}` }}>
            <div style={{ color: colors.teal }} className="font-bold">CURRENT SCAN</div>
            <div style={{ color: colors.text }}>RANGE: {data.range}</div>
            <div style={{ color: colors.text }}>BEARING: {data.bearing}</div>
            <div style={{ color: colors.text }}>TARGETS: {data.detections}</div>
            <div style={{ color: colors.text }}>ALTITUDE: {data.altitude}</div>
          </div>
        )}
        {targets.length > 0 && (
          <div className="absolute top-4 right-4 text-xs px-3 py-2 rounded animate-pulse" style={{ backgroundColor: 'rgba(255, 51, 102, 0.3)', border: `2px solid ${colors.error}` }}>
            <div style={{ color: colors.error }} className="font-bold">⚠ {targets.length} THREAT{targets.length > 1 ? 'S' : ''} DETECTED</div>
          </div>
        )}
      </div>
    </TacticalCard>
  );
}

function GeoMapWidget({ colors, targets }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width, height = canvas.height;
    const centerLat = 34.0522, centerLon = -118.2437, scale = 120;

    const draw = () => {
      ctx.fillStyle = colors.surface;
      ctx.fillRect(0, 0, width, height);

      // Grid
      ctx.strokeStyle = colors.gridLine;
      ctx.lineWidth = 0.5;
      for (let i = 0; i <= 4; i++) {
        ctx.beginPath(); ctx.moveTo((width / 4) * i, 0); ctx.lineTo((width / 4) * i, height); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, (height / 4) * i); ctx.lineTo(width, (height / 4) * i); ctx.stroke();
      }

      // Center (base)
      const centerX = width / 2, centerY = height / 2;
      ctx.fillStyle = colors.success;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = colors.success;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 14, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = colors.success;
      ctx.font = 'bold 11px monospace';
      ctx.fillText('BASE', centerX + 20, centerY);

      // Targets
      targets.forEach((target, idx) => {
        if (target.latitude && target.longitude) {
          const lat = parseFloat(target.latitude);
          const lon = parseFloat(target.longitude);
          const x = centerX + (lon - centerLon) * scale;
          const y = centerY - (lat - centerLat) * scale;
          
          // Drone triangle
          ctx.fillStyle = colors.error;
          ctx.shadowBlur = 15;
          ctx.shadowColor = colors.error;
          ctx.beginPath();
          ctx.moveTo(x, y - 10);
          ctx.lineTo(x - 7, y + 7);
          ctx.lineTo(x + 7, y + 7);
          ctx.closePath();
          ctx.fill();
          ctx.shadowBlur = 0;
          
          // Pulse
          const pulse = Math.sin(Date.now() / 200 + idx) * 4 + 12;
          ctx.strokeStyle = colors.error;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(x, y, pulse, 0, Math.PI * 2);
          ctx.stroke();
          
          // Label
          ctx.fillStyle = colors.error;
          ctx.font = 'bold 10px monospace';
          ctx.fillText(target.id || `T${idx}`, x + 15, y);
        }
      });

      requestAnimationFrame(draw);
    };
    draw();
  }, [colors, targets]);

  return (
    <TacticalCard title="GEOGRAPHIC MAP" colors={colors}>
      <canvas ref={canvasRef} width={300} height={180} style={{ width: '100%', display: 'block' }} />
      <div className="mt-2 flex justify-between text-xs" style={{ color: colors.textMuted }}>
        <span>BASE: {targets.length > 0 ? `${targets.length} THREAT${targets.length > 1 ? 'S' : ''}` : 'CLEAR'}</span>
        <span>RANGE: 100km</span>
      </div>
    </TacticalCard>
  );
}

function SignalWaveform({ colors, status }) { const canvasRef = useRef(null); const dataPointsRef = useRef(Array(100).fill(0).map(() => Math.random() * 0.5)); useEffect(() => { const canvas = canvasRef.current; if (!canvas) return; const ctx = canvas.getContext('2d'), width = canvas.width, height = canvas.height; const draw = () => { ctx.fillStyle = colors.surface; ctx.fillRect(0, 0, width, height); ctx.strokeStyle = colors.gridLine; ctx.lineWidth = 0.5; for (let i = 0; i <= 4; i++) { ctx.beginPath(); ctx.moveTo(0, (height / 4) * i); ctx.lineTo(width, (height / 4) * i); ctx.stroke(); } if (status?.is_running) { dataPointsRef.current.shift(); dataPointsRef.current.push(Math.random()); } ctx.strokeStyle = colors.teal; ctx.lineWidth = 2; ctx.beginPath(); dataPointsRef.current.forEach((point, i) => { const x = (i / dataPointsRef.current.length) * width, y = height / 2 + (point - 0.5) * height * 0.8; if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); }); ctx.stroke(); requestAnimationFrame(draw); }; draw(); }, [colors, status]); return <TacticalCard title="SIGNAL WAVEFORM" colors={colors}><canvas ref={canvasRef} width={300} height={150} style={{ width: '100%', display: 'block' }} /></TacticalCard>; }
function FrequencyChart({ colors, status }) { const canvasRef = useRef(null); const barHeightsRef = useRef(Array(20).fill(0).map(() => Math.random())); useEffect(() => { const canvas = canvasRef.current; if (!canvas) return; const ctx = canvas.getContext('2d'), width = canvas.width, height = canvas.height, bars = 20; const draw = () => { ctx.fillStyle = colors.surface; ctx.fillRect(0, 0, width, height); const barWidth = width / bars; if (status?.is_running) barHeightsRef.current = barHeightsRef.current.map(h => h * 0.95 + Math.random() * 0.05); barHeightsRef.current.forEach((h, i) => { const barHeight = h * height * 0.8; ctx.fillStyle = i === Math.floor(bars / 2) ? colors.warning : colors.teal; ctx.fillRect(i * barWidth + 2, height - barHeight, barWidth - 4, barHeight); }); requestAnimationFrame(draw); }; draw(); }, [colors, status]); return <TacticalCard title="FREQUENCY ANALYSIS" colors={colors}><canvas ref={canvasRef} width={300} height={120} style={{ width: '100%', display: 'block' }} /></TacticalCard>; }
function LocationDisplay({ colors, data }) { return <TacticalCard title="POSITION & LOCATION" colors={colors}><div className="space-y-2 text-xs"><div className="flex items-center gap-2"><MapPin size={14} style={{ color: colors.teal }} /><div className="flex-1"><div style={{ color: colors.textMuted }}>LATITUDE</div><div style={{ color: colors.text }} className="font-bold">{data?.latitude ? `${data.latitude}° N` : '34.0522° N'}</div></div></div><div className="flex items-center gap-2"><MapPin size={14} style={{ color: colors.teal }} /><div className="flex-1"><div style={{ color: colors.textMuted }}>LONGITUDE</div><div style={{ color: colors.text }} className="font-bold">{data?.longitude ? `${Math.abs(data.longitude)}° W` : '118.2437° W'}</div></div></div><div className="flex items-center gap-2"><Navigation size={14} style={{ color: colors.success }} /><div className="flex-1"><div style={{ color: colors.textMuted }}>HEADING</div><div style={{ color: colors.text }} className="font-bold">{data?.bearing || '000° N'}</div></div></div></div></TacticalCard>; }
function TargetList({ colors, targets }) { return <TacticalCard title="TARGET TRACKING" colors={colors}><div className="space-y-2 text-xs max-h-48 overflow-y-auto">{targets.length === 0 ? <div style={{ color: colors.textMuted }} className="text-center py-4">NO TARGETS</div> : targets.map((target, i) => <div key={i} className="p-2 rounded" style={{ backgroundColor: colors.primary, border: `2px solid ${colors.error}`, boxShadow: `0 0 5px ${colors.error}` }}><div className="flex justify-between mb-1"><span style={{ color: colors.error }} className="font-bold">{target.id || `TGT-${i + 1}`}</span><span style={{ color: colors.warning }} className="text-xs">{target.type || 'DRONE'}</span></div><div style={{ color: colors.textMuted }} className="space-y-0.5"><div>RNG: <span style={{ color: colors.text }}>{target.range}</span></div><div>BRG: <span style={{ color: colors.text }}>{target.bearing}</span></div><div>ALT: <span style={{ color: colors.text }}>{target.altitude}</span></div><div>SPD: <span style={{ color: colors.text }}>{target.speed}</span></div></div></div>)}</div></TacticalCard>; }
function SignalStrengthMeter({ colors, data }) { const strength = data?.signalStrength || 0; return <TacticalCard title="SIGNAL STRENGTH" colors={colors}><div className="space-y-2"><div className="text-3xl font-bold" style={{ color: colors.teal }}>{strength}%</div><div style={{ height: '60px', backgroundColor: colors.primary, borderRadius: '4px', overflow: 'hidden', border: `1px solid ${colors.border}` }}><div style={{ height: '100%', width: `${strength}%`, backgroundColor: strength > 70 ? colors.success : strength > 40 ? colors.warning : colors.error, transition: 'all 0.5s', boxShadow: `0 0 10px ${strength > 70 ? colors.success : strength > 40 ? colors.warning : colors.error}` }} /></div><div className="flex justify-between text-xs" style={{ color: colors.textMuted }}><span>WEAK</span><span>STRONG</span></div>{data && <div className="text-xs" style={{ color: colors.textMuted }}>CONFIDENCE: <span style={{ color: colors.teal }}>{data.confidence}</span></div>}</div></TacticalCard>; }
function Configuration({ config, loading, saveConfig, testRadar, testDarcy, colors }) { const [localConfig, setLocalConfig] = useState(config); useEffect(() => { setLocalConfig(config); }, [config]); const handleSave = () => saveConfig(localConfig); const updateNestedValue = (path, value) => { const keys = path.split('.'); const newConfig = JSON.parse(JSON.stringify(localConfig)); let current = newConfig; for (let i = 0; i < keys.length - 1; i++) current = current[keys[i]]; current[keys[keys.length - 1]] = value; setLocalConfig(newConfig); }; if (!localConfig) return <div className="p-6"><p style={{ color: colors.text }}>LOADING...</p></div>; return <div className="p-6 space-y-6"><TacticalCard title="DARCY GATEWAY CONFIGURATION" colors={colors}><div className="space-y-4"><TacticalInput label="BACKEND URL" value={localConfig.darcy?.backend_url || ''} onChange={(e) => updateNestedValue('darcy.backend_url', e.target.value)} placeholder="https://api.darcy.example.com" colors={colors} testId="darcy-url-input" /><TacticalInput label="GATEWAY TOKEN" type="password" value={localConfig.darcy?.gateway_token || ''} onChange={(e) => updateNestedValue('darcy.gateway_token', e.target.value)} placeholder="Enter encrypted gateway token" colors={colors} testId="gateway-token-input" /><TacticalButton onClick={testDarcy} disabled={loading} color={colors.teal} icon={Cloud} label="TEST CONNECTION" /></div></TacticalCard><TacticalCard title="RADAR SYSTEM CONFIGURATION" colors={colors}><div className="space-y-4"><div><label className="block text-xs font-bold mb-2 tracking-wider" style={{ color: colors.teal }}>RADAR TYPE</label><select value={localConfig.radar?.type || 'mock'} onChange={(e) => updateNestedValue('radar.type', e.target.value)} className="w-full px-4 py-2 rounded font-mono text-sm" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}`, color: colors.text }} data-testid="radar-type-select"><option value="mock">MOCK (TESTING)</option><option value="serial">SERIAL PORT (RS-232/485)</option><option value="tcp">TCP/IP SOCKET</option><option value="file">FILE INPUT</option></select></div><TacticalButton onClick={testRadar} disabled={loading} color={colors.success} icon={Radio} label="TEST RADAR CONNECTION" /></div></TacticalCard><button onClick={handleSave} disabled={loading} className="w-full px-6 py-4 rounded font-bold text-sm tracking-widest transition-all disabled:opacity-50" style={{ backgroundColor: colors.teal, color: colors.primary, border: `2px solid ${colors.teal}`, boxShadow: `0 0 20px ${colors.glowTeal}` }} data-testid="save-config-button">SAVE CONFIGURATION</button></div>; }
function LogsView({ logs, fetchLogs, colors }) { return <div className="p-6 space-y-6"><div className="flex items-center justify-between"><h2 className="text-xl font-bold tracking-wider" style={{ color: colors.teal }}>ACTIVITY LOG</h2><button onClick={fetchLogs} className="px-4 py-2 rounded font-mono text-xs tracking-wider" style={{ backgroundColor: colors.accent, color: colors.teal, border: `1px solid ${colors.teal}` }}>REFRESH</button></div><TacticalCard title="TRANSMISSION LOG" colors={colors}><div className="overflow-x-auto"><table className="w-full font-mono text-xs"><thead style={{ borderBottom: `2px solid ${colors.border}` }}><tr><th className="px-4 py-3 text-left tracking-wider" style={{ color: colors.teal }}>TIMESTAMP</th><th className="px-4 py-3 text-left tracking-wider" style={{ color: colors.teal }}>TYPE</th><th className="px-4 py-3 text-left tracking-wider" style={{ color: colors.teal }}>DATA</th></tr></thead><tbody>{logs.length === 0 ? <tr><td colSpan="3" className="px-4 py-8 text-center" style={{ color: colors.textMuted }}>NO LOGS</td></tr> : logs.map((log, i) => <tr key={i} style={{ borderBottom: `1px solid ${colors.border}` }}><td className="px-4 py-3" style={{ color: colors.text }}>{new Date(log.timestamp).toLocaleString()}</td><td className="px-4 py-3"><span className="px-2 py-1 rounded text-xs font-bold" style={{ backgroundColor: colors.teal, color: colors.primary }}>{log.data_type}</span></td><td className="px-4 py-3 max-w-md truncate" style={{ color: colors.textMuted }}>{log.data.substring(0, 60)}...</td></tr>)}</tbody></table></div></TacticalCard></div>; }
function NavButton({ active, onClick, icon: Icon, label, colors, testId }) { return <button onClick={onClick} className="w-full flex items-center gap-3 px-4 py-3 rounded font-medium transition-all text-xs tracking-wider" style={{ backgroundColor: active ? colors.accent : 'transparent', color: active ? colors.teal : colors.text, border: `1px solid ${active ? colors.teal : 'transparent'}`, boxShadow: active ? `0 0 10px ${colors.glowTeal}` : 'none' }} data-testid={testId}><Icon size={18} /><span>{label}</span></button>; }
function TacticalCard({ title, children, colors, style = {} }) { return <div className="rounded-lg p-4" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}`, boxShadow: `0 0 10px ${colors.gridLine}`, ...style }}><h3 className="text-xs font-bold mb-3 tracking-widest" style={{ color: colors.teal, borderBottom: `1px solid ${colors.border}`, paddingBottom: '6px' }}>{title}</h3>{children}</div>; }
function MetricDisplay({ label, value, unit, valueColor, colors }) { return <div><p className="text-xs mb-1 tracking-wider" style={{ color: colors.textMuted }}>{label}</p><p className="text-2xl font-bold" style={{ color: valueColor || colors.teal }}>{typeof value === 'number' ? value.toLocaleString() : value}</p><p className="text-xs tracking-wider" style={{ color: colors.textMuted }}>{unit}</p></div>; }
function TacticalButton({ onClick, disabled, color, icon: Icon, label, testId, small = false }) { return <button onClick={onClick} disabled={disabled} className={`flex items-center justify-center gap-2 ${small ? 'px-2 py-2' : 'px-4 py-3'} rounded font-bold text-xs tracking-widest transition-all disabled:opacity-50`} style={{ backgroundColor: 'transparent', color: color, border: `2px solid ${color}`, boxShadow: disabled ? 'none' : `0 0 10px ${color}` }} onMouseEnter={(e) => !disabled && (e.currentTarget.style.backgroundColor = color, e.currentTarget.style.color = '#0A1628')} onMouseLeave={(e) => !disabled && (e.currentTarget.style.backgroundColor = 'transparent', e.currentTarget.style.color = color)} data-testid={testId}>{Icon && <Icon size={small ? 14 : 16} />}<span>{label}</span></button>; }
function TacticalInput({ label, type = "text", value, onChange, placeholder, colors, testId, ...props }) { return <div><label className="block text-xs font-bold mb-2 tracking-wider" style={{ color: colors.teal }}>{label}</label><input type={type} value={value} onChange={onChange} placeholder={placeholder} className="w-full px-4 py-2 rounded font-mono text-sm focus:outline-none" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}`, color: colors.text }} onFocus={(e) => { e.target.style.borderColor = colors.teal; e.target.style.boxShadow = `0 0 10px ${colors.glowTeal}`; }} onBlur={(e) => { e.target.style.borderColor = colors.border; e.target.style.boxShadow = 'none'; }} data-testid={testId} {...props} /></div>; }
function formatUptime(uptimeStr) { const parts = uptimeStr.split(':'); if (parts.length === 3) { const hours = parseInt(parts[0]), minutes = parseInt(parts[1]), seconds = parseInt(parts[2].split('.')[0]); if (hours > 0) return `${hours}h ${minutes}m`; if (minutes > 0) return `${minutes}m ${seconds}s`; return `${seconds}s`; } return uptimeStr; }
export default App;