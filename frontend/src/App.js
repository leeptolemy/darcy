import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Activity, Radio, Cloud, Settings, PlayCircle, StopCircle, AlertCircle, CheckCircle, Send, FileText, Shield, Radar, Navigation, MapPin, TrendingUp, Zap } from 'lucide-react';
import { RadarDisplay } from './components/RadarDisplay';
import { Globe3D } from './components/Globe3D';
import { CircularGauge } from './components/CircularGauge';
import { ThreatMatrix } from './components/ThreatMatrix';
import '@/App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
const API = `${BACKEND_URL}/api`;

const DARCY_COLORS = {
  primary: '#0A1628', secondary: '#132B47', accent: '#1E4A6F', teal: '#00D9FF', surface: '#0D1B2A',
  border: '#1E3A5F', text: '#E8F4F8', textMuted: '#8BA3B8', success: '#00FF87', warning: '#FFB800',
  error: '#FF3366', info: '#00D9FF', gridLine: 'rgba(0, 217, 255, 0.15)', glowTeal: 'rgba(0, 217, 255, 0.3)'
};

function App() {
  const [activeView, setActiveView] = useState('dashboard');
  const [status, setStatus] = useState(null);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    fetchStatus(); fetchConfig(); fetchLogs();
    const interval = setInterval(() => fetchStatus(), 2000);
    return () => clearInterval(interval);
  }, []);

  const fetchStatus = async () => { try { const r = await axios.get(`${API}/gateway/status`); setStatus(r.data); } catch (e) {} };
  const fetchConfig = async () => { try { const r = await axios.get(`${API}/gateway/config`); setConfig(r.data); } catch (e) {} };
  const fetchLogs = async () => { try { const r = await axios.get(`${API}/gateway/logs?limit=50`); setLogs(r.data.logs || []); } catch (e) {} };
  const startGateway = async () => { setLoading(true); try { await axios.post(`${API}/gateway/start`); fetchStatus(); } catch (e) {} setLoading(false); };
  const stopGateway = async () => { setLoading(true); try { await axios.post(`${API}/gateway/stop`); fetchStatus(); } catch (e) {} setLoading(false); };
  const manualPublish = async () => { setLoading(true); try { await axios.post(`${API}/gateway/publish-manual`); } catch (e) {} setLoading(false); };
  const testRadar = async () => { setLoading(true); try { await axios.post(`${API}/gateway/test-radar`); } catch (e) {} setLoading(false); };
  const testDarcy = async () => { setLoading(true); try { await axios.post(`${API}/gateway/test-darcy`); } catch (e) {} setLoading(false); };
  const saveConfig = async (c) => { setLoading(true); try { await axios.post(`${API}/gateway/config`, { config: c }); fetchConfig(); } catch (e) {} setLoading(false); };

  const getStatusColor = () => status?.is_running && status?.radar_status === 'monitoring' ? DARCY_COLORS.success : status?.is_running ? DARCY_COLORS.warning : DARCY_COLORS.error;
  const getStatusText = () => status?.is_running && status?.radar_status === 'monitoring' ? 'ACTIVE' : status?.is_running ? 'STANDBY' : 'OFFLINE';

  return (
    <div style={{ backgroundColor: DARCY_COLORS.primary, color: DARCY_COLORS.text, fontFamily: 'monospace', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ backgroundColor: DARCY_COLORS.secondary, borderBottom: `2px solid ${DARCY_COLORS.teal}`, boxShadow: `0 0 20px ${DARCY_COLORS.glowTeal}`, padding: '12px 24px' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div style={{ width: 50, height: 50, borderRadius: '50%', backgroundColor: DARCY_COLORS.teal, boxShadow: `0 0 15px ${DARCY_COLORS.teal}`, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                <Radar size={30} style={{ color: DARCY_COLORS.primary }} strokeWidth={2.5} />
                <div style={{ position: 'absolute', top: -2, right: -2, width: 12, height: 12, borderRadius: '50%', backgroundColor: DARCY_COLORS.success, animation: 'pulse 2s infinite' }} />
              </div>
              <div>
                <h1 style={{ fontSize: 28, fontWeight: 'bold', letterSpacing: '0.15em', color: DARCY_COLORS.teal, textShadow: `0 0 10px ${DARCY_COLORS.glowTeal}` }}>DARCY</h1>
                <p style={{ fontSize: 11, color: DARCY_COLORS.textMuted, letterSpacing: '0.1em' }}>DRONE RADAR CONTROL SYSTEM</p>
              </div>
            </div>
            <div style={{ marginLeft: 30, padding: '8px 16px', borderRadius: 4, backgroundColor: 'rgba(0, 217, 255, 0.1)', border: `1px solid ${DARCY_COLORS.teal}` }}>
              <div className="flex items-center gap-2">
                <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: getStatusColor(), animation: 'pulse 2s infinite' }} />
                <span style={{ fontSize: 12, fontWeight: 'bold', letterSpacing: '0.1em', color: getStatusColor() }}>{getStatusText()}</span>
              </div>
            </div>
            <div style={{ marginLeft: 15, display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 4, backgroundColor: status?.radar_status === 'monitoring' ? 'rgba(0, 255, 135, 0.1)' : 'rgba(255, 179, 0, 0.1)', border: `1px solid ${status?.radar_status === 'monitoring' ? DARCY_COLORS.success : DARCY_COLORS.warning}` }}>
              <span style={{ fontSize: 11, color: DARCY_COLORS.textMuted }}>MOCK DATA</span>
              <div style={{ width: 40, height: 20, borderRadius: 20, backgroundColor: status?.radar_status === 'monitoring' ? DARCY_COLORS.success : DARCY_COLORS.textMuted, display: 'flex', alignItems: 'center', padding: '0 2px', transition: 'all 0.3s' }}>
                <div style={{ width: 16, height: 16, borderRadius: '50%', backgroundColor: '#fff', marginLeft: status?.radar_status === 'monitoring' ? 20 : 0, transition: 'all 0.3s' }} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 'bold', color: status?.radar_status === 'monitoring' ? DARCY_COLORS.success : DARCY_COLORS.warning }}>{status?.radar_status === 'monitoring' ? 'ON' : 'OFF'}</span>
            </div>
          </div>
          <div className="flex items-center gap-6" style={{ fontSize: 11, color: DARCY_COLORS.textMuted }}>
            <div className="flex items-center gap-2"><Shield size={14} style={{ color: DARCY_COLORS.teal }} /><span>SECURE</span></div>
            <div className="flex items-center gap-2"><div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: DARCY_COLORS.success }} /><span>NOMINAL</span></div>
            <div style={{ fontFamily: 'monospace' }}>{new Date().toLocaleTimeString('en-US', { hour12: false })}</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex" style={{ height: 'calc(100vh - 76px)' }}>
        {/* Sidebar */}
        <div style={{ width: 280, backgroundColor: DARCY_COLORS.secondary, borderRight: `1px solid ${DARCY_COLORS.border}`, display: 'flex', flexDirection: 'column' }}>
          <nav style={{ padding: 16, flex: 1 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <NavButton active={activeView === 'dashboard'} onClick={() => setActiveView('dashboard')} icon={Activity} label="TACTICAL DASHBOARD" colors={DARCY_COLORS} />
              <NavButton active={activeView === 'config'} onClick={() => setActiveView('config')} icon={Settings} label="SYSTEM CONFIG" colors={DARCY_COLORS} />
              <NavButton active={activeView === 'logs'} onClick={() => setActiveView('logs')} icon={FileText} label="ACTIVITY LOG" colors={DARCY_COLORS} />
            </div>
          </nav>
          <div style={{ padding: 16, borderTop: `1px solid ${DARCY_COLORS.border}`, fontSize: 11, color: DARCY_COLORS.textMuted }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><span>VERSION</span><span style={{ color: DARCY_COLORS.teal }}>2.0.0</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>BUILD</span><span style={{ color: DARCY_COLORS.teal }}>2025.11.03</span></div>
          </div>
        </div>

        {/* Main Panel */}
        <div style={{ flex: 1, overflow: 'auto', backgroundColor: DARCY_COLORS.primary }}>
          {activeView === 'dashboard' && <AdvancedDashboard status={status} loading={loading} getStatusColor={getStatusColor} getStatusText={getStatusText} startGateway={startGateway} stopGateway={stopGateway} manualPublish={manualPublish} testRadar={testRadar} testDarcy={testDarcy} colors={DARCY_COLORS} />}
          {activeView === 'config' && <Configuration config={config} loading={loading} saveConfig={saveConfig} testRadar={testRadar} testDarcy={testDarcy} colors={DARCY_COLORS} />}
          {activeView === 'logs' && <LogsView logs={logs} fetchLogs={fetchLogs} colors={DARCY_COLORS} />}
        </div>
      </div>
    </div>
  );
}

function AdvancedDashboard({ status, loading, getStatusColor, getStatusText, startGateway, stopGateway, manualPublish, testRadar, testDarcy, colors }) {
  const data = status?.last_published_data;
  const targets = data?.targets || [];

  return (
    <div style={{ padding: 20 }}>
      {/* Main Grid Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr 340px', gap: 16, height: 'calc(100vh - 200px)' }}>
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <MissionOverview colors={colors} status={status} targets={targets} />
          <SignalWaveform colors={colors} status={status} />
          <FrequencySpectrum colors={colors} status={status} />
          <Globe3D colors={colors} targets={targets} />
        </div>

        {/* Center - Radar */}
        <TacticalCard title="RADAR SWEEP - 360° COVERAGE" colors={colors} style={{ padding: 12 }}>
          <RadarDisplay colors={colors} status={status} data={data} targets={targets} />
        </TacticalCard>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <RadarStationInfo colors={colors} data={data} />
          <TargetCards colors={colors} targets={targets} />
          <TacticalCard title="THREAT MATRIX" colors={colors}>
            <ThreatMatrix colors={colors} targets={targets} />
          </TacticalCard>
          <GeoMap colors={colors} targets={targets} data={data} />
        </div>
      </div>

      {/* Bottom Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr) 2fr', gap: 12, marginTop: 16 }}>
        <TacticalCard title="HEALTH" colors={colors} style={{ padding: 8 }}>
          <CircularGauge value={96} max={100} label="SYS" unit="%" colors={colors} />
        </TacticalCard>
        <TacticalCard title="SCAN" colors={colors} style={{ padding: 8 }}>
          <CircularGauge value={6} max={12} label="RPM" unit="" colors={colors} />
        </TacticalCard>
        <TacticalCard title="COVERAGE" colors={colors} style={{ padding: 8 }}>
          <CircularGauge value={360} max={360} label="DEG" unit="°" colors={colors} />
        </TacticalCard>
        <TacticalCard title="MSGS" colors={colors} style={{ padding: 8 }}>
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 24, fontWeight: 'bold', color: colors.teal }}>{status?.stats?.published_total || 0}</div>
            <div style={{ fontSize: 9, color: colors.textMuted }}>SENT</div>
          </div>
        </TacticalCard>
        <TacticalCard title="DETECT" colors={colors} style={{ padding: 8 }}>
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 24, fontWeight: 'bold', color: colors.success }}>{status?.stats?.detections_total || 0}</div>
            <div style={{ fontSize: 9, color: colors.textMuted }}>TOTAL</div>
          </div>
        </TacticalCard>
        <TacticalCard title="STATUS" colors={colors} style={{ padding: 8 }}>
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <CheckCircle size={32} style={{ color: colors.success, margin: '0 auto' }} />
            <div style={{ fontSize: 9, color: colors.textMuted, marginTop: 4 }}>OK</div>
          </div>
        </TacticalCard>
        <TacticalCard title="MISSION CONTROL" colors={colors} style={{ padding: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {!status?.is_running ? (
              <TacticalButton onClick={startGateway} disabled={loading} color={colors.success} icon={PlayCircle} label="START" small />
            ) : (
              <TacticalButton onClick={stopGateway} disabled={loading} color={colors.error} icon={StopCircle} label="STOP" small />
            )}
            <TacticalButton onClick={manualPublish} disabled={loading || !status?.is_running} color={colors.info} icon={Send} label="PUB" small />
            <TacticalButton onClick={testRadar} disabled={loading} color={colors.warning} icon={Radio} label="RDR" small />
            <TacticalButton onClick={testDarcy} disabled={loading} color={colors.teal} icon={Cloud} label="DRC" small />
          </div>
        </TacticalCard>
      </div>
    </div>
  );
}

function MissionOverview({ colors, status, targets }) {
  const threatLevel = targets.length === 0 ? 'CLEAR' : targets.length < 2 ? 'GUARDED' : targets.length < 4 ? 'ELEVATED' : 'HIGH';
  const threatColor = threatLevel === 'CLEAR' ? colors.success : threatLevel === 'GUARDED' ? colors.info : threatLevel === 'ELEVATED' ? colors.warning : colors.error;
  const closestTarget = targets.reduce((min, t) => {
    const r = parseFloat(t.range?.match(/([\d.]+)/)?.[1] || 999);
    return r < min ? r : min;
  }, 999);

  return (
    <TacticalCard title="MISSION OVERVIEW" colors={colors}>
      <div style={{ fontSize: 11, lineHeight: 1.6 }}>
        <DataRow label="ACTIVE TARGETS" value={targets.length} colors={colors} highlight />
        <DataRow label="TOTAL SCANS" value={status?.stats?.detections_total || 0} colors={colors} />
        <DataRow label="COVERAGE" value="360°" colors={colors} />
        <DataRow label="UPTIME" value={status?.uptime ? formatUptime(status.uptime) : 'N/A'} colors={colors} />
        <div style={{ marginTop: 12, padding: 8, borderRadius: 4, backgroundColor: `${threatColor}20`, border: `1px solid ${threatColor}` }}>
          <div style={{ fontSize: 10, color: colors.textMuted }}>THREAT LEVEL</div>
          <div style={{ fontSize: 16, fontWeight: 'bold', color: threatColor }}>{threatLevel}</div>
        </div>
        {targets.length > 0 && (
          <div style={{ marginTop: 8, fontSize: 10, color: colors.textMuted }}>
            <div>CLOSEST: <span style={{ color: colors.error }}>{closestTarget.toFixed(2)}km</span></div>
          </div>
        )}
      </div>
    </TacticalCard>
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

function FrequencySpectrum({ colors, status }) {
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

function RadarStationInfo({ colors, data }) {
  return (
    <TacticalCard title="RADAR STATION STATUS" colors={colors}>
      <div style={{ textAlign: 'center', marginBottom: 12 }}>
        <div style={{ width: 80, height: 60, margin: '0 auto', border: `2px solid ${colors.teal}`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary }}>
          <Radar size={40} style={{ color: colors.teal }} />
        </div>
      </div>
      <div style={{ fontSize: 10, lineHeight: 1.8 }}>
        <DataRow label="STATION ID" value="RDR-ALPHA-01" colors={colors} />
        <DataRow label="LOCATION" value="34.05°N 118.24°W" colors={colors} />
        <DataRow label="ELEVATION" value="125m ASL" colors={colors} />
        <DataRow label="POWER" value="100kW" colors={colors} />
        <DataRow label="SCAN RATE" value="6 RPM" colors={colors} />
        <DataRow label="MODE" value="CONTINUOUS" colors={colors} />
      </div>
    </TacticalCard>
  );
}

function TargetCards({ colors, targets }) {
  return (
    <TacticalCard title={`TARGET TRACKING (${targets.length}/10)`} colors={colors}>
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

function GeoMap({ colors, targets, data }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d'), w = canvas.width, h = canvas.height;
    const centerX = w / 2, centerY = h / 2, scale = 140;

    const draw = () => {
      ctx.fillStyle = colors.surface;
      ctx.fillRect(0, 0, w, h);
      
      // Grid
      ctx.strokeStyle = colors.gridLine;
      ctx.lineWidth = 0.5;
      for (let i = 0; i <= 4; i++) {
        ctx.beginPath(); ctx.moveTo((w / 4) * i, 0); ctx.lineTo((w / 4) * i, h); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, (h / 4) * i); ctx.lineTo(w, (h / 4) * i); ctx.stroke();
      }

      // Base station
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

      // Targets
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
  }, [colors, targets, data]);

  return (
    <TacticalCard title="GEOGRAPHIC POSITIONING" colors={colors}>
      <canvas ref={canvasRef} width={300} height={180} style={{ width: '100%', display: 'block' }} />
      <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', fontSize: 9, color: colors.textMuted }}>
        <span>BASE: {targets.length > 0 ? `${targets.length} THREAT${targets.length > 1 ? 'S' : ''}` : 'CLEAR'}</span>
        <span>RANGE: 50km</span>
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
          <TacticalInput label="BACKEND URL" value={localConfig.darcy?.backend_url || ''} onChange={(e) => updateValue('darcy.backend_url', e.target.value)} colors={colors} />
          <TacticalInput label="GATEWAY TOKEN" type="password" value={localConfig.darcy?.gateway_token || ''} onChange={(e) => updateValue('darcy.gateway_token', e.target.value)} colors={colors} />
          <TacticalButton onClick={testDarcy} disabled={loading} color={colors.teal} icon={Cloud} label="TEST CONNECTION" />
        </div>
      </TacticalCard>
      <div style={{ marginTop: 16 }}>
        <button onClick={() => saveConfig(localConfig)} disabled={loading} style={{ width: '100%', padding: '16px 24px', borderRadius: 4, fontWeight: 'bold', fontSize: 13, letterSpacing: '0.15em', backgroundColor: colors.teal, color: colors.primary, border: `2px solid ${colors.teal}`, boxShadow: `0 0 20px ${colors.glowTeal}`, cursor: 'pointer' }}>SAVE CONFIGURATION</button>
      </div>
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
              {logs.length === 0 ? <tr><td colSpan={3} style={{ padding: 32, textAlign: 'center', color: colors.textMuted }}>NO LOGS</td></tr> : logs.map((log, i) => <tr key={i} style={{ borderBottom: `1px solid ${colors.border}` }}><td style={{ padding: 12, color: colors.text }}>{new Date(log.timestamp).toLocaleString()}</td><td style={{ padding: 12 }}><span style={{ padding: '4px 8px', borderRadius: 2, fontSize: 10, fontWeight: 'bold', backgroundColor: colors.teal, color: colors.primary }}>{log.data_type}</span></td><td style={{ padding: 12, color: colors.textMuted, maxWidth: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.data.substring(0, 60)}...</td></tr>)}
            </tbody>
          </table>
        </div>
      </TacticalCard>
    </div>
  );
}

function NavButton({ active, onClick, icon: Icon, label, colors }) { return <button onClick={onClick} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 4, fontSize: 11, fontWeight: 500, letterSpacing: '0.05em', backgroundColor: active ? colors.accent : 'transparent', color: active ? colors.teal : colors.text, border: `1px solid ${active ? colors.teal : 'transparent'}`, boxShadow: active ? `0 0 10px ${colors.glowTeal}` : 'none', cursor: 'pointer', transition: 'all 0.2s' }}><Icon size={18} /><span>{label}</span></button>; }
function TacticalCard({ title, children, colors, style = {} }) { return <div style={{ borderRadius: 8, padding: 16, backgroundColor: colors.surface, border: `1px solid ${colors.border}`, boxShadow: `0 0 10px ${colors.gridLine}`, ...style }}><h3 style={{ fontSize: 11, fontWeight: 'bold', marginBottom: 12, letterSpacing: '0.12em', color: colors.teal, borderBottom: `1px solid ${colors.border}`, paddingBottom: 8 }}>{title}</h3>{children}</div>; }
function DataRow({ label, value, colors, highlight }) { return <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: `1px solid ${colors.border}` }}><span style={{ color: colors.textMuted }}>{label}:</span><span style={{ color: highlight ? colors.teal : colors.text, fontWeight: highlight ? 'bold' : 'normal' }}>{value}</span></div>; }
function TacticalButton({ onClick, disabled, color, icon: Icon, label, small = false }) { return <button onClick={onClick} disabled={disabled} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: small ? '8px' : '12px 16px', borderRadius: 4, fontSize: small ? 10 : 11, fontWeight: 'bold', letterSpacing: '0.1em', backgroundColor: 'transparent', color: color, border: `2px solid ${color}`, boxShadow: disabled ? 'none' : `0 0 10px ${color}`, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1, transition: 'all 0.2s' }}>{Icon && <Icon size={small ? 12 : 14} />}<span>{label}</span></button>; }
function TacticalInput({ label, type = 'text', value, onChange, colors, ...props }) { return <div><label style={{ display: 'block', fontSize: 11, fontWeight: 'bold', marginBottom: 6, letterSpacing: '0.1em', color: colors.teal }}>{label}</label><input type={type} value={value} onChange={onChange} style={{ width: '100%', padding: '10px 12px', borderRadius: 4, fontSize: 12, fontFamily: 'monospace', backgroundColor: colors.surface, border: `1px solid ${colors.border}`, color: colors.text, outline: 'none' }} {...props} /></div>; }
function formatUptime(s) { const p = s.split(':'); if (p.length === 3) { const h = parseInt(p[0]), m = parseInt(p[1]), sec = parseInt(p[2].split('.')[0]); if (h > 0) return `${h}h ${m}m`; if (m > 0) return `${m}m ${sec}s`; return `${sec}s`; } return s; }

export default App;
