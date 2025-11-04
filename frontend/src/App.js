import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Activity, Radio, Cloud, Settings, PlayCircle, StopCircle, AlertCircle, CheckCircle, Send, FileText, Shield, Radar, Navigation, MapPin } from 'lucide-react';
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
    fetchStatus();
    fetchConfig();
    fetchLogs();
    const interval = setInterval(() => fetchStatus(), 2000);
    return () => clearInterval(interval);
  }, []);

  const fetchStatus = async () => { try { const r = await axios.get(`${API}/gateway/status`); setStatus(r.data); } catch (e) { console.error('Status error:', e); } };
  const fetchConfig = async () => { try { const r = await axios.get(`${API}/gateway/config`); setConfig(r.data); } catch (e) { console.error('Config error:', e); } };
  const fetchLogs = async () => { try { const r = await axios.get(`${API}/gateway/logs?limit=50`); setLogs(r.data.logs || []); } catch (e) { console.error('Logs error:', e); } };
  const startGateway = async () => { setLoading(true); try { await axios.post(`${API}/gateway/start`); fetchStatus(); } catch (e) { console.error(e); } setLoading(false); };
  const stopGateway = async () => { setLoading(true); try { await axios.post(`${API}/gateway/stop`); fetchStatus(); } catch (e) { console.error(e); } setLoading(false); };
  const manualPublish = async () => { setLoading(true); try { await axios.post(`${API}/gateway/publish-manual`); } catch (e) { console.error(e); } setLoading(false); };
  const testRadar = async () => { setLoading(true); try { await axios.post(`${API}/gateway/test-radar`); } catch (e) { console.error(e); } setLoading(false); };
  const testDarcy = async () => { setLoading(true); try { await axios.post(`${API}/gateway/test-darcy`); } catch (e) { console.error(e); } setLoading(false); };
  const saveConfig = async (c) => { setLoading(true); try { await axios.post(`${API}/gateway/config`, { config: c }); fetchConfig(); } catch (e) { console.error(e); } setLoading(false); };

  const getStatusColor = () => status?.is_running && status?.radar_status === 'monitoring' ? DARCY_COLORS.success : status?.is_running ? DARCY_COLORS.warning : DARCY_COLORS.error;
  const getStatusText = () => status?.is_running && status?.radar_status === 'monitoring' ? 'ACTIVE' : status?.is_running ? 'STANDBY' : 'OFFLINE';

  return (
    <div style={{ backgroundColor: DARCY_COLORS.primary, color: DARCY_COLORS.text, fontFamily: 'monospace', minHeight: '100vh' }}>
      <Header status={status} getStatusColor={getStatusColor} getStatusText={getStatusText} colors={DARCY_COLORS} />
      <div style={{ display: 'flex', height: 'calc(100vh - 76px)' }}>
        <Sidebar activeView={activeView} setActiveView={setActiveView} colors={DARCY_COLORS} />
        <MainContent activeView={activeView} status={status} config={config} logs={logs} loading={loading} getStatusColor={getStatusColor} getStatusText={getStatusText} startGateway={startGateway} stopGateway={stopGateway} manualPublish={manualPublish} testRadar={testRadar} testDarcy={testDarcy} saveConfig={saveConfig} fetchLogs={fetchLogs} colors={DARCY_COLORS} />
      </div>
    </div>
  );
}

function Header({ status, getStatusColor, getStatusText, colors }) {
  return (
    <div style={{ backgroundColor: colors.secondary, borderBottom: `2px solid ${colors.teal}`, boxShadow: `0 0 20px ${colors.glowTeal}`, padding: '12px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ position: 'relative', width: 50, height: 50, borderRadius: '50%', backgroundColor: colors.teal, boxShadow: `0 0 15px ${colors.teal}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Radar size={30} style={{ color: colors.primary }} strokeWidth={2.5} />
              <div style={{ position: 'absolute', top: -2, right: -2, width: 12, height: 12, borderRadius: '50%', backgroundColor: colors.success, animation: 'pulse 2s infinite' }} />
            </div>
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 'bold', letterSpacing: '0.15em', color: colors.teal, textShadow: `0 0 10px ${colors.glowTeal}` }}>DARCY</h1>
              <p style={{ fontSize: 11, color: colors.textMuted, letterSpacing: '0.1em' }}>DRONE RADAR CONTROL SYSTEM</p>
            </div>
          </div>
          <div style={{ marginLeft: 30, padding: '8px 16px', borderRadius: 4, backgroundColor: 'rgba(0, 217, 255, 0.1)', border: `1px solid ${colors.teal}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: getStatusColor(), animation: 'pulse 2s infinite' }} />
              <span style={{ fontSize: 12, fontWeight: 'bold', letterSpacing: '0.1em', color: getStatusColor() }}>{getStatusText()}</span>
            </div>
          </div>
          <div style={{ marginLeft: 15, display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 4, backgroundColor: status?.radar_status === 'monitoring' ? 'rgba(0, 255, 135, 0.1)' : 'rgba(255, 179, 0, 0.1)', border: `1px solid ${status?.radar_status === 'monitoring' ? colors.success : colors.warning}` }}>
            <span style={{ fontSize: 11, color: colors.textMuted }}>MOCK DATA</span>
            <div style={{ width: 40, height: 20, borderRadius: 20, backgroundColor: status?.radar_status === 'monitoring' ? colors.success : colors.textMuted, display: 'flex', alignItems: 'center', padding: '0 2px', transition: 'all 0.3s' }}>
              <div style={{ width: 16, height: 16, borderRadius: '50%', backgroundColor: '#fff', marginLeft: status?.radar_status === 'monitoring' ? 20 : 0, transition: 'all 0.3s' }} />
            </div>
            <span style={{ fontSize: 11, fontWeight: 'bold', color: status?.radar_status === 'monitoring' ? colors.success : colors.warning }}>{status?.radar_status === 'monitoring' ? 'ON' : 'OFF'}</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, fontSize: 11, color: colors.textMuted }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Shield size={14} style={{ color: colors.teal }} /><span>SECURE</span></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: colors.success }} /><span>NOMINAL</span></div>
          <div style={{ fontFamily: 'monospace' }}>{new Date().toLocaleTimeString('en-US', { hour12: false })}</div>
        </div>
      </div>
    </div>
  );
}

function Sidebar({ activeView, setActiveView, colors }) {
  return (
    <div style={{ width: 280, backgroundColor: colors.secondary, borderRight: `1px solid ${colors.border}`, display: 'flex', flexDirection: 'column' }}>
      <nav style={{ padding: 16, flex: 1 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <NavButton active={activeView === 'dashboard'} onClick={() => setActiveView('dashboard')} icon={Activity} label="TACTICAL DASHBOARD" colors={colors} testId="nav-dashboard" />
          <NavButton active={activeView === 'config'} onClick={() => setActiveView('config')} icon={Settings} label="SYSTEM CONFIG" colors={colors} testId="nav-config" />
          <NavButton active={activeView === 'logs'} onClick={() => setActiveView('logs')} icon={FileText} label="ACTIVITY LOG" colors={colors} testId="nav-logs" />
        </div>
      </nav>
      <div style={{ padding: 16, borderTop: `1px solid ${colors.border}`, fontSize: 11, color: colors.textMuted }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><span>VERSION</span><span style={{ color: colors.teal }}>2.0.0</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>BUILD</span><span style={{ color: colors.teal }}>2025.11.04</span></div>
      </div>
    </div>
  );
}

function MainContent({ activeView, status, config, logs, loading, getStatusColor, getStatusText, startGateway, stopGateway, manualPublish, testRadar, testDarcy, saveConfig, fetchLogs, colors }) {
  return (
    <div style={{ flex: 1, overflow: 'auto', backgroundColor: colors.primary }}>
      {activeView === 'dashboard' && <Dashboard status={status} loading={loading} getStatusColor={getStatusColor} getStatusText={getStatusText} startGateway={startGateway} stopGateway={stopGateway} manualPublish={manualPublish} testRadar={testRadar} testDarcy={testDarcy} colors={colors} />}
      {activeView === 'config' && <Configuration config={config} loading={loading} saveConfig={saveConfig} testRadar={testRadar} testDarcy={testDarcy} colors={colors} />}
      {activeView === 'logs' && <LogsView logs={logs} fetchLogs={fetchLogs} colors={colors} />}
    </div>
  );
}

function Dashboard({ status, loading, getStatusColor, getStatusText, startGateway, stopGateway, manualPublish, testRadar, testDarcy, colors }) {
  const data = status?.last_published_data;
  const targets = data?.targets || [];

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 16 }}>
        <StatusCard title="GATEWAY STATUS" value={getStatusText()} subtext="GW-001" color={getStatusColor()} colors={colors} testId="gateway-status" />
        <StatusCard title="RADAR STATUS" value={status?.radar_status || 'OFFLINE'} subtext="RDR-ALPHA" color={status?.radar_status === 'monitoring' ? colors.success : colors.error} colors={colors} testId="radar-status" icon={status?.radar_status === 'monitoring' ? CheckCircle : AlertCircle} />
        <StatusCard title="DARCY GATEWAY" value={status?.darcy_connected ? 'LINKED' : 'STANDBY'} subtext="ENCRYPTED" color={status?.darcy_connected ? colors.info : colors.warning} colors={colors} icon={status?.darcy_connected ? Cloud : AlertCircle} />
        <StatusCard title="UPTIME" value={status?.uptime ? formatUptime(status.uptime) : 'N/A'} subtext="RUNTIME" color={colors.teal} colors={colors} icon={Activity} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr 340px', gap: 16, height: 'calc(100vh - 320px)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <SignalWaveform colors={colors} status={status} />
          <FrequencyChart colors={colors} status={status} />
          <LocationDisplay colors={colors} data={data} />
        </div>

        <TacticalCard title="RADAR SWEEP - 360° COVERAGE" colors={colors}>
          <RadarSweepDisplay colors={colors} status={status} data={data} targets={targets} />
        </TacticalCard>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <TargetList colors={colors} targets={targets} />
          <GeoMapWidget colors={colors} targets={targets} />
          <SignalStrengthMeter colors={colors} data={data} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginTop: 16 }}>
        <TacticalCard title="SENSOR METRICS" colors={colors}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            <MetricBox label="DETECTIONS" value={status?.stats?.detections_total || 0} unit="TARGETS" colors={colors} />
            <MetricBox label="PUBLISHED" value={status?.stats?.published_total || 0} unit="MSGS" colors={colors} />
            <MetricBox label="ERRORS" value={status?.stats?.errors_total || 0} unit="EVENTS" valueColor={colors.error} colors={colors} />
          </div>
        </TacticalCard>
        <TacticalCard title="MISSION CONTROL" colors={colors}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {!status?.is_running ? (
              <TacticalButton onClick={startGateway} disabled={loading} color={colors.success} icon={PlayCircle} label="START" testId="start-button" small />
            ) : (
              <TacticalButton onClick={stopGateway} disabled={loading} color={colors.error} icon={StopCircle} label="STOP" testId="stop-button" small />
            )}
            <TacticalButton onClick={manualPublish} disabled={loading || !status?.is_running} color={colors.info} icon={Send} label="PUB" testId="manual-publish-button" small />
            <TacticalButton onClick={testRadar} disabled={loading} color={colors.warning} icon={Radio} label="RADAR" testId="test-radar-button" small />
            <TacticalButton onClick={testDarcy} disabled={loading} color={colors.teal} icon={Cloud} label="DARCY" testId="test-darcy-button" small />
          </div>
        </TacticalCard>
      </div>
    </div>
  );
}

function RadarSweepDisplay({ colors, status, data, targets }) {
  const canvasRef = useRef(null);
  const angleRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 60;
    let animationId;

    const drawDrone = (x, y, droneSize, target, threatLevel) => {
      ctx.save();
      const pulse = Math.sin(Date.now() / 300) * 0.3 + 0.7;
      ctx.shadowBlur = 30 * pulse;
      ctx.shadowColor = colors.error;
      
      [25, 18, 12].forEach((ringSize, idx) => {
        ctx.strokeStyle = idx === 0 ? `${colors.error}40` : idx === 1 ? `${colors.error}80` : colors.error;
        ctx.lineWidth = idx === 0 ? 2 : idx === 1 ? 3 : 4;
        ctx.beginPath();
        ctx.arc(x, y, droneSize + ringSize, 0, Math.PI * 2);
        ctx.stroke();
      });
      
      ctx.fillStyle = colors.error;
      ctx.beginPath();
      ctx.arc(x, y, droneSize, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = colors.text;
      ctx.beginPath();
      ctx.moveTo(x, y - droneSize * 0.6);
      ctx.lineTo(x - droneSize * 0.5, y + droneSize * 0.4);
      ctx.lineTo(x + droneSize * 0.5, y + droneSize * 0.4);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
      
      const boxX = x + 35, boxY = y - 35, boxWidth = 120, boxHeight = 70;
      ctx.strokeStyle = colors.error;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + droneSize + 10, y);
      ctx.lineTo(boxX, boxY + boxHeight / 2);
      ctx.stroke();
      
      ctx.fillStyle = 'rgba(255, 51, 102, 0.95)';
      ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
      ctx.strokeStyle = colors.error;
      ctx.lineWidth = 3;
      ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
      
      ctx.fillStyle = colors.text;
      ctx.font = 'bold 11px monospace';
      ctx.fillText(target.id || 'TGT-???', boxX + 5, boxY + 15);
      ctx.font = '9px monospace';
      ctx.fillText(`RNG: ${target.range}`, boxX + 5, boxY + 28);
      ctx.fillText(`BRG: ${target.bearing}`, boxX + 5, boxY + 40);
      ctx.fillText(`ALT: ${target.altitude}`, boxX + 5, boxY + 52);
      ctx.fillText(`SIZE: ${droneSize}m`, boxX + 5, boxY + 64);
      
      const threatColor = threatLevel === 'HIGH' ? colors.error : threatLevel === 'MEDIUM' ? colors.warning : colors.info;
      ctx.fillStyle = threatColor;
      ctx.fillRect(boxX + 68, boxY + 55, 45, 12);
      ctx.fillStyle = colors.primary;
      ctx.font = 'bold 9px monospace';
      ctx.fillText(threatLevel, boxX + 72, boxY + 64);
      ctx.restore();
    };

    const draw = () => {
      ctx.fillStyle = colors.surface;
      ctx.fillRect(0, 0, width, height);

      ctx.strokeStyle = 'rgba(0, 217, 255, 0.03)';
      ctx.lineWidth = 0.5;
      for (let i = 0; i < width; i += 15) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, height);
        ctx.stroke();
      }
      for (let i = 0; i < height; i += 15) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(width, i);
        ctx.stroke();
      }

      ctx.strokeStyle = colors.gridLine;
      ctx.lineWidth = 2;
      for (let i = 1; i <= 4; i++) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, (radius / 4) * i, 0, Math.PI * 2);
        ctx.stroke();
      }

      for (let i = 0; i < 12; i++) {
        const angle = (i * 30) * (Math.PI / 180);
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(centerX + radius * Math.cos(angle - Math.PI / 2), centerY + radius * Math.sin(angle - Math.PI / 2));
        ctx.stroke();
      }

      ctx.strokeStyle = colors.teal;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(centerX - radius, centerY);
      ctx.lineTo(centerX + radius, centerY);
      ctx.moveTo(centerX, centerY - radius);
      ctx.lineTo(centerX, centerY + radius);
      ctx.stroke();

      ctx.fillStyle = colors.textMuted;
      ctx.font = '9px monospace';
      for (let deg = 0; deg < 360; deg += 30) {
        const angle = (deg - 90) * (Math.PI / 180);
        const x = centerX + (radius + 20) * Math.cos(angle);
        const y = centerY + (radius + 20) * Math.sin(angle);
        ctx.fillText(`${deg}°`, x - 10, y + 4);
      }

      ctx.fillStyle = colors.teal;
      ctx.font = 'bold 12px monospace';
      ['10km', '20km', '30km', '40km'].forEach((label, i) => {
        ctx.fillText(label, centerX + 10, centerY - (radius / 4) * (i + 1) + 5);
      });

      ctx.font = 'bold 20px monospace';
      ctx.shadowBlur = 15;
      ctx.shadowColor = colors.teal;
      ctx.fillText('N', centerX - 10, centerY - radius - 15);
      ctx.fillText('E', centerX + radius + 20, centerY + 8);
      ctx.fillText('S', centerX - 10, centerY + radius + 25);
      ctx.fillText('W', centerX - radius - 30, centerY + 8);
      ctx.shadowBlur = 0;

      if (status?.is_running) {
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(angleRef.current);
        
        const gradient = ctx.createLinearGradient(0, 0, 0, -radius);
        gradient.addColorStop(0, 'transparent');
        gradient.addColorStop(0.2, 'rgba(0, 217, 255, 0.1)');
        gradient.addColorStop(0.6, 'rgba(0, 217, 255, 0.4)');
        gradient.addColorStop(0.9, 'rgba(0, 217, 255, 0.8)');
        gradient.addColorStop(1, colors.teal);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, radius, -Math.PI / 3, Math.PI / 10);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        
        angleRef.current += 0.04;
      }

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
          const droneSize = Math.max(12, Math.min(22, 25 - (altitude / 50)));
          const threatLevel = range < 5 ? 'HIGH' : range < 20 ? 'MEDIUM' : 'LOW';
          drawDrone(blipX, blipY, droneSize, target, threatLevel);
        }
      });

      animationId = requestAnimationFrame(draw);
    };

    draw();
    return () => { if (animationId) cancelAnimationFrame(animationId); };
  }, [colors, status, targets]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas ref={canvasRef} width={800} height={800} style={{ width: '100%', height: '100%', display: 'block' }} />
      {data && (
        <div style={{ position: 'absolute', top: 16, left: 16, fontSize: 11, padding: 12, borderRadius: 4, backgroundColor: 'rgba(0, 0, 0, 0.85)', border: `2px solid ${colors.teal}`, boxShadow: `0 0 15px ${colors.glowTeal}` }}>
          <div style={{ color: colors.teal, fontWeight: 'bold', marginBottom: 8, borderBottom: `1px solid ${colors.teal}`, paddingBottom: 4 }}>CURRENT SCAN</div>
          <div style={{ color: colors.text }}>RANGE: {data.range}</div>
          <div style={{ color: colors.text }}>BEARING: {data.bearing}</div>
          <div style={{ color: colors.text }}>TARGETS: {data.detections}</div>
          <div style={{ color: colors.text }}>ALTITUDE: {data.altitude}</div>
          <div style={{ color: colors.text }}>SIGNAL: {data.signalStrength}%</div>
          <div style={{ color: colors.text }}>CONF: {data.confidence}</div>
        </div>
      )}
      {targets.length > 0 && (
        <div style={{ position: 'absolute', top: 16, right: 16, fontSize: 13, padding: 12, borderRadius: 4, backgroundColor: 'rgba(255, 51, 102, 0.3)', border: `3px solid ${colors.error}`, boxShadow: `0 0 20px ${colors.error}`, animation: 'pulse 2s infinite' }}>
          <div style={{ color: colors.error, fontWeight: 'bold', textAlign: 'center' }}>⚠ THREAT ALERT ⚠</div>
          <div style={{ color: colors.text, fontSize: 11, marginTop: 4 }}>{targets.length} ACTIVE TARGET{targets.length > 1 ? 'S' : ''}</div>
        </div>
      )}
    </div>
  );
}

function SignalWaveform({ colors, status }) {
  const canvasRef = useRef(null);
  const dataRef = useRef(Array(100).fill(0.5));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d'), w = canvas.width, h = canvas.height;
    const draw = () => {
      ctx.fillStyle = colors.surface;
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = colors.gridLine;
      ctx.lineWidth = 0.5;
      for (let i = 0; i <= 4; i++) { ctx.beginPath(); ctx.moveTo(0, (h / 4) * i); ctx.lineTo(w, (h / 4) * i); ctx.stroke(); }
      if (status?.is_running) { dataRef.current.shift(); dataRef.current.push(Math.random()); }
      ctx.strokeStyle = colors.teal;
      ctx.lineWidth = 2;
      ctx.beginPath();
      dataRef.current.forEach((p, i) => {
        const x = (i / dataRef.current.length) * w, y = h / 2 + (p - 0.5) * h * 0.8;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.stroke();
      requestAnimationFrame(draw);
    };
    draw();
  }, [colors, status]);

  return <TacticalCard title="SIGNAL WAVEFORM" colors={colors}><canvas ref={canvasRef} width={300} height={140} style={{ width: '100%', display: 'block' }} /></TacticalCard>;
}

function FrequencyChart({ colors, status }) {
  const canvasRef = useRef(null);
  const dataRef = useRef(Array(40).fill(0).map(() => Math.random()));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d'), w = canvas.width, h = canvas.height, bars = 40;
    const draw = () => {
      ctx.fillStyle = colors.surface;
      ctx.fillRect(0, 0, w, h);
      const barW = w / bars;
      if (status?.is_running) dataRef.current = dataRef.current.map(v => v * 0.95 + Math.random() * 0.05);
      dataRef.current.forEach((v, i) => {
        const barH = v * h * 0.85;
        const intensity = v;
        const color = intensity > 0.7 ? colors.error : intensity > 0.5 ? colors.warning : intensity > 0.3 ? colors.info : colors.teal;
        ctx.fillStyle = color;
        ctx.fillRect(i * barW + 1, h - barH, barW - 2, barH);
      });
      requestAnimationFrame(draw);
    };
    draw();
  }, [colors, status]);

  return <TacticalCard title="FREQUENCY SPECTRUM" colors={colors}><canvas ref={canvasRef} width={300} height={120} style={{ width: '100%', display: 'block' }} /></TacticalCard>;
}

function LocationDisplay({ colors, data }) {
  return (
    <TacticalCard title="POSITION & LOCATION" colors={colors}>
      <div style={{ fontSize: 11 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <MapPin size={14} style={{ color: colors.teal }} />
          <div style={{ flex: 1 }}>
            <div style={{ color: colors.textMuted, fontSize: 9 }}>LATITUDE</div>
            <div style={{ color: colors.text, fontWeight: 'bold' }}>{data?.latitude ? `${data.latitude}° N` : '34.0522° N'}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <MapPin size={14} style={{ color: colors.teal }} />
          <div style={{ flex: 1 }}>
            <div style={{ color: colors.textMuted, fontSize: 9 }}>LONGITUDE</div>
            <div style={{ color: colors.text, fontWeight: 'bold' }}>{data?.longitude ? `${Math.abs(data.longitude)}° W` : '118.2437° W'}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Navigation size={14} style={{ color: colors.success }} />
          <div style={{ flex: 1 }}>
            <div style={{ color: colors.textMuted, fontSize: 9 }}>HEADING</div>
            <div style={{ color: colors.text, fontWeight: 'bold' }}>{data?.bearing || '000° N'}</div>
          </div>
        </div>
      </div>
    </TacticalCard>
  );
}

function TargetList({ colors, targets }) {
  return (
    <TacticalCard title={`TARGET TRACKING (${targets.length})`} colors={colors}>
      <div style={{ maxHeight: 200, overflowY: 'auto', fontSize: 10 }}>
        {targets.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 20, color: colors.textMuted }}>NO TARGETS</div>
        ) : (
          targets.map((t, i) => (
            <div key={i} style={{ marginBottom: 8, padding: 8, borderRadius: 4, backgroundColor: colors.primary, border: `2px solid ${colors.error}`, boxShadow: `0 0 8px ${colors.error}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontWeight: 'bold' }}>
                <span style={{ color: colors.error }}>{t.id}</span>
                <span style={{ color: colors.warning, fontSize: 9 }}>{t.type || 'DRONE'}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, color: colors.textMuted }}>
                <div>RNG: <span style={{ color: colors.text }}>{t.range}</span></div>
                <div>BRG: <span style={{ color: colors.text }}>{t.bearing}</span></div>
                <div>ALT: <span style={{ color: colors.text }}>{t.altitude}</span></div>
                <div>SPD: <span style={{ color: colors.text }}>{t.speed}</span></div>
              </div>
            </div>
          ))
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
    const ctx = canvas.getContext('2d'), w = canvas.width, h = canvas.height;
    const centerX = w / 2, centerY = h / 2, scale = 140;

    const draw = () => {
      ctx.fillStyle = colors.surface;
      ctx.fillRect(0, 0, w, h);
      
      ctx.strokeStyle = colors.gridLine;
      ctx.lineWidth = 0.5;
      for (let i = 0; i <= 4; i++) {
        ctx.beginPath(); ctx.moveTo((w / 4) * i, 0); ctx.lineTo((w / 4) * i, h); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, (h / 4) * i); ctx.lineTo(w, (h / 4) * i); ctx.stroke();
      }

      ctx.fillStyle = colors.success;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = colors.success;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 16, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = colors.success;
      ctx.font = 'bold 10px monospace';
      ctx.fillText('BASE', centerX + 22, centerY + 4);

      targets.forEach((t, idx) => {
        if (t.latitude && t.longitude) {
          const lat = parseFloat(t.latitude);
          const lon = parseFloat(t.longitude);
          const x = centerX + (lon - (-118.2437)) * scale;
          const y = centerY - (lat - 34.0522) * scale;
          
          const pulse = Math.sin(Date.now() / 200 + idx) * 4 + 12;
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
          
          ctx.strokeStyle = colors.error;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(x, y, pulse, 0, Math.PI * 2);
          ctx.stroke();
          
          ctx.fillStyle = colors.error;
          ctx.font = 'bold 9px monospace';
          ctx.fillText(t.id || `T${idx}`, x + 14, y - 2);
        }
      });

      requestAnimationFrame(draw);
    };
    draw();
  }, [colors, targets]);

  return (
    <TacticalCard title="GEOGRAPHIC MAP" colors={colors}>
      <canvas ref={canvasRef} width={300} height={180} style={{ width: '100%', display: 'block' }} />
      <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', fontSize: 9, color: colors.textMuted }}>
        <span>BASE: {targets.length > 0 ? `${targets.length} THREAT${targets.length > 1 ? 'S' : ''}` : 'CLEAR'}</span>
        <span>RANGE: 50km</span>
      </div>
    </TacticalCard>
  );
}

function SignalStrengthMeter({ colors, data }) {
  const strength = data?.signalStrength || 0;
  return (
    <TacticalCard title="SIGNAL STRENGTH" colors={colors}>
      <div style={{ fontSize: 11 }}>
        <div style={{ fontSize: 32, fontWeight: 'bold', color: colors.teal, marginBottom: 8 }}>{strength}%</div>
        <div style={{ height: 60, backgroundColor: colors.primary, borderRadius: 4, overflow: 'hidden', border: `1px solid ${colors.border}` }}>
          <div style={{ height: '100%', width: `${strength}%`, backgroundColor: strength > 70 ? colors.success : strength > 40 ? colors.warning : colors.error, transition: 'width 0.5s', boxShadow: `0 0 10px ${strength > 70 ? colors.success : strength > 40 ? colors.warning : colors.error}` }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: colors.textMuted, marginTop: 4 }}>
          <span>WEAK</span><span>STRONG</span>
        </div>
        {data && <div style={{ fontSize: 10, color: colors.textMuted, marginTop: 4 }}>CONFIDENCE: <span style={{ color: colors.teal }}>{data.confidence}</span></div>}
      </div>
    </TacticalCard>
  );
}

function Configuration({ config, loading, saveConfig, testRadar, testDarcy, colors }) {
  const [localConfig, setLocalConfig] = useState(config);
  useEffect(() => setLocalConfig(config), [config]);
  const updateValue = (path, val) => { const keys = path.split('.'), c = JSON.parse(JSON.stringify(localConfig)); let cur = c; for (let i = 0; i < keys.length - 1; i++) cur = cur[keys[i]]; cur[keys[keys.length - 1]] = val; setLocalConfig(c); };
  if (!localConfig) return <div style={{ padding: 24, color: colors.text }}>LOADING...</div>;

  return (
    <div style={{ padding: 24 }}>
      <TacticalCard title="DARCY GATEWAY CONFIGURATION" colors={colors}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <TacticalInput label="BACKEND URL" value={localConfig.darcy?.backend_url || ''} onChange={(e) => updateValue('darcy.backend_url', e.target.value)} colors={colors} testId="darcy-url-input" />
          <TacticalInput label="GATEWAY TOKEN" type="password" value={localConfig.darcy?.gateway_token || ''} onChange={(e) => updateValue('darcy.gateway_token', e.target.value)} colors={colors} testId="gateway-token-input" />
          <TacticalButton onClick={testDarcy} disabled={loading} color={colors.teal} icon={Cloud} label="TEST CONNECTION" />
        </div>
      </TacticalCard>
      <TacticalCard title="RADAR SYSTEM" colors={colors} style={{ marginTop: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 'bold', marginBottom: 6, letterSpacing: '0.1em', color: colors.teal }}>RADAR TYPE</label>
            <select value={localConfig.radar?.type || 'mock'} onChange={(e) => updateValue('radar.type', e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 4, fontSize: 12, fontFamily: 'monospace', backgroundColor: colors.surface, border: `1px solid ${colors.border}`, color: colors.text }} data-testid="radar-type-select">
              <option value="mock">MOCK (TESTING)</option>
              <option value="serial">SERIAL PORT (RS-232/485)</option>
              <option value="tcp">TCP/IP SOCKET</option>
              <option value="file">FILE INPUT</option>
            </select>
          </div>
          <TacticalButton onClick={testRadar} disabled={loading} color={colors.success} icon={Radio} label="TEST RADAR CONNECTION" />
        </div>
      </TacticalCard>
      <button onClick={() => saveConfig(localConfig)} disabled={loading} style={{ width: '100%', marginTop: 16, padding: '16px 24px', borderRadius: 4, fontWeight: 'bold', fontSize: 13, letterSpacing: '0.15em', backgroundColor: colors.teal, color: colors.primary, border: `2px solid ${colors.teal}`, boxShadow: `0 0 20px ${colors.glowTeal}`, cursor: 'pointer' }} data-testid="save-config-button">SAVE CONFIGURATION</button>
    </div>
  );
}

function LogsView({ logs, fetchLogs, colors }) {
  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 20, fontWeight: 'bold', color: colors.teal, letterSpacing: '0.1em' }}>ACTIVITY LOG</h2>
        <button onClick={fetchLogs} style={{ padding: '8px 16px', borderRadius: 4, fontSize: 11, backgroundColor: colors.accent, color: colors.teal, border: `1px solid ${colors.teal}`, cursor: 'pointer' }}>REFRESH</button>
      </div>
      <TacticalCard title="TRANSMISSION LOG" colors={colors}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', fontSize: 11, fontFamily: 'monospace' }}>
            <thead style={{ borderBottom: `2px solid ${colors.border}` }}>
              <tr>
                <th style={{ padding: 12, textAlign: 'left', color: colors.teal }}>TIMESTAMP</th>
                <th style={{ padding: 12, textAlign: 'left', color: colors.teal }}>TYPE</th>
                <th style={{ padding: 12, textAlign: 'left', color: colors.teal }}>DATA</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr><td colSpan={3} style={{ padding: 32, textAlign: 'center', color: colors.textMuted }}>NO LOGS</td></tr>
              ) : (
                logs.map((log, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${colors.border}` }}>
                    <td style={{ padding: 12, color: colors.text }}>{new Date(log.timestamp).toLocaleString()}</td>
                    <td style={{ padding: 12 }}><span style={{ padding: '4px 8px', borderRadius: 2, fontSize: 10, fontWeight: 'bold', backgroundColor: colors.teal, color: colors.primary }}>{log.data_type}</span></td>
                    <td style={{ padding: 12, color: colors.textMuted, maxWidth: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.data.substring(0, 60)}...</td>
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

function StatusCard({ title, value, subtext, color, colors, testId, icon: Icon }) {
  return (
    <TacticalCard title={title} colors={colors}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ width: 16, height: 16, borderRadius: '50%', backgroundColor: color, animation: 'pulse 2s infinite' }} />
        <div style={{ fontSize: 10, color: colors.textMuted }}>{subtext}</div>
      </div>
      <div style={{ fontSize: 24, fontWeight: 'bold', color: color, textTransform: 'uppercase' }} data-testid={testId}>{value}</div>
    </TacticalCard>
  );
}

function NavButton({ active, onClick, icon: Icon, label, colors, testId }) {
  return (
    <button onClick={onClick} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 4, fontSize: 11, fontWeight: 500, letterSpacing: '0.05em', backgroundColor: active ? colors.accent : 'transparent', color: active ? colors.teal : colors.text, border: `1px solid ${active ? colors.teal : 'transparent'}`, boxShadow: active ? `0 0 10px ${colors.glowTeal}` : 'none', cursor: 'pointer', transition: 'all 0.2s' }} data-testid={testId}>
      <Icon size={18} /><span>{label}</span>
    </button>
  );
}

function TacticalCard({ title, children, colors, style = {} }) {
  return (
    <div style={{ borderRadius: 8, padding: 16, backgroundColor: colors.surface, border: `1px solid ${colors.border}`, boxShadow: `0 0 10px ${colors.gridLine}`, ...style }}>
      <h3 style={{ fontSize: 11, fontWeight: 'bold', marginBottom: 12, letterSpacing: '0.12em', color: colors.teal, borderBottom: `1px solid ${colors.border}`, paddingBottom: 8 }}>{title}</h3>
      {children}
    </div>
  );
}

function MetricBox({ label, value, unit, valueColor, colors }) {
  return (
    <div>
      <p style={{ fontSize: 10, marginBottom: 4, letterSpacing: '0.05em', color: colors.textMuted }}>{label}</p>
      <p style={{ fontSize: 24, fontWeight: 'bold', color: valueColor || colors.teal }}>{typeof value === 'number' ? value.toLocaleString() : value}</p>
      <p style={{ fontSize: 10, letterSpacing: '0.05em', color: colors.textMuted }}>{unit}</p>
    </div>
  );
}

function TacticalButton({ onClick, disabled, color, icon: Icon, label, small = false, testId }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: small ? 4 : 6, padding: small ? '8px' : '12px 16px', borderRadius: 4, fontSize: small ? 10 : 11, fontWeight: 'bold', letterSpacing: '0.1em', backgroundColor: 'transparent', color: color, border: `2px solid ${color}`, boxShadow: disabled ? 'none' : `0 0 10px ${color}`, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1, transition: 'all 0.2s' }} data-testid={testId}>
      {Icon && <Icon size={small ? 12 : 14} />}<span>{label}</span>
    </button>
  );
}

function TacticalInput({ label, type = 'text', value, onChange, colors, testId, ...props }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 'bold', marginBottom: 6, letterSpacing: '0.1em', color: colors.teal }}>{label}</label>
      <input type={type} value={value} onChange={onChange} style={{ width: '100%', padding: '10px 12px', borderRadius: 4, fontSize: 12, fontFamily: 'monospace', backgroundColor: colors.surface, border: `1px solid ${colors.border}`, color: colors.text, outline: 'none' }} data-testid={testId} {...props} />
    </div>
  );
}

function formatUptime(s) {
  const p = s.split(':');
  if (p.length === 3) {
    const h = parseInt(p[0]), m = parseInt(p[1]), sec = parseInt(p[2].split('.')[0]);
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${sec}s`;
    return `${sec}s`;
  }
  return s;
}

export default App;
