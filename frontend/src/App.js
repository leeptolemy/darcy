import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Activity, Radio, Cloud, Settings, PlayCircle, StopCircle, AlertCircle, CheckCircle, Send, FileText, Shield, Radar, Navigation, MapPin, Wifi, Battery, Clock, Key, Link, AlertTriangle, Share2 } from 'lucide-react';
import { Waveform, FreqSpec, GeoMap, ThreatMatrix, LocationWidget, AltitudeChart, SpeedHistogram } from './components/widgets';
import { RadarSweep } from './components/RadarSweep';
import { AIPredictionWidget } from './components/AIPrediction';
import { DangerZoneMap, LocryptShareModal } from './components/LocryptShare';
import { TargetDetailModal } from './components/TargetDetailModal';
import '@/App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
const API = `${BACKEND_URL}/api`;

const COLORS = {
  primary: '#0A1628',
  surface: '#0D1B2A',
  border: '#1E3A5F',
  teal: '#00D9FF',
  text: '#E8F4F8',
  textMuted: '#4A5F7F',
  warning: '#FFB800',
  error: '#FF3366',
  success: '#4A9B8E',
  gridLine: 'rgba(0, 217, 255, 0.08)'
};

function App() {
  const [activeView, setActiveView] = useState('dashboard');
  const [status, setStatus] = useState(null);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [events, setEvents] = useState([]);
  const [showSetup, setShowSetup] = useState(false);
  const [gatewayToken, setGatewayToken] = useState('');
  const [gatewayUrl, setGatewayUrl] = useState('');
  const [viewMode, setViewMode] = useState('standard');
  const [showLocryptShare, setShowLocryptShare] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState(null); // 'standard' or 'easy'

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(), 2000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const r = await axios.get(`${API}/gateway/status`);
      setStatus(r.data);
    } catch (e) {}
    
    try {
      const r = await axios.get(`${API}/gateway/config`);
      setConfig(r.data);
      setGatewayToken(r.data?.darcy?.gateway_token || '');
      setGatewayUrl(r.data?.darcy?.backend_url || '');
    } catch (e) {}
    
    try {
      const r = await axios.get(`${API}/gateway/logs?limit=10`);
      setLogs(r.data.logs || []);
    } catch (e) {}
  };

  const addEvent = (type, msg) => {
    const time = new Date().toLocaleTimeString();
    setEvents(prev => [{ time, type, msg }, ...prev.slice(0, 19)]);
  };

  const saveGateway = async () => {
    setLoading(true);
    try {
      const newCfg = JSON.parse(JSON.stringify(config || {}));
      if (!newCfg.darcy) newCfg.darcy = {};
      newCfg.darcy.gateway_token = gatewayToken;
      newCfg.darcy.backend_url = gatewayUrl;
      await axios.post(`${API}/gateway/config`, { config: newCfg });
      addEvent('CONFIG', 'Gateway token saved');
      setShowSetup(false);
      fetchData();
    } catch (e) {
      addEvent('ERROR', 'Failed to save gateway');
    }
    setLoading(false);
  };

  const startGateway = async () => {
    setLoading(true);
    try {
      await axios.post(`${API}/gateway/start`);
      addEvent('SYSTEM', 'Gateway started');
      fetchData();
    } catch (e) {}
    setLoading(false);
  };

  const stopGateway = async () => {
    setLoading(true);
    try {
      await axios.post(`${API}/gateway/stop`);
      addEvent('SYSTEM', 'Gateway stopped');
      fetchData();
    } catch (e) {}
    setLoading(false);
  };

  const manualPublish = async () => {
    setLoading(true);
    try {
      await axios.post(`${API}/gateway/publish-manual`);
      addEvent('DARCY', 'Manual publish');
    } catch (e) {}
    setLoading(false);
  };

  const getStatusColor = () => {
    if (status?.is_running && status?.radar_status === 'monitoring') return COLORS.success;
    if (status?.is_running) return COLORS.warning;
    return COLORS.error;
  };

  const getStatusText = () => {
    if (status?.is_running && status?.radar_status === 'monitoring') return 'ACTIVE';
    if (status?.is_running) return 'STANDBY';
    return 'OFFLINE';
  };

  const data = status?.last_published_data;
  const targets = data?.targets || [];
  const hasGateway = config?.darcy?.gateway_token && config?.darcy?.gateway_token.length > 10;

  useEffect(() => {
    if (targets.length > 0) {
      targets.forEach(t => addEvent('DETECT', `${t.id} @ ${t.range}`));
    }
  }, [data?.timestamp]);

  return (
    <div style={{ background: COLORS.primary, color: COLORS.text, fontFamily: 'monospace', height: '100vh', overflow: 'hidden' }}>
      <Header 
        status={status} 
        getStatusColor={getStatusColor} 
        getStatusText={getStatusText} 
        setShowSetup={setShowSetup}
        hasGateway={hasGateway}
        viewMode={viewMode}
        setViewMode={setViewMode}
        setShowLocryptShare={setShowLocryptShare}
        colors={COLORS} 
      />

      {showSetup && (
        <GatewaySetupModal 
          gatewayToken={gatewayToken}
          setGatewayToken={setGatewayToken}
          gatewayUrl={gatewayUrl}
          setGatewayUrl={setGatewayUrl}
          saveGateway={saveGateway}
          setShowSetup={setShowSetup}
          loading={loading}
          colors={COLORS}
        />
      )}

      {showLocryptShare && (
        <LocryptShareModal 
          show={showLocryptShare}
          onClose={() => setShowLocryptShare(false)}
          colors={COLORS}
        />
      )}

      {selectedTarget && (
        <TargetDetailModal
          target={selectedTarget}
          onClose={() => setSelectedTarget(null)}
          colors={COLORS}
        />
      )}

      <div style={{ display: 'flex', height: 'calc(100vh - 76px)' }}>
        <Sidebar activeView={activeView} setActiveView={setActiveView} setShowSetup={setShowSetup} status={status} colors={COLORS} />
        
        <div style={{ flex: 1, overflow: 'auto', background: COLORS.primary }}>
          {activeView === 'dashboard' && (
            viewMode === 'easy' ? (
              <EasyModeDashboard 
                status={status}
                loading={loading}
                getStatusColor={getStatusColor}
                getStatusText={getStatusText}
                startGateway={startGateway}
                stopGateway={stopGateway}
                manualPublish={manualPublish}
                data={data}
                targets={targets}
                hasGateway={hasGateway}
                setSelectedTarget={setSelectedTarget}
                colors={COLORS}
              />
            ) : (
              <Dashboard 
                status={status}
                loading={loading}
                getStatusColor={getStatusColor}
                startGateway={startGateway}
                stopGateway={stopGateway}
                manualPublish={manualPublish}
                data={data}
                targets={targets}
                events={events}
                logs={logs}
                hasGateway={hasGateway}
                setSelectedTarget={setSelectedTarget}
                colors={COLORS}
              />
            )
          )}
          {activeView === 'config' && <ConfigView config={config} colors={COLORS} />}
          {activeView === 'logs' && <LogsView logs={logs} colors={COLORS} />}
        </div>
      </div>
    </div>
  );
}

function Header({ status, getStatusColor, getStatusText, setShowSetup, hasGateway, viewMode, setViewMode, setShowLocryptShare, colors }) {
  return (
    <div style={{ background: colors.surface, borderBottom: '2px solid ' + colors.teal, boxShadow: '0 0 20px rgba(0, 217, 255, 0.3)', padding: '8px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: colors.teal, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            <Radar size={24} style={{ color: colors.primary }} />
            <div style={{ position: 'absolute', top: -2, right: -2, width: 8, height: 8, borderRadius: '50%', background: colors.success, animation: 'pulse 2s infinite' }} />
          </div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 'bold', letterSpacing: '0.15em', color: colors.teal, margin: 0 }}>DARCY</h1>
            <p style={{ fontSize: 8, color: colors.textMuted, margin: 0 }}>DRONE RADAR CONTROL</p>
          </div>
          <div style={{ marginLeft: 20, padding: '4px 12px', borderRadius: 3, background: 'rgba(0, 217, 255, 0.1)', border: '1px solid ' + colors.teal }}>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: getStatusColor(), animation: 'pulse 2s infinite' }} />
              <span style={{ fontSize: 10, fontWeight: 'bold', color: getStatusColor() }}>{getStatusText()}</span>
            </div>
          </div>
          <div style={{ marginLeft: 10, padding: '4px 10px', borderRadius: 3, background: status?.radar_status === 'monitoring' ? 'rgba(0, 255, 135, 0.1)' : 'rgba(255, 179, 0, 0.1)', border: '1px solid ' + (status?.radar_status === 'monitoring' ? colors.success : colors.warning) }}>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 9 }}>
              <span style={{ color: colors.textMuted }}>MOCK</span>
              <div style={{ width: 30, height: 14, borderRadius: 14, background: status?.radar_status === 'monitoring' ? colors.success : colors.textMuted }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#fff', marginLeft: status?.radar_status === 'monitoring' ? 16 : 0, marginTop: 2, transition: 'all 0.3s' }} />
              </div>
              <span style={{ fontWeight: 'bold', color: status?.radar_status === 'monitoring' ? colors.success : colors.warning }}>
                {status?.radar_status === 'monitoring' ? 'ON' : 'OFF'}
              </span>
            </div>
          </div>
          <button 
            onClick={() => setViewMode(viewMode === 'standard' ? 'easy' : 'standard')}
            style={{ 
              marginLeft: 10, 
              padding: '6px 12px', 
              borderRadius: 3, 
              background: viewMode === 'standard' ? colors.teal + '20' : colors.warning + '20', 
              border: '1px solid ' + (viewMode === 'standard' ? colors.teal : colors.warning), 
              display: 'flex', 
              gap: 6, 
              alignItems: 'center', 
              fontSize: 9, 
              cursor: 'pointer', 
              color: viewMode === 'standard' ? colors.teal : colors.warning, 
              fontWeight: 'bold' 
            }} 
            data-testid="view-mode-toggle"
          >
            <Activity size={12} />
            <span>{viewMode === 'standard' ? 'STANDARD' : 'EASY'} MODE</span>
          </button>
          <button 
            onClick={() => setShowSetup(true)} 
            style={{ 
              marginLeft: 10, 
              padding: '6px 12px', 
              borderRadius: 3, 
              background: hasGateway ? colors.success + '20' : colors.warning + '20', 
              border: '1px solid ' + (hasGateway ? colors.success : colors.warning), 
              display: 'flex', 
              gap: 6, 
              alignItems: 'center', 
              fontSize: 9, 
              cursor: 'pointer', 
              color: hasGateway ? colors.success : colors.warning, 
              fontWeight: 'bold' 
            }} 
            data-testid="gateway-setup-btn"
          >
            <Link size={12} />
            <span>{hasGateway ? 'GATEWAY OK' : 'SETUP GATEWAY'}</span>
          </button>
          <button 
            onClick={() => setShowLocryptShare(true)} 
            style={{ 
              marginLeft: 10, 
              padding: '6px 12px', 
              borderRadius: 3, 
              background: colors.warning + '20', 
              border: '1px solid ' + colors.warning, 
              display: 'flex', 
              gap: 6, 
              alignItems: 'center', 
              fontSize: 9, 
              cursor: 'pointer', 
              color: colors.warning, 
              fontWeight: 'bold' 
            }} 
            data-testid="locrypt-share-btn"
          >
            <Share2 size={12} />
            <span>SHARE TO LOCRYPT</span>
          </button>
        </div>
        <div style={{ display: 'flex', gap: 16, fontSize: 9, color: colors.textMuted }}>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <Shield size={12} style={{ color: colors.teal }} />
            <span>SECURE</span>
          </div>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: colors.success }} />
            <span>NOMINAL</span>
          </div>
          <span>{new Date().toLocaleTimeString('en-US', { hour12: false })}</span>
        </div>
      </div>
    </div>
  );
}

function GatewaySetupModal({ gatewayToken, setGatewayToken, gatewayUrl, setGatewayUrl, saveGateway, setShowSetup, loading, colors }) {
  return (
    <div 
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        background: 'rgba(0, 0, 0, 0.8)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        zIndex: 1000 
      }} 
      onClick={() => setShowSetup(false)}
    >
      <div 
        style={{ 
          background: colors.surface, 
          border: '2px solid ' + colors.teal, 
          borderRadius: 8, 
          padding: 24, 
          maxWidth: 500, 
          width: '90%', 
          boxShadow: '0 0 40px ' + colors.teal 
        }} 
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <Key size={32} style={{ color: colors.teal }} />
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 'bold', color: colors.teal, margin: 0 }}>LOCRYPT GATEWAY SETUP</h2>
            <p style={{ fontSize: 10, color: colors.textMuted, margin: 0 }}>Connect DARCY to LoCrypt Messenger</p>
          </div>
        </div>
        
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 'bold', marginBottom: 6, color: colors.teal }}>GATEWAY TOKEN</label>
          <input 
            type="text" 
            value={gatewayToken} 
            onChange={(e) => setGatewayToken(e.target.value)}
            placeholder="Paste your gateway token here (UUID format)"
            style={{ 
              width: '100%', 
              padding: '10px 12px', 
              borderRadius: 4, 
              fontSize: 11, 
              fontFamily: 'monospace', 
              background: colors.primary, 
              border: '1px solid ' + colors.border, 
              color: colors.text, 
              outline: 'none' 
            }}
            data-testid="gateway-token-input"
          />
          <p style={{ fontSize: 9, color: colors.textMuted, marginTop: 6 }}>
            Get this token from "Register New Gateway" in LoCrypt's Sensor Gateway Management
          </p>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 'bold', marginBottom: 6, color: colors.teal }}>LOCRYPT BACKEND URL</label>
          <input 
            type="text" 
            value={gatewayUrl} 
            onChange={(e) => setGatewayUrl(e.target.value)}
            placeholder="https://api.locrypt.example.com"
            style={{ 
              width: '100%', 
              padding: '10px 12px', 
              borderRadius: 4, 
              fontSize: 11, 
              fontFamily: 'monospace', 
              background: colors.primary, 
              border: '1px solid ' + colors.border, 
              color: colors.text, 
              outline: 'none' 
            }}
          />
        </div>

        <div style={{ background: colors.primary, border: '1px solid ' + colors.border, borderRadius: 4, padding: 12, marginBottom: 20 }}>
          <div style={{ fontSize: 10, fontWeight: 'bold', color: colors.teal, marginBottom: 8 }}>KEY METRICS PUBLISHED TO LOCRYPT:</div>
          <div style={{ fontSize: 9, color: colors.textMuted, lineHeight: 1.6 }}>
            • Radar ID (Station identifier)<br/>
            • Detections (Number of active targets)<br/>
            • Range (Closest threat distance)<br/>
            • Bearing (Direction of primary threat)<br/>
            • Altitude (Height of primary threat)<br/>
            • Speed (Velocity of primary threat)<br/>
            • Signal Strength (Detection confidence %)<br/>
            • Threat Level (HIGH/MEDIUM/LOW)<br/>
            • Timestamp (Detection time)
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button 
            onClick={saveGateway} 
            disabled={!gatewayToken || loading}
            style={{ 
              flex: 1, 
              padding: '12px', 
              borderRadius: 4, 
              fontSize: 12, 
              fontWeight: 'bold', 
              background: COLORS.teal, 
              color: COLORS.primary, 
              border: 'none', 
              cursor: gatewayToken && !loading ? 'pointer' : 'not-allowed', 
              opacity: gatewayToken && !loading ? 1 : 0.5 
            }}
            data-testid="save-gateway-btn"
          >
            SAVE GATEWAY
          </button>
          <button 
            onClick={() => setShowSetup(false)} 
            style={{ 
              flex: 1, 
              padding: '12px', 
              borderRadius: 4, 
              fontSize: 12, 
              fontWeight: 'bold', 
              background: 'transparent', 
              color: colors.teal, 
              border: '1px solid ' + colors.teal, 
              cursor: 'pointer' 
            }}
          >
            CANCEL
          </button>
        </div>
      </div>
    </div>
  );
}

function Sidebar({ activeView, setActiveView, setShowSetup, status, colors }) {
  return (
    <div style={{ width: 64, background: colors.surface, borderRight: '1px solid ' + colors.border, display: 'flex', flexDirection: 'column' }}>
      <nav style={{ padding: 8, flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <NavButton active={activeView === 'dashboard'} onClick={() => setActiveView('dashboard')} icon={Activity} colors={colors} />
        <NavButton active={activeView === 'config'} onClick={() => setActiveView('config')} icon={Settings} colors={colors} />
        <NavButton active={activeView === 'logs'} onClick={() => setActiveView('logs')} icon={FileText} colors={colors} />
      </nav>
      <div style={{ marginTop: 'auto', padding: '6px 0', borderTop: '1px solid ' + colors.border, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <button 
          onClick={() => setShowSetup(true)} 
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4 }}
          title="Gateway Setup"
        >
          <Key size={20} style={{ color: status?.darcy_connected ? colors.success : colors.warning }} />
        </button>
      </div>
    </div>
  );
}

function Dashboard({ status, loading, getStatusColor, startGateway, stopGateway, manualPublish, data, targets, events, logs, hasGateway, setSelectedTarget, colors }) {
  return (
    <div style={{ padding: 8 }}>
      {!hasGateway && (
        <div style={{ 
          marginBottom: 12, 
          padding: 12, 
          background: colors.warning + '20', 
          border: '2px solid ' + colors.warning, 
          borderRadius: 4, 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center' 
        }}>
          <div style={{ fontSize: 11, color: colors.warning }}>
            <div style={{ fontWeight: 'bold', marginBottom: 4 }}>⚠ LOCRYPT GATEWAY NOT CONFIGURED</div>
            <div style={{ fontSize: 9, color: colors.textMuted }}>
              Click "SETUP GATEWAY" to connect with LoCrypt Messenger and publish sensor data to chat groups
            </div>
          </div>
          <Key size={24} style={{ color: colors.warning }} />
        </div>
      )}

      <DenseGrid 
        status={status}
        loading={loading}
        getStatusColor={getStatusColor}
        startGateway={startGateway}
        stopGateway={stopGateway}
        manualPublish={manualPublish}
        data={data}
        targets={targets}
        events={events}
        logs={logs}
        hasGateway={hasGateway}
        setSelectedTarget={setSelectedTarget}
        colors={colors}
      />
    </div>
  );
}

function EasyModeDashboard({ status, loading, getStatusColor, getStatusText, startGateway, stopGateway, manualPublish, data, targets, hasGateway, colors }) {
  return (
    <div style={{ padding: 20 }}>
      {!hasGateway && (
        <div style={{ 
          marginBottom: 16, 
          padding: 12, 
          background: colors.warning + '20', 
          border: '2px solid ' + colors.warning, 
          borderRadius: 4, 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center' 
        }}>
          <div style={{ fontSize: 11, color: colors.warning }}>
            <div style={{ fontWeight: 'bold', marginBottom: 4 }}>⚠ LOCRYPT GATEWAY NOT CONFIGURED</div>
            <div style={{ fontSize: 9, color: colors.textMuted }}>
              Click "SETUP GATEWAY" to connect with LoCrypt Messenger
            </div>
          </div>
          <Key size={24} style={{ color: colors.warning }} />
        </div>
      )}

      {/* Top Status Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 16 }}>
        <StatusCard title="GATEWAY" value={getStatusText()} subtext="GW-001" color={getStatusColor()} colors={colors} icon={getStatusColor() === colors.success ? CheckCircle : AlertCircle} />
        <StatusCard title="RADAR" value={status?.radar_status || 'OFFLINE'} subtext="RDR-ALPHA" color={status?.radar_status === 'monitoring' ? colors.success : colors.error} colors={colors} icon={status?.radar_status === 'monitoring' ? CheckCircle : AlertCircle} />
        <StatusCard title="LOCRYPT" value={hasGateway ? 'LINKED' : 'NOT SETUP'} subtext="GATEWAY" color={hasGateway ? colors.success : colors.warning} colors={colors} icon={hasGateway ? Cloud : AlertTriangle} />
        <StatusCard title="UPTIME" value={status?.uptime ? formatUptime(status.uptime) : 'N/A'} subtext="RUNTIME" color={colors.teal} colors={colors} icon={Activity} />
      </div>

      {/* Main 3-Column Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr 340px', gap: 16, height: 'calc(100vh - 320px)' }}>
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <TacticalCard title="SIGNAL WAVEFORM" colors={colors}>
            <Waveform colors={colors} status={status} />
          </TacticalCard>
          <TacticalCard title="FREQUENCY SPECTRUM" colors={colors}>
            <FreqSpec colors={colors} status={status} />
          </TacticalCard>
          <TacticalCard title="POSITION & LOCATION" colors={colors}>
            <LocationWidget colors={colors} data={data} />
          </TacticalCard>
        </div>

        {/* Center - Radar */}
        <TacticalCard title="RADAR SWEEP - 360° COVERAGE" colors={colors}>
          <RadarSweep colors={colors} status={status} data={data} targets={targets} />
        </TacticalCard>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <TacticalCard title={`TARGET TRACKING (${targets.length})`} colors={colors}>
            <TargetListPanel targets={targets} colors={colors} />
          </TacticalCard>
          <TacticalCard title="GEOGRAPHIC MAP" colors={colors}>
            <GeoMap colors={colors} targets={targets} />
          </TacticalCard>
          <TacticalCard title="SIGNAL STRENGTH" colors={colors}>
            <SignalStrengthPanel data={data} colors={colors} />
          </TacticalCard>
        </div>
      </div>

      {/* Bottom Controls */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginTop: 16 }}>
        <TacticalCard title="SENSOR METRICS" colors={colors}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            <MetricBox label="DETECTIONS" value={status?.stats?.detections_total || 0} unit="TARGETS" colors={colors} />
            <MetricBox label="PUBLISHED" value={status?.stats?.published_total || 0} unit="MSGS" colors={colors} />
            <MetricBox label="ERRORS" value={status?.stats?.errors_total || 0} unit="EVENTS" valueColor={colors.error} colors={colors} />
          </div>
        </TacticalCard>
        <TacticalCard title="MISSION CONTROL" colors={colors}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {!status?.is_running ? (
              <TacticalButton onClick={startGateway} disabled={loading} color={colors.success} icon={PlayCircle} label="START" testId="start-button" />
            ) : (
              <TacticalButton onClick={stopGateway} disabled={loading} color={colors.error} icon={StopCircle} label="STOP" testId="stop-button" />
            )}
            <TacticalButton onClick={manualPublish} disabled={loading || !status?.is_running} color={colors.teal} icon={Send} label="PUBLISH" testId="publish-button" />
            <TacticalButton onClick={() => {}} disabled={loading} color={colors.warning} icon={Radio} label="TEST" />
          </div>
        </TacticalCard>
      </div>
    </div>
  );
}

function DenseGrid({ status, loading, getStatusColor, startGateway, stopGateway, manualPublish, data, targets, events, logs, hasGateway, colors }) {
  const threatLevel = targets.length === 0 ? 'CLEAR' : targets.length < 2 ? 'GUARDED' : targets.length < 4 ? 'ELEVATED' : 'HIGH';
  const threatColor = threatLevel === 'CLEAR' ? colors.success : threatLevel === 'GUARDED' ? colors.teal : threatLevel === 'ELEVATED' ? colors.warning : colors.error;

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(16, 1fr)', gap: 8, gridAutoRows: 'minmax(100px, auto)' }}>
        {/* Left Column 1 - Mission + Signal + Stats */}
        <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Panel title="MISSION" colors={colors}>
            <MissionPanel targets={targets} status={status} threatLevel={threatLevel} threatColor={threatColor} colors={colors} />
          </Panel>
          <Panel title="SIGNAL" colors={colors}>
            <Waveform colors={colors} status={status} />
          </Panel>
          <Panel title="STATS" colors={colors}>
            <StatsPanel status={status} colors={colors} />
          </Panel>
        </div>

        {/* Left Column 2 - Drone Model + Freq Spec + Track Quality */}
        <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Panel title="DRONE MODEL" colors={colors}>
            <DroneModelPanel targets={targets} colors={colors} />
          </Panel>
          <Panel title="FREQ SPEC" colors={colors}>
            <FreqSpec colors={colors} status={status} />
          </Panel>
          <Panel title="TRACK Q" colors={colors}>
            <TrackQualityPanel targets={targets} colors={colors} />
          </Panel>
        </div>

        {/* Left Column 3 - RF Freq + Doppler + Trajectory */}
        <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Panel title="RF FREQ" colors={colors}>
            <RFFrequencyPanel colors={colors} />
          </Panel>
          <Panel title="DOPPLER" colors={colors}>
            <DopplerPanel targets={targets} colors={colors} />
          </Panel>
          <Panel title="TRAJECTORY" colors={colors}>
            <TrajectoryPanel targets={targets} data={data} colors={colors} />
          </Panel>
        </div>

        {/* Left Column 4 - Battery + Altitude + Weather */}
        <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Panel title="BATTERY" colors={colors}>
            <BatteryPanel targets={targets} colors={colors} />
          </Panel>
          <Panel title="ALTITUDE" colors={colors}>
            <AltitudeChart colors={colors} targets={targets} />
          </Panel>
          <Panel title="WEATHER" colors={colors}>
            <WeatherPanel colors={colors} />
          </Panel>
        </div>

        {/* Center - Large Radar (spans 8 columns, 3 rows) */}
        <div style={{ gridColumn: 'span 8', gridRow: 'span 3', background: colors.surface, border: '1px solid ' + colors.border, borderRadius: 4, padding: 8 }}>
          <div style={{ fontSize: 9, fontWeight: 'bold', color: colors.teal, borderBottom: '1px solid ' + colors.border, paddingBottom: 4, marginBottom: 6 }}>
            RADAR SWEEP - 360° COVERAGE
          </div>
          <RadarSweep colors={colors} status={status} data={data} targets={targets} />
        </div>

        {/* Right Column 1 - Threat Matrix + Bearing + System */}
        <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Panel title="THREAT MTX" colors={colors}>
            <ThreatMatrix colors={colors} targets={targets} />
          </Panel>
          <Panel title="BEARING" colors={colors}>
            <BearingPanel targets={targets} colors={colors} />
          </Panel>
          <Panel title="SYSTEM" colors={colors}>
            <SystemHealthPanel colors={colors} />
          </Panel>
        </div>

        {/* Right Column 2 - SIGINT + Position + Power */}
        <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Panel title="SIGINT" colors={colors}>
            <SigintPanel colors={colors} />
          </Panel>
          <Panel title="POSITION" colors={colors}>
            <LocationWidget colors={colors} data={data} />
          </Panel>
          <Panel title="POWER" colors={colors}>
            <PowerPanel colors={colors} />
          </Panel>
        </div>

        {/* Right Column 3 - Targets + Geo Map + Network */}
        <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Panel title="TARGETS" colors={colors}>
            <TargetListPanel targets={targets} colors={colors} />
          </Panel>
          <Panel title="GEO MAP" colors={colors}>
            <GeoMap colors={colors} targets={targets} />
          </Panel>
          <Panel title="DANGER ZONES" colors={colors}>
            <DangerZoneMap colors={colors} data={data} targets={targets} />
          </Panel>
          <Panel title="NETWORK" colors={colors}>
            <NetworkPanel colors={colors} />
          </Panel>
        </div>

        {/* Right Column 4 - Signal Strength + Alert Log + Airspace */}
        <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Panel title="SIGNAL STR" colors={colors}>
            <SignalStrengthPanel data={data} colors={colors} />
          </Panel>
          <Panel title="ALERT LOG" colors={colors}>
            <AlertLogPanel targets={targets} colors={colors} />
          </Panel>
          <Panel title="AIRSPACE" colors={colors}>
            <AirspacePanel targets={targets} colors={colors} />
          </Panel>
        </div>

        {/* Bottom Row - Full Width Panels */}
        <Panel title="EVENT LOG" colors={colors} span={8}>
          <EventLogPanel events={events} colors={colors} />
        </Panel>

        <Panel title="LOCRYPT TX" colors={colors} span={4}>
          <LocryptTxPanel status={status} logs={logs} hasGateway={hasGateway} colors={colors} />
        </Panel>

        <Panel title="SECTOR COV" colors={colors} span={2}>
          <SectorCoveragePanel targets={targets} colors={colors} />
        </Panel>

        <Panel title="SPEED DIST" colors={colors} span={2}>
          <SpeedHistogram colors={colors} targets={targets} />
        </Panel>

        <Panel title="CORRELATION" colors={colors} span={4}>
          <CorrelationPanel targets={targets} colors={colors} />
        </Panel>

        <Panel title="TIMELINE" colors={colors} span={2}>
          <TimelinePanel status={status} colors={colors} />
        </Panel>

        <Panel title="EM SPECTRUM" colors={colors} span={2}>
          <EMSpectrumPanel colors={colors} />
        </Panel>
        
        <Panel title="AI PREDICTION" colors={colors} span={4}>
          <AIPredictionWidget colors={colors} />
        </Panel>
        
        <Panel title="LOCRYPT DATA" colors={colors} span={2}>
          <LocryptDataPanel data={data} targets={targets} colors={colors} />
        </Panel>
      </div>

      {/* Bottom Control Bar */}
      <BottomControls 
        status={status}
        loading={loading}
        startGateway={startGateway}
        stopGateway={stopGateway}
        manualPublish={manualPublish}
        hasGateway={hasGateway}
        targets={targets}
        colors={colors}
      />
    </>
  );
}

function BottomControls({ status, loading, startGateway, stopGateway, manualPublish, hasGateway, targets, colors }) {
  return (
    <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: 'repeat(14, 1fr)', gap: 6 }}>
      <ControlButton 
        label="START" 
        color={status?.is_running ? colors.textMuted : colors.success} 
        onClick={startGateway} 
        disabled={status?.is_running || loading}
        testId="start-button"
      />
      <ControlButton 
        label="STOP" 
        color={status?.is_running ? colors.error : colors.textMuted} 
        onClick={stopGateway} 
        disabled={!status?.is_running || loading}
        testId="stop-button"
      />
      <ControlButton 
        label="PUB" 
        color={colors.teal} 
        onClick={manualPublish} 
        disabled={!status?.is_running || loading}
        testId="publish-button"
      />
      <ControlButton label="RADAR" color={colors.warning} onClick={() => {}} disabled={loading} />
      <ControlButton label="DARCY" color={colors.teal} onClick={() => {}} disabled={loading} />
      
      <StatusBox label="DETECT" value={status?.stats?.detections_total || 0} color={colors.teal} colors={colors} />
      <StatusBox label="MSGS" value={status?.stats?.published_total || 0} color={colors.teal} colors={colors} />
      <StatusBox label="ERRORS" value={status?.stats?.errors_total || 0} color={colors.error} colors={colors} />
      <StatusBox icon={CheckCircle} label="OK" color={colors.success} colors={colors} />
      <StatusBox icon={Shield} label="SEC" color={colors.teal} colors={colors} />
      <StatusBox icon={Clock} label={`${new Date().getHours()}:${String(new Date().getMinutes()).padStart(2, '0')}`} color={colors.teal} colors={colors} />
      <StatusBox icon={Battery} label="92%" color={colors.success} colors={colors} />
      <StatusBox icon={Wifi} label="OK" color={colors.success} colors={colors} />
      <StatusBox icon={Cloud} label={hasGateway ? 'GW' : 'NO'} color={hasGateway ? colors.success : colors.textMuted} colors={colors} />
    </div>
  );
}

// All panel components
function MissionPanel({ targets, status, threatLevel, threatColor, colors }) {
  return (
    <div style={{ fontSize: 10 }}>
      <DataLine label="TARGETS" value={targets.length} colors={colors} />
      <DataLine label="DETECTS" value={status?.stats?.detections_total || 0} colors={colors} />
      <DataLine label="UPTIME" value={status?.uptime ? formatUptime(status.uptime) : 'N/A'} colors={colors} />
      <div style={{ 
        marginTop: 6, 
        padding: 4, 
        background: threatColor + '20', 
        border: '1px solid ' + threatColor, 
        borderRadius: 2, 
        textAlign: 'center', 
        fontSize: 11, 
        fontWeight: 'bold', 
        color: threatColor 
      }}>
        {threatLevel}
      </div>
    </div>
  );
}

function DroneModelPanel({ targets, colors }) {
  return (
    <div style={{ fontSize: 9 }}>
      {targets.length > 0 ? (
        <>
          <div style={{ fontWeight: 'bold', color: colors.teal }}>DJI Phantom 4</div>
          <DataLine label="CONF" value="87%" colors={colors} />
          <DataLine label="ROTORS" value="4" colors={colors} />
          <DataLine label="TYPE" value="Quad" colors={colors} />
        </>
      ) : (
        <div style={{ color: colors.textMuted, textAlign: 'center', paddingTop: 10 }}>NO DATA</div>
      )}
    </div>
  );
}

function RFFrequencyPanel({ colors }) {
  return (
    <div style={{ fontSize: 9 }}>
      <DataLine label="PRIMARY" value="2.4GHz" colors={colors} />
      <DataLine label="SECOND" value="5.8GHz" colors={colors} />
      <DataLine label="BW" value="20MHz" colors={colors} />
      <div style={{ marginTop: 4, fontSize: 8 }}>CH 1-3 [███░░░░]</div>
      <div style={{ fontSize: 8 }}>CH 6-8 [░░███░░]</div>
    </div>
  );
}

function BatteryPanel({ targets, colors }) {
  return (
    <div style={{ fontSize: 9 }}>
      {targets.length > 0 ? (
        <>
          <div style={{ fontSize: 16, fontWeight: 'bold', color: colors.teal }}>45%</div>
          <div style={{ height: 6, background: colors.primary, borderRadius: 2, marginTop: 4, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: '45%', background: colors.warning }} />
          </div>
          <DataLine label="REMAIN" value="~18min" colors={colors} />
          <DataLine label="AIRTIME" value="32min" colors={colors} />
        </>
      ) : (
        <div style={{ color: colors.textMuted }}>N/A</div>
      )}
    </div>
  );
}

function SigintPanel({ colors }) {
  return (
    <div style={{ fontSize: 8 }}>
      <DataLine label="SIGNALS" value="3" colors={colors} />
      <div style={{ marginTop: 4, color: colors.textMuted }}>2.4GHz Wi-Fi</div>
      <div style={{ color: colors.textMuted }}>5.8GHz Video</div>
      <div style={{ color: colors.textMuted }}>433MHz Telem</div>
      <DataLine label="ENCRYPT" value="WPA2" colors={colors} />
    </div>
  );
}

function DopplerPanel({ targets, colors }) {
  return (
    <div style={{ fontSize: 9 }}>
      <DataLine label="MOVING" value={targets.length} colors={colors} />
      <DataLine label="APPROACH" value={targets.filter(t => parseInt(t.speed) > 50).length} colors={colors} />
      <DataLine label="FASTEST" value={targets.length > 0 ? Math.max(...targets.map(t => parseInt(t.speed) || 0)) + 'kts' : '0'} colors={colors} />
    </div>
  );
}

function BearingPanel({ targets, colors }) {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return (
    <div style={{ fontSize: 8 }}>
      {directions.map((s, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: colors.textMuted }}>{s}</span>
          <span style={{ color: colors.text }}>
            {targets.filter(t => {
              const b = parseInt(t.bearing);
              return b >= i * 45 && b < (i + 1) * 45;
            }).length}
          </span>
        </div>
      ))}
    </div>
  );
}

function TargetListPanel({ targets, colors }) {
  return (
    <div style={{ fontSize: 8, maxHeight: 140, overflowY: 'auto' }}>
      {targets.length === 0 ? (
        <div style={{ color: colors.textMuted, textAlign: 'center', paddingTop: 20 }}>NO TARGETS</div>
      ) : (
        targets.map((t, i) => (
          <div key={i} style={{ marginBottom: 4, padding: 4, background: colors.primary, border: '1px solid ' + colors.error, borderRadius: 2 }}>
            <div style={{ fontWeight: 'bold', color: colors.error }}>{t.id}</div>
            <div style={{ color: colors.textMuted }}>RNG:{t.range} BRG:{t.bearing}</div>
            <div style={{ color: colors.textMuted }}>ALT:{t.altitude} SPD:{t.speed}</div>
          </div>
        ))
      )}
    </div>
  );
}

function SignalStrengthPanel({ data, colors }) {
  const strength = data?.signalStrength || 0;
  return (
    <div style={{ fontSize: 9 }}>
      <div style={{ fontSize: 20, fontWeight: 'bold', color: colors.teal }}>{strength}%</div>
      <div style={{ height: 30, background: colors.primary, borderRadius: 2, overflow: 'hidden', marginTop: 4 }}>
        <div style={{ 
          height: '100%', 
          width: strength + '%', 
          background: strength > 70 ? colors.success : strength > 40 ? colors.warning : colors.error, 
          transition: 'width 0.5s' 
        }} />
      </div>
      <div style={{ fontSize: 7, color: colors.textMuted, marginTop: 2 }}>CONF: {data?.confidence || 'N/A'}</div>
    </div>
  );
}

function EventLogPanel({ events, colors }) {
  return (
    <div style={{ fontSize: 8, maxHeight: 100, overflowY: 'auto', fontFamily: 'monospace' }}>
      {events.length === 0 ? (
        <div style={{ color: colors.textMuted }}>No events</div>
      ) : (
        events.map((e, i) => (
          <div key={i} style={{ padding: '2px 0', borderBottom: '1px solid ' + colors.border }}>
            <span style={{ color: colors.textMuted }}>{e.time}</span>
            {' '}<span style={{ color: colors.warning }}>[{e.type}]</span>
            {' '}<span style={{ color: colors.text }}>{e.msg}</span>
          </div>
        ))
      )}
    </div>
  );
}

function LocryptTxPanel({ status, logs, hasGateway, colors }) {
  const txStatus = hasGateway ? (status?.darcy_connected ? 'LINKED' : 'READY') : 'NOT SETUP';
  return (
    <div style={{ fontSize: 8 }}>
      <DataLine label="STATUS" value={txStatus} colors={colors} />
      <DataLine label="PUBLISHED" value={status?.stats?.published_total || 0} colors={colors} />
      <DataLine label="SUCCESS" value="99.2%" colors={colors} />
      <DataLine label="LATENCY" value="45ms" colors={colors} />
      <div style={{ marginTop: 4, maxHeight: 40, overflowY: 'auto' }}>
        {logs.slice(0, 3).map((lg, i) => (
          <div key={i} style={{ fontSize: 7, color: colors.textMuted, padding: '1px 0' }}>
            {new Date(lg.timestamp).toLocaleTimeString()} ✓
          </div>
        ))}
      </div>
    </div>
  );
}

function StatsPanel({ status, colors }) {
  return (
    <div style={{ fontSize: 9 }}>
      <DataLine label="DETECT" value={status?.stats?.detections_total || 0} colors={colors} />
      <DataLine label="FALSE+" value="23.5%" colors={colors} />
      <DataLine label="ACCUR" value="89%" colors={colors} />
    </div>
  );
}

function TrackQualityPanel({ targets, colors }) {
  return (
    <div style={{ fontSize: 8 }}>
      {targets.slice(0, 2).map((t, i) => (
        <div key={i} style={{ marginBottom: 4 }}>
          <div style={{ color: colors.error, fontWeight: 'bold' }}>{t.id}</div>
          <div style={{ height: 4, background: colors.primary, borderRadius: 1 }}>
            <div style={{ height: '100%', width: (85 - i * 10) + '%', background: colors.success }} />
          </div>
          <div style={{ color: colors.textMuted, fontSize: 7 }}>{85 - i * 10}% quality</div>
        </div>
      ))}
    </div>
  );
}

function TrajectoryPanel({ targets, data, colors }) {
  return (
    <div style={{ fontSize: 8 }}>
      {targets.length > 0 ? (
        <>
          <DataLine label="VECTOR" value={data?.bearing} colors={colors} />
          <DataLine label="SPEED" value={data?.speed} colors={colors} />
          <div style={{ marginTop: 4, color: colors.textMuted }}>
            +30s: {data?.latitude ? (parseFloat(data.latitude) + 0.01).toFixed(4) : 'N/A'}°N
          </div>
        </>
      ) : (
        <div style={{ color: colors.textMuted }}>N/A</div>
      )}
    </div>
  );
}

function WeatherPanel({ colors }) {
  return (
    <div style={{ fontSize: 8 }}>
      <DataLine label="TEMP" value="24°C" colors={colors} />
      <DataLine label="WIND" value="15kts W" colors={colors} />
      <DataLine label="VIS" value="10km" colors={colors} />
    </div>
  );
}

function SystemHealthPanel({ colors }) {
  return (
    <div style={{ fontSize: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: colors.textMuted }}>TX</span><span style={{ color: colors.success }}>✓</span></div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: colors.textMuted }}>RX</span><span style={{ color: colors.success }}>✓</span></div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: colors.textMuted }}>ANT</span><span style={{ color: colors.success }}>✓</span></div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: colors.textMuted }}>CPU</span><span style={{ color: colors.teal }}>34%</span></div>
    </div>
  );
}

function PowerPanel({ colors }) {
  return (
    <div style={{ fontSize: 8 }}>
      <DataLine label="AC" value="230V" colors={colors} />
      <DataLine label="DRAW" value="2.85kW" colors={colors} />
      <div style={{ marginTop: 4, fontSize: 7 }}>BATT [████░] 92%</div>
    </div>
  );
}

function NetworkPanel({ colors }) {
  return (
    <div style={{ fontSize: 8 }}>
      <DataLine label="LATENCY" value="45ms" colors={colors} />
      <DataLine label="UPLINK" value="89%" colors={colors} />
      <DataLine label="DOWNLINK" value="78%" colors={colors} />
    </div>
  );
}

function AlertLogPanel({ targets, colors }) {
  return (
    <div style={{ fontSize: 7, maxHeight: 80, overflowY: 'auto' }}>
      {targets.length > 0 ? (
        targets.map((t, i) => (
          <div key={i} style={{ padding: '2px 0', borderBottom: '1px solid ' + colors.border }}>
            <span style={{ color: colors.error }}>⚠</span> {t.id} @ {t.range}
          </div>
        ))
      ) : (
        <div style={{ color: colors.textMuted, textAlign: 'center', paddingTop: 10 }}>NO ALERTS</div>
      )}
    </div>
  );
}

function AirspacePanel({ targets, colors }) {
  return (
    <div style={{ fontSize: 8 }}>
      <DataLine label="ZONE" value="Class B" colors={colors} />
      <DataLine label="AUTH" value="FAA" colors={colors} />
      <div style={{ marginTop: 4, color: targets.length > 0 ? colors.error : colors.success, fontSize: 7 }}>
        VIOLATIONS: {targets.length}
      </div>
    </div>
  );
}

function SectorCoveragePanel({ targets, colors }) {
  return (
    <div style={{ fontSize: 8 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 1 }}>
        {[...Array(8)].map((_, i) => {
          const hasTgt = targets.some(t => {
            const b = parseInt(t.bearing);
            return b >= i * 45 && b < (i + 1) * 45;
          });
          return <div key={i} style={{ height: 12, background: hasTgt ? colors.error : colors.gridLine, borderRadius: 1 }} />;
        })}
      </div>
      <div style={{ marginTop: 4, color: colors.textMuted, fontSize: 7 }}>Coverage: 98%</div>
    </div>
  );
}

function CorrelationPanel({ targets, colors }) {
  return (
    <div style={{ fontSize: 8 }}>
      {targets.length >= 2 ? (
        <>
          <DataLine label="GROUPS" value="1" colors={colors} />
          <div style={{ marginTop: 4, color: colors.warning }}>SWARM ALPHA</div>
          <div style={{ fontSize: 7, color: colors.textMuted }}>Members: {targets.length}</div>
          <div style={{ fontSize: 7, color: colors.textMuted }}>Formation: Triangular</div>
        </>
      ) : (
        <div style={{ color: colors.textMuted }}>N/A</div>
      )}
    </div>
  );
}

function TimelinePanel({ status, colors }) {
  return (
    <div style={{ fontSize: 7 }}>
      <div>{new Date().toLocaleTimeString()} NOW</div>
      <div style={{ color: colors.textMuted, marginTop: 2 }}>Mission: {status?.uptime ? formatUptime(status.uptime) : 'N/A'}</div>
      <div style={{ color: colors.textMuted }}>Shift End: 16:00</div>
    </div>
  );
}

function EMSpectrumPanel({ colors }) {
  return (
    <div style={{ fontSize: 7 }}>
      <div>VHF ░░░░ Clear</div>
      <div>UHF ░░█░ Active</div>
      <div>SHF ░███ Active</div>
      <div>EHF ░░░░ Clear</div>
    </div>
  );
}

function LocryptDataPanel({ data, targets, colors }) {
  const threatLevel = targets.length > 2 ? 'HIGH' : targets.length > 0 ? 'MEDIUM' : 'LOW';
  return (
    <div style={{ fontSize: 8, color: colors.textMuted }}>
      <div style={{ fontWeight: 'bold', color: colors.teal, marginBottom: 4 }}>PUBLISHING TO LOCRYPT:</div>
      <DataLine label="Radar ID" value={data?.radarId || 'N/A'} colors={colors} />
      <DataLine label="Detections" value={data?.detections || 0} colors={colors} />
      <DataLine label="Range" value={data?.range || 'N/A'} colors={colors} />
      <DataLine label="Bearing" value={data?.bearing || 'N/A'} colors={colors} />
      <DataLine label="Altitude" value={data?.altitude || 'N/A'} colors={colors} />
      <DataLine label="Speed" value={data?.speed || 'N/A'} colors={colors} />
      <DataLine label="Threat" value={threatLevel} colors={colors} />
    </div>
  );
}

function ConfigView({ config, colors }) {
  return (
    <div style={{ padding: 24 }}>
      <Panel title="CONFIGURATION" colors={colors} span={16}>
        <div style={{ fontSize: 10, color: colors.textMuted }}>
          Gateway Token: {config?.darcy?.gateway_token ? config.darcy.gateway_token.substring(0, 8) + '...' : 'Not configured'}
          <br />
          Backend URL: {config?.darcy?.backend_url || 'Not configured'}
        </div>
      </Panel>
    </div>
  );
}

function LogsView({ logs, colors }) {
  return (
    <div style={{ padding: 24 }}>
      <Panel title="LOGS" colors={colors} span={16}>
        <div style={{ fontSize: 9, maxHeight: 400, overflowY: 'auto' }}>
          {logs.map((lg, i) => (
            <div key={i} style={{ padding: 4, borderBottom: '1px solid ' + colors.border }}>
              {new Date(lg.timestamp).toLocaleString()} - {lg.data_type}
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function Panel({ title, children, colors, span = 1, style = {} }) {
  return (
    <div style={{ 
      gridColumn: 'span ' + span, 
      background: colors.surface, 
      border: '1px solid ' + colors.border, 
      borderRadius: 4, 
      padding: 6, 
      ...style 
    }}>
      <div style={{ 
        fontSize: 8, 
        fontWeight: 'bold', 
        color: colors.teal, 
        borderBottom: '1px solid ' + colors.border, 
        paddingBottom: 3, 
        marginBottom: 4 
      }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function NavButton({ active, onClick, icon: Icon, colors }) {
  return (
    <button 
      onClick={onClick} 
      style={{ 
        width: '100%', 
        padding: 8, 
        background: active ? colors.teal + '20' : 'transparent', 
        border: '1px solid ' + (active ? colors.teal : colors.border), 
        borderRadius: 3, 
        cursor: 'pointer', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}
    >
      <Icon size={18} style={{ color: active ? colors.teal : colors.textMuted }} />
    </button>
  );
}

function DataLine({ label, value, colors }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8, padding: '1px 0' }}>
      <span style={{ color: colors.textMuted }}>{label}:</span>
      <span style={{ color: colors.text, fontWeight: 'bold' }}>{value}</span>
    </div>
  );
}

function ControlButton({ label, color, onClick, disabled, testId }) {
  return (
    <button 
      onClick={onClick} 
      disabled={disabled}
      style={{ 
        padding: '6px', 
        background: 'transparent', 
        border: '1px solid ' + (disabled ? COLORS.textMuted : color), 
        borderRadius: 3, 
        fontSize: 8, 
        fontWeight: 'bold', 
        color: disabled ? COLORS.textMuted : color, 
        cursor: disabled ? 'not-allowed' : 'pointer', 
        opacity: disabled ? 0.5 : 1 
      }}
      data-testid={testId}
    >
      {label}
    </button>
  );
}

function StatusBox({ label, value, icon: Icon, color, colors }) {
  return (
    <div style={{ 
      padding: '6px', 
      background: colors.surface, 
      border: '1px solid ' + colors.border, 
      borderRadius: 3, 
      textAlign: 'center', 
      fontSize: 8 
    }}>
      {Icon ? (
        <>
          <Icon size={16} style={{ color: color }} />
          <div style={{ fontSize: 6, color: colors.textMuted }}>{label}</div>
        </>
      ) : (
        <>
          <div style={{ fontWeight: 'bold', color: color }}>{value}</div>
          <div style={{ fontSize: 6, color: colors.textMuted }}>{label}</div>
        </>
      )}
    </div>
  );
}

function formatUptime(s) {
  const p = s.split(':');
  if (p.length === 3) {
    const h = parseInt(p[0]);
    const m = parseInt(p[1]);
    if (h > 0) return `${h}h${m}m`;
    if (m > 0) return `${m}m`;
    return `${parseInt(p[2])}s`;
  }
  return s;
}

function StatusCard({ title, value, subtext, color, colors, icon: Icon }) {
  return (
    <TacticalCard title={title} colors={colors}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        {Icon && <Icon size={20} style={{ color: color }} />}
        <div style={{ fontSize: 10, color: colors.textMuted }}>{subtext}</div>
      </div>
      <div style={{ fontSize: 24, fontWeight: 'bold', color: color, textTransform: 'uppercase' }}>
        {value}
      </div>
    </TacticalCard>
  );
}

function TacticalCard({ title, children, colors, style = {} }) {
  return (
    <div style={{ 
      borderRadius: 8, 
      padding: 16, 
      background: colors.surface, 
      border: '1px solid ' + colors.border, 
      boxShadow: '0 0 10px ' + colors.gridLine, 
      ...style 
    }}>
      <h3 style={{ 
        fontSize: 11, 
        fontWeight: 'bold', 
        marginBottom: 12, 
        letterSpacing: '0.12em', 
        color: colors.teal, 
        borderBottom: '1px solid ' + colors.border, 
        paddingBottom: 8 
      }}>
        {title}
      </h3>
      {children}
    </div>
  );
}

function TacticalButton({ onClick, disabled, color, icon: Icon, label, testId }) {
  return (
    <button 
      onClick={onClick} 
      disabled={disabled}
      style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        gap: 6, 
        padding: '12px', 
        borderRadius: 4, 
        fontSize: 11, 
        fontWeight: 'bold', 
        letterSpacing: '0.1em', 
        background: 'transparent', 
        color: color, 
        border: '2px solid ' + (disabled ? COLORS.textMuted : color), 
        boxShadow: disabled ? 'none' : '0 0 10px ' + color, 
        cursor: disabled ? 'not-allowed' : 'pointer', 
        opacity: disabled ? 0.5 : 1, 
        transition: 'all 0.2s' 
      }}
      data-testid={testId}
    >
      {Icon && <Icon size={14} />}
      <span>{label}</span>
    </button>
  );
}

function MetricBox({ label, value, unit, valueColor, colors }) {
  return (
    <div>
      <p style={{ fontSize: 10, marginBottom: 4, letterSpacing: '0.05em', color: colors.textMuted }}>{label}</p>
      <p style={{ fontSize: 24, fontWeight: 'bold', color: valueColor || colors.teal }}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
      <p style={{ fontSize: 10, letterSpacing: '0.05em', color: colors.textMuted }}>{unit}</p>
    </div>
  );
}

export default App;
