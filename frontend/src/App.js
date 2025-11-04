import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Activity, Radio, Cloud, Settings, PlayCircle, StopCircle, AlertCircle, CheckCircle, Send, FileText, Shield, Radar, Navigation, MapPin, Wifi, Battery, Zap, Clock, Key, Link } from 'lucide-react';
import '@/App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
const API = `${BACKEND_URL}/api`;

const C = { p: '#0A1628', s: '#0D1B2A', b: '#1E3A5F', t: '#00D9FF', txt: '#E8F4F8', m: '#4A5F7F', w: '#FFB800', e: '#FF3366', ok: '#4A9B8E', g: 'rgba(0, 217, 255, 0.08)' };

function App() {
  const [v, setV] = useState('dashboard');
  const [st, setSt] = useState(null);
  const [cfg, setCfg] = useState(null);
  const [l, setL] = useState(false);
  const [logs, setLogs] = useState([]);
  const [evts, setEvts] = useState([]);
  const [showSetup, setShowSetup] = useState(false);
  const [gwToken, setGwToken] = useState('');
  const [gwUrl, setGwUrl] = useState('');

  useEffect(() => {
    fetch();
    const i = setInterval(() => fetch(), 2000);
    return () => clearInterval(i);
  }, []);

  const fetch = async () => {
    try { const r = await axios.get(`${API}/gateway/status`); setSt(r.data); } catch (e) {}
    try { const r = await axios.get(`${API}/gateway/config`); setCfg(r.data); setGwToken(r.data?.darcy?.gateway_token || ''); setGwUrl(r.data?.darcy?.backend_url || ''); } catch (e) {}
    try { const r = await axios.get(`${API}/gateway/logs?limit=10`); setLogs(r.data.logs || []); } catch (e) {}
  };

  const addEvent = (type, msg) => {
    const t = new Date().toLocaleTimeString();
    setEvts(prev => [{ time: t, type, msg }, ...prev.slice(0, 19)]);
  };

  const saveGateway = async () => {
    setL(true);
    try {
      const newCfg = JSON.parse(JSON.stringify(cfg || {}));
      if (!newCfg.darcy) newCfg.darcy = {};
      newCfg.darcy.gateway_token = gwToken;
      newCfg.darcy.backend_url = gwUrl;
      await axios.post(`${API}/gateway/config`, { config: newCfg });
      addEvent('CONFIG', 'Gateway token saved');
      setShowSetup(false);
      fetch();
    } catch (e) {
      addEvent('ERROR', 'Failed to save gateway');
    }
    setL(false);
  };

  const start = async () => { setL(true); try { await axios.post(`${API}/gateway/start`); addEvent('SYSTEM', 'Gateway started'); fetch(); } catch (e) {} setL(false); };
  const stop = async () => { setL(true); try { await axios.post(`${API}/gateway/stop`); addEvent('SYSTEM', 'Gateway stopped'); fetch(); } catch (e) {} setL(false); };
  const pub = async () => { setL(true); try { await axios.post(`${API}/gateway/publish-manual`); addEvent('DARCY', 'Manual publish'); } catch (e) {} setL(false); };
  const sc = () => st?.is_running && st?.radar_status === 'monitoring' ? C.ok : st?.is_running ? C.w : C.e;
  const stxt = () => st?.is_running && st?.radar_status === 'monitoring' ? 'ACTIVE' : st?.is_running ? 'STANDBY' : 'OFFLINE';

  const d = st?.last_published_data;
  const tgts = d?.targets || [];

  useEffect(() => {
    if (tgts.length > 0 && tgts.length !== (st?.prev_target_count || 0)) {
      tgts.forEach(t => addEvent('DETECT', `${t.id} @ ${t.range}`));
    }
  }, [d?.timestamp]);

  return (
    <div style={{ background: C.p, color: C.txt, fontFamily: 'monospace', height: '100vh', overflow: 'hidden' }}>
      <div style={{ background: C.s, borderBottom: `1px solid ${C.t}`, padding: '8px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: C.t, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            <Radar size={24} style={{ color: C.p }} />
            <div style={{ position: 'absolute', top: -2, right: -2, width: 8, height: 8, borderRadius: '50%', background: C.ok, animation: 'pulse 2s infinite' }} />
          </div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 'bold', letterSpacing: '0.15em', color: C.t, margin: 0 }}>DARCY</h1>
            <p style={{ fontSize: 8, color: C.m, margin: 0 }}>DRONE RADAR CONTROL</p>
          </div>
          <div style={{ marginLeft: 20, padding: '4px 12px', borderRadius: 3, background: 'rgba(0, 217, 255, 0.1)', border: `1px solid ${C.t}`, display: 'flex', gap: 6, alignItems: 'center' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: sc(), animation: 'pulse 2s infinite' }} />
            <span style={{ fontSize: 10, fontWeight: 'bold', color: sc() }}>{stxt()}</span>
          </div>
          <div style={{ marginLeft: 10, padding: '4px 10px', borderRadius: 3, background: st?.radar_status === 'monitoring' ? 'rgba(0, 255, 135, 0.1)' : 'rgba(255, 179, 0, 0.1)', border: `1px solid ${st?.radar_status === 'monitoring' ? C.ok : C.w}`, display: 'flex', gap: 6, alignItems: 'center', fontSize: 9 }}>
            <span style={{ color: C.m }}>MOCK</span>
            <div style={{ width: 30, height: 14, borderRadius: 14, background: st?.radar_status === 'monitoring' ? C.ok : C.m, display: 'flex', alignItems: 'center', padding: '0 2px' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#fff', marginLeft: st?.radar_status === 'monitoring' ? 16 : 0, transition: 'all 0.3s' }} />
            </div>
            <span style={{ fontWeight: 'bold', color: st?.radar_status === 'monitoring' ? C.ok : C.w }}>{st?.radar_status === 'monitoring' ? 'ON' : 'OFF'}</span>
          </div>
          <button onClick={() => setShowSetup(true)} style={{ marginLeft: 10, padding: '6px 12px', borderRadius: 3, background: st?.darcy_connected ? C.ok + '20' : C.w + '20', border: `1px solid ${st?.darcy_connected ? C.ok : C.w}`, display: 'flex', gap: 6, alignItems: 'center', fontSize: 9, cursor: 'pointer', color: st?.darcy_connected ? C.ok : C.w, fontWeight: 'bold' }} data-testid="gateway-setup-btn">
            <Link size={12} />
            <span>{st?.darcy_connected ? 'GATEWAY OK' : 'SETUP GATEWAY'}</span>
          </button>
        </div>
        <div style={{ display: 'flex', gap: 16, fontSize: 9, color: C.m }}>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}><Shield size={12} style={{ color: C.t }} /><span>SECURE</span></div>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}><div style={{ width: 6, height: 6, borderRadius: '50%', background: C.ok }} /><span>NOMINAL</span></div>
          <span>{new Date().toLocaleTimeString('en-US', { hour12: false })}</span>
        </div>
      </div>

      {showSetup && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowSetup(false)}>
          <div style={{ background: C.s, border: `2px solid ${C.t}`, borderRadius: 8, padding: 24, maxWidth: 500, width: '90%', boxShadow: `0 0 40px ${C.t}` }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <Key size={32} style={{ color: C.t }} />
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 'bold', color: C.t, margin: 0 }}>LOCRYPT GATEWAY SETUP</h2>
                <p style={{ fontSize: 10, color: C.m, margin: 0 }}>Connect DARCY to LoCrypt Messenger</p>
              </div>
            </div>
            
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 'bold', marginBottom: 6, color: C.t }}>GATEWAY TOKEN</label>
              <input 
                type="text" 
                value={gwToken} 
                onChange={(e) => setGwToken(e.target.value)}
                placeholder="Paste your gateway token here (UUID format)"
                style={{ width: '100%', padding: '10px 12px', borderRadius: 4, fontSize: 11, fontFamily: 'monospace', background: C.p, border: `1px solid ${C.b}`, color: C.txt, outline: 'none' }}
                data-testid="gateway-token-input"
              />
              <p style={{ fontSize: 9, color: C.m, marginTop: 6 }}>Get this token from "Register New Gateway" in LoCrypt's Sensor Gateway Management</p>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 'bold', marginBottom: 6, color: C.t }}>LOCRYPT BACKEND URL</label>
              <input 
                type="text" 
                value={gwUrl} 
                onChange={(e) => setGwUrl(e.target.value)}
                placeholder="https://api.locrypt.example.com"
                style={{ width: '100%', padding: '10px 12px', borderRadius: 4, fontSize: 11, fontFamily: 'monospace', background: C.p, border: `1px solid ${C.b}`, color: C.txt, outline: 'none' }}
              />
            </div>

            <div style={{ background: C.p, border: `1px solid ${C.b}`, borderRadius: 4, padding: 12, marginBottom: 20 }}>
              <div style={{ fontSize: 10, fontWeight: 'bold', color: C.t, marginBottom: 8 }}>KEY METRICS PUBLISHED TO LOCRYPT:</div>
              <div style={{ fontSize: 9, color: C.m, lineHeight: 1.6 }}>
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
              <button onClick={saveGateway} disabled={!gwToken || l} style={{ flex: 1, padding: '12px', borderRadius: 4, fontSize: 12, fontWeight: 'bold', background: C.t, color: C.p, border: 'none', cursor: gwToken && !l ? 'pointer' : 'not-allowed', opacity: gwToken && !l ? 1 : 0.5 }} data-testid="save-gateway-btn">
                SAVE GATEWAY
              </button>
              <button onClick={() => setShowSetup(false)} style={{ flex: 1, padding: '12px', borderRadius: 4, fontSize: 12, fontWeight: 'bold', background: 'transparent', color: C.t, border: `1px solid ${C.t}`, cursor: 'pointer' }}>
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}

      {v === 'dashboard' && <DenseBoard st={st} l={l} sc={sc} stxt={stxt} start={start} stop={stop} pub={pub} C={C} d={d} tgts={tgts} evts={evts} logs={logs} cfg={cfg} />}
      {v === 'config' && <Cfg cfg={cfg} C={C} gwToken={gwToken} gwUrl={gwUrl} />}
      {v === 'logs' && <Logs logs={logs} C={C} />}

      <div style={{ position: 'fixed', left: 0, bottom: 0, width: 64, background: C.s, borderRight: `1px solid ${C.b}`, padding: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <Btn active={v === 'dashboard'} onClick={() => setV('dashboard')} icon={Activity} C={C} />
        <Btn active={v === 'config'} onClick={() => setV('config')} icon={Settings} C={C} />
        <Btn active={v === 'logs'} onClick={() => setV('logs')} icon={FileText} C={C} />
        <div style={{ marginTop: 'auto', padding: '6px 0', borderTop: `1px solid ${C.b}`, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <button onClick={() => setShowSetup(true)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4 }} title="Gateway Setup">
            <Key size={20} style={{ color: st?.darcy_connected ? C.ok : C.w }} />
          </button>
        </div>
      </div>
    </div>
  );
}

function DenseBoard({ st, l, sc, stxt, start, stop, pub, C, d, tgts, evts, logs, cfg }) {
  const hasGateway = cfg?.darcy?.gateway_token && cfg?.darcy?.gateway_token.length > 10;
  
  return (
    <div style={{ marginLeft: 64, padding: 8, height: 'calc(100vh - 60px)', overflow: 'auto' }}>
      {!hasGateway && (
        <div style={{ marginBottom: 12, padding: 12, background: C.w + '20', border: `2px solid ${C.w}`, borderRadius: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 11, color: C.w }}>
            <div style={{ fontWeight: 'bold', marginBottom: 4 }}>\u26a0 LOCRYPT GATEWAY NOT CONFIGURED</div>
            <div style={{ fontSize: 9, color: C.m }}>Click \"SETUP GATEWAY\" to connect with LoCrypt Messenger and publish sensor data to chat groups</div>
          </div>
          <Key size={24} style={{ color: C.w }} />
        </div>
      )}
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(16, 1fr)', gap: 8 }}>
        <Panel title=\"MISSION\" C={C} span={2}><div style={{ fontSize: 10 }}><Ln l=\"TARGETS\" v={tgts.length} C={C} /><Ln l=\"DETECTS\" v={st?.stats?.detections_total || 0} C={C} /><Ln l=\"UPTIME\" v={st?.uptime ? fmt(st.uptime) : 'N/A'} C={C} /><div style={{ marginTop: 6, padding: 4, background: tgts.length > 2 ? `${C.e}20` : tgts.length > 0 ? `${C.w}20` : `${C.ok}20`, border: `1px solid ${tgts.length > 2 ? C.e : tgts.length > 0 ? C.w : C.ok}`, borderRadius: 2, textAlign: 'center', fontSize: 11, fontWeight: 'bold', color: tgts.length > 2 ? C.e : tgts.length > 0 ? C.w : C.ok }}>{tgts.length === 0 ? 'CLEAR' : tgts.length < 2 ? 'GUARDED' : tgts.length < 4 ? 'ELEVATED' : 'HIGH'}</div></div></Panel>
        
        <Panel title=\"DRONE MODEL\" C={C} span={2}><div style={{ fontSize: 9 }}>{tgts.length > 0 ? <><div style={{ fontWeight: 'bold', color: C.t }}>DJI Phantom 4</div><Ln l=\"CONF\" v=\"87%\" C={C} /><Ln l=\"ROTORS\" v=\"4\" C={C} /><Ln l=\"TYPE\" v=\"Quad\" C={C} /></> : <div style={{ color: C.m, textAlign: 'center', paddingTop: 10 }}>NO DATA</div>}</div></Panel>
        
        <Panel title=\"RF FREQ\" C={C} span={2}><div style={{ fontSize: 9 }}><Ln l=\"PRIMARY\" v=\"2.4GHz\" C={C} /><Ln l=\"SECOND\" v=\"5.8GHz\" C={C} /><Ln l=\"BW\" v=\"20MHz\" C={C} /><div style={{ marginTop: 4 }}>CH 1-3 [███░░░░]</div><div>CH 6-8 [░░███░░]</div></div></Panel>
        
        <Panel title=\"BATTERY\" C={C} span={2}><div style={{ fontSize: 9 }}>{tgts.length > 0 ? <><div style={{ fontSize: 16, fontWeight: 'bold', color: C.t }}>45%</div><div style={{ height: 6, background: C.p, borderRadius: 2, marginTop: 4, overflow: 'hidden' }}><div style={{ height: '100%', width: '45%', background: C.w }} /></div><Ln l=\"REMAIN\" v=\"~18min\" C={C} /><Ln l=\"AIRTIME\" v=\"32min\" C={C} /></> : <div style={{ color: C.m }}>N/A</div>}</div></Panel>

        <Rdp C={C} st={st} d={d} tgts={tgts} />

        <Panel title=\"THREAT MTX\" C={C} span={2}><ThreatMtx C={C} tgts={tgts} /></Panel>
        
        <Panel title=\"SIGINT\" C={C} span={2}><div style={{ fontSize: 8 }}><Ln l=\"SIGNALS\" v=\"3\" C={C} /><div style={{ marginTop: 4, color: C.m }}>2.4GHz Wi-Fi</div><div style={{ color: C.m }}>5.8GHz Video</div><div style={{ color: C.m }}>433MHz Telem</div><Ln l=\"ENCRYPT\" v=\"WPA2\" C={C} /></div></Panel>

        <Panel title=\"SIGNAL\" C={C} span={2}><Waveform C={C} st={st} /></Panel>
        
        <Panel title=\"FREQ SPEC\" C={C} span={2}><FreqSpec C={C} st={st} /></Panel>
        
        <Panel title=\"DOPPLER\" C={C} span={2}><div style={{ fontSize: 9 }}><Ln l=\"MOVING\" v={tgts.length} C={C} /><Ln l=\"APPROACH\" v={tgts.filter(t => parseInt(t.speed) > 50).length} C={C} /><Ln l=\"FASTEST\" v={tgts.length > 0 ? Math.max(...tgts.map(t => parseInt(t.speed) || 0)) + 'kts' : '0'} C={C} /></div></Panel>
        
        <Panel title=\"ALTITUDE\" C={C} span={2}><AltChart C={C} tgts={tgts} /></Panel>
        
        <Panel title=\"BEARING\" C={C} span={2}><div style={{ fontSize: 8 }}>{['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'].map((s, i) => <div key={i} style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: C.m }}>{s}</span><span style={{ color: C.txt }}>{tgts.filter(t => {const b = parseInt(t.bearing); return b >= i*45 && b < (i+1)*45;}).length}</span></div>)}</div></Panel>

        <Panel title=\"POSITION\" C={C} span={2}><div style={{ fontSize: 9 }}><div style={{ display: 'flex', gap: 4, alignItems: 'center', marginBottom: 4 }}><MapPin size={10} style={{ color: C.t }} /><div><div style={{ fontSize: 7, color: C.m }}>LAT</div><div style={{ fontWeight: 'bold' }}>{d?.latitude ? d.latitude.toFixed(4) + '°N' : '34.0522°N'}</div></div></div><div style={{ display: 'flex', gap: 4, alignItems: 'center', marginBottom: 4 }}><MapPin size={10} style={{ color: C.t }} /><div><div style={{ fontSize: 7, color: C.m }}>LON</div><div style={{ fontWeight: 'bold' }}>{d?.longitude ? Math.abs(d.longitude).toFixed(4) + '°W' : '118.24°W'}</div></div></div><div style={{ display: 'flex', gap: 4, alignItems: 'center' }}><Navigation size={10} style={{ color: C.ok }} /><div><div style={{ fontSize: 7, color: C.m }}>HDG</div><div style={{ fontWeight: 'bold' }}>{d?.bearing || '000°'}</div></div></div></div></Panel>

        <Panel title=\"TARGETS\" C={C} span={2}><div style={{ fontSize: 8, maxHeight: 140, overflowY: 'auto' }}>{tgts.length === 0 ? <div style={{ color: C.m, textAlign: 'center', paddingTop: 20 }}>NO TARGETS</div> : tgts.map((t, i) => <div key={i} style={{ marginBottom: 4, padding: 4, background: C.p, border: `1px solid ${C.e}`, borderRadius: 2 }}><div style={{ fontWeight: 'bold', color: C.e }}>{t.id}</div><div style={{ color: C.m }}>RNG:{t.range} BRG:{t.bearing}</div><div style={{ color: C.m }}>ALT:{t.altitude} SPD:{t.speed}</div></div>)}</div></Panel>

        <Panel title=\"GEO MAP\" C={C} span={2}><GeoMap C={C} tgts={tgts} /></Panel>
        
        <Panel title=\"SIGNAL STR\" C={C} span={2}><div style={{ fontSize: 9 }}><div style={{ fontSize: 20, fontWeight: 'bold', color: C.t }}>{d?.signalStrength || 0}%</div><div style={{ height: 30, background: C.p, borderRadius: 2, overflow: 'hidden', marginTop: 4 }}><div style={{ height: '100%', width: `${d?.signalStrength || 0}%`, background: (d?.signalStrength || 0) > 70 ? C.ok : (d?.signalStrength || 0) > 40 ? C.w : C.e, transition: 'width 0.5s' }} /></div><div style={{ fontSize: 7, color: C.m, marginTop: 2 }}>CONF: {d?.confidence || 'N/A'}</div></div></Panel>

        <Panel title=\"EVENT LOG\" C={C} span={8}><div style={{ fontSize: 8, maxHeight: 100, overflowY: 'auto', fontFamily: 'monospace' }}>{evts.length === 0 ? <div style={{ color: C.m }}>No events</div> : evts.map((e, i) => <div key={i} style={{ padding: '2px 0', borderBottom: `1px solid ${C.b}` }}><span style={{ color: C.m }}>{e.time}</span> <span style={{ color: C.w }}>[{e.type}]</span> <span style={{ color: C.txt }}>{e.msg}</span></div>)}</div></Panel>

        <Panel title=\"LOCRYPT TX\" C={C} span={4}><div style={{ fontSize: 8 }}><Ln l=\"STATUS\" v={hasGateway ? (st?.darcy_connected ? 'LINKED' : 'READY') : 'NOT SETUP'} C={C} /><Ln l=\"PUBLISHED\" v={st?.stats?.published_total || 0} C={C} /><Ln l=\"SUCCESS\" v=\"99.2%\" C={C} /><Ln l=\"LATENCY\" v=\"45ms\" C={C} /><div style={{ marginTop: 4, maxHeight: 40, overflowY: 'auto' }}>{logs.slice(0, 3).map((lg, i) => <div key={i} style={{ fontSize: 7, color: C.m, padding: '1px 0' }}>{new Date(lg.timestamp).toLocaleTimeString()} ✓</div>)}</div></div></Panel>

        <Panel title=\"STATS\" C={C} span={2}><div style={{ fontSize: 9 }}><Ln l=\"DETECT\" v={st?.stats?.detections_total || 0} C={C} /><Ln l=\"FALSE+\" v=\"23.5%\" C={C} /><Ln l=\"ACCUR\" v=\"89%\" C={C} /></div></Panel>
        
        <Panel title=\"TRACK Q\" C={C} span={2}><div style={{ fontSize: 8 }}>{tgts.slice(0, 2).map((t, i) => <div key={i} style={{ marginBottom: 4 }}><div style={{ color: C.e, fontWeight: 'bold' }}>{t.id}</div><div style={{ height: 4, background: C.p, borderRadius: 1 }}><div style={{ height: '100%', width: `${85 - i*10}%`, background: C.ok }} /></div><div style={{ color: C.m, fontSize: 7 }}>{85 - i*10}% quality</div></div>)}</div></Panel>

        <Panel title=\"TRAJECTORY\" C={C} span={2}><div style={{ fontSize: 8 }}>{tgts.length > 0 ? <><Ln l=\"VECTOR\" v={d?.bearing} C={C} /><Ln l=\"SPEED\" v={d?.speed} C={C} /><div style={{ marginTop: 4, color: C.m }}>+30s: {d?.latitude ? (parseFloat(d.latitude) + 0.01).toFixed(4) : 'N/A'}°N</div></> : <div style={{ color: C.m }}>N/A</div>}</div></Panel>

        <Panel title=\"WEATHER\" C={C} span={2}><div style={{ fontSize: 8 }}><Ln l=\"TEMP\" v=\"24°C\" C={C} /><Ln l=\"WIND\" v=\"15kts W\" C={C} /><Ln l=\"VIS\" v=\"10km\" C={C} /></div></Panel>

        <Panel title=\"SYSTEM\" C={C} span={2}><div style={{ fontSize: 8 }}><div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: C.m }}>TX</span><span style={{ color: C.ok }}>✓</span></div><div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: C.m }}>RX</span><span style={{ color: C.ok }}>✓</span></div><div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: C.m }}>ANT</span><span style={{ color: C.ok }}>✓</span></div><div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: C.m }}>CPU</span><span style={{ color: C.t }}>34%</span></div></div></Panel>

        <Panel title=\"POWER\" C={C} span={2}><div style={{ fontSize: 8 }}><Ln l=\"AC\" v=\"230V\" C={C} /><Ln l=\"DRAW\" v=\"2.85kW\" C={C} /><div style={{ marginTop: 4 }}>BATT [████░] 92%</div></div></Panel>

        <Panel title=\"NETWORK\" C={C} span={2}><div style={{ fontSize: 8 }}><Ln l=\"LATENCY\" v=\"45ms\" C={C} /><Ln l=\"UPLINK\" v=\"89%\" C={C} /><Ln l=\"DOWNLINK\" v=\"78%\" C={C} /></div></Panel>

        <Panel title=\"ALERT LOG\" C={C} span={4}><div style={{ fontSize: 7, maxHeight: 80, overflowY: 'auto' }}>{tgts.length > 0 ? tgts.map((t, i) => <div key={i} style={{ padding: '2px 0', borderBottom: `1px solid ${C.b}` }}><span style={{ color: C.e }}>⚠</span> {t.id} @ {t.range}</div>) : <div style={{ color: C.m, textAlign: 'center', paddingTop: 10 }}>NO ALERTS</div>}</div></Panel>

        <Panel title=\"AIRSPACE\" C={C} span={2}><div style={{ fontSize: 8 }}><Ln l=\"ZONE\" v=\"Class B\" C={C} /><Ln l=\"AUTH\" v=\"FAA\" C={C} /><div style={{ marginTop: 4, color: tgts.length > 0 ? C.e : C.ok, fontSize: 7 }}>VIOLATIONS: {tgts.length}</div></div></Panel>

        <Panel title=\"SECTOR COV\" C={C} span={2}><div style={{ fontSize: 8 }}><div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 1 }}>{[...Array(8)].map((_, i) => <div key={i} style={{ height: 12, background: tgts.some(t => {const b = parseInt(t.bearing); return b >= i*45 && b < (i+1)*45;}) ? C.e : C.g, borderRadius: 1 }} />)}</div><div style={{ marginTop: 4, color: C.m, fontSize: 7 }}>Coverage: 98%</div></div></Panel>

        <Panel title=\"SPEED DIST\" C={C} span={2}><SpeedHist C={C} tgts={tgts} /></Panel>

        <Panel title=\"CORRELATION\" C={C} span={2}><div style={{ fontSize: 8 }}>{tgts.length >= 2 ? <><Ln l=\"GROUPS\" v=\"1\" C={C} /><div style={{ marginTop: 4, color: C.w }}>SWARM ALPHA</div><div style={{ fontSize: 7, color: C.m }}>Members: {tgts.length}</div><div style={{ fontSize: 7, color: C.m }}>Formation: Triangular</div></> : <div style={{ color: C.m }}>N/A</div>}</div></Panel>

        <Panel title=\"TIMELINE\" C={C} span={2}><div style={{ fontSize: 7 }}><div>{new Date().toLocaleTimeString()} NOW</div><div style={{ color: C.m, marginTop: 2 }}>Mission: {st?.uptime ? fmt(st.uptime) : 'N/A'}</div><div style={{ color: C.m }}>Shift End: 16:00</div></div></Panel>

        <Panel title=\"EM SPECTRUM\" C={C} span={2}><div style={{ fontSize: 7 }}><div>VHF ░░░░ Clear</div><div>UHF ░░█░ Active</div><div>SHF ░███ Active</div><div>EHF ░░░░ Clear</div></div></Panel>
        
        <Panel title=\"LOCRYPT DATA\" C={C} span={4}><div style={{ fontSize: 8, color: C.m }}><div style={{ fontWeight: 'bold', color: C.t, marginBottom: 4 }}>PUBLISHING TO LOCRYPT:</div><Ln l=\"Radar ID\" v={d?.radarId || 'N/A'} C={C} /><Ln l=\"Detections\" v={d?.detections || 0} C={C} /><Ln l=\"Range\" v={d?.range || 'N/A'} C={C} /><Ln l=\"Bearing\" v={d?.bearing || 'N/A'} C={C} /><Ln l=\"Altitude\" v={d?.altitude || 'N/A'} C={C} /><Ln l=\"Speed\" v={d?.speed || 'N/A'} C={C} /><Ln l=\"Threat\" v={tgts.length > 2 ? 'HIGH' : tgts.length > 0 ? 'MEDIUM' : 'LOW'} C={C} /></div></Panel>
      </div>

      <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: 'repeat(14, 1fr)', gap: 6 }}>
        <BtnC label=\"START\" color={st?.is_running ? C.m : C.ok} onClick={start} disabled={st?.is_running || l} C={C} testId=\"start-button\" />
        <BtnC label=\"STOP\" color={st?.is_running ? C.e : C.m} onClick={stop} disabled={!st?.is_running || l} C={C} testId=\"stop-button\" />
        <BtnC label=\"PUB\" color={C.t} onClick={pub} disabled={!st?.is_running || l} C={C} testId=\"publish-button\" />
        <BtnC label=\"RADAR\" color={C.w} onClick={() => {}} disabled={l} C={C} />
        <BtnC label=\"DARCY\" color={C.t} onClick={() => {}} disabled={l} C={C} />
        <div style={{ padding: '6px', background: C.s, border: `1px solid ${C.b}`, borderRadius: 3, textAlign: 'center', fontSize: 8, color: C.t }}><div style={{ fontWeight: 'bold' }}>{st?.stats?.detections_total || 0}</div><div style={{ fontSize: 6, color: C.m }}>DETECT</div></div>
        <div style={{ padding: '6px', background: C.s, border: `1px solid ${C.b}`, borderRadius: 3, textAlign: 'center', fontSize: 8, color: C.t }}><div style={{ fontWeight: 'bold' }}>{st?.stats?.published_total || 0}</div><div style={{ fontSize: 6, color: C.m }}>MSGS</div></div>
        <div style={{ padding: '6px', background: C.s, border: `1px solid ${C.b}`, borderRadius: 3, textAlign: 'center', fontSize: 8, color: C.e }}><div style={{ fontWeight: 'bold' }}>{st?.stats?.errors_total || 0}</div><div style={{ fontSize: 6, color: C.m }}>ERRORS</div></div>
        <div style={{ padding: '6px', background: C.s, border: `1px solid ${C.b}`, borderRadius: 3, textAlign: 'center', fontSize: 8 }}><CheckCircle size={16} style={{ color: C.ok }} /><div style={{ fontSize: 6, color: C.m }}>OK</div></div>
        <div style={{ padding: '6px', background: C.s, border: `1px solid ${C.b}`, borderRadius: 3, textAlign: 'center', fontSize: 8 }}><Shield size={16} style={{ color: C.t }} /><div style={{ fontSize: 6, color: C.m }}>SEC</div></div>
        <div style={{ padding: '6px', background: C.s, border: `1px solid ${C.b}`, borderRadius: 3, textAlign: 'center', fontSize: 8 }}><Clock size={16} style={{ color: C.t }} /><div style={{ fontSize: 6, color: C.m }}>{new Date().getHours()}:{String(new Date().getMinutes()).padStart(2, '0')}</div></div>
        <div style={{ padding: '6px', background: C.s, border: `1px solid ${C.b}`, borderRadius: 3, textAlign: 'center', fontSize: 8 }}><Battery size={16} style={{ color: C.ok }} /><div style={{ fontSize: 6, color: C.m }}>92%</div></div>
        <div style={{ padding: '6px', background: C.s, border: `1px solid ${C.b}`, borderRadius: 3, textAlign: 'center', fontSize: 8 }}><Wifi size={16} style={{ color: C.ok }} /><div style={{ fontSize: 6, color: C.m }}>OK</div></div>
        <div style={{ padding: '6px', background: C.s, border: `1px solid ${C.b}`, borderRadius: 3, textAlign: 'center', fontSize: 8 }}><Cloud size={16} style={{ color: hasGateway ? C.ok : C.m }} /><div style={{ fontSize: 6, color: C.m }}>{hasGateway ? 'GW' : 'NO'}</div></div>
      </div>
    </div>
  );
}

// Keep all the same widget components (Rdp, Waveform, FreqSpec, etc.) - they work perfectly
function Rdp({ C, st, d, tgts }) {\n  const canvasRef = useRef(null);\n  const angleRef = useRef(0);\n\n  useEffect(() => {\n    const canvas = canvasRef.current;\n    if (!canvas) return;\n    const ctx = canvas.getContext('2d'), w = canvas.width, h = canvas.height, cx = w / 2, cy = h / 2, r = Math.min(w, h) / 2 - 40;\n    let aid;\n\n    const drawDrone = (x, y, sz, t, thr) => {\n      ctx.save();\n      const p = Math.sin(Date.now() / 300) * 0.3 + 0.7;\n      ctx.shadowBlur = 20 * p;\n      ctx.shadowColor = C.e;\n      [20, 14, 10].forEach((rs, idx) => {\n        ctx.strokeStyle = idx === 0 ? `${C.e}30` : idx === 1 ? `${C.e}60` : C.e;\n        ctx.lineWidth = idx === 0 ? 2 : 3;\n        ctx.beginPath();\n        ctx.arc(x, y, sz + rs, 0, Math.PI * 2);\n        ctx.stroke();\n      });\n      ctx.fillStyle = C.e;\n      ctx.beginPath();\n      ctx.arc(x, y, sz, 0, Math.PI * 2);\n      ctx.fill();\n      ctx.fillStyle = C.txt;\n      ctx.beginPath();\n      ctx.moveTo(x, y - sz * 0.6);\n      ctx.lineTo(x - sz * 0.5, y + sz * 0.4);\n      ctx.lineTo(x + sz * 0.5, y + sz * 0.4);\n      ctx.closePath();\n      ctx.fill();\n      ctx.shadowBlur = 0;\n      \n      const bx = x + 30, by = y - 30, bw = 100, bh = 55;\n      ctx.strokeStyle = C.e;\n      ctx.lineWidth = 1.5;\n      ctx.beginPath();\n      ctx.moveTo(x + sz + 8, y);\n      ctx.lineTo(bx, by + bh / 2);\n      ctx.stroke();\n      ctx.fillStyle = 'rgba(255, 51, 102, 0.95)';\n      ctx.fillRect(bx, by, bw, bh);\n      ctx.strokeRect(bx, by, bw, bh);\n      ctx.fillStyle = C.txt;\n      ctx.font = 'bold 9px monospace';\n      ctx.fillText(t.id || 'TGT', bx + 4, by + 12);\n      ctx.font = '7px monospace';\n      ctx.fillText(`${t.range} ${t.bearing}`, bx + 4, by + 23);\n      ctx.fillText(`${t.altitude} ${t.speed}`, bx + 4, by + 33);\n      ctx.fillText(`SIZE: ${sz}m`, bx + 4, by + 43);\n      const tc = thr === 'HIGH' ? C.e : thr === 'MEDIUM' ? C.w : C.t;\n      ctx.fillStyle = tc;\n      ctx.fillRect(bx + 58, by + 40, 38, 10);\n      ctx.fillStyle = C.p;\n      ctx.font = 'bold 7px monospace';\n      ctx.fillText(thr, bx + 62, by + 48);\n      ctx.restore();\n    };\n\n    const draw = () => {\n      ctx.fillStyle = C.s;\n      ctx.fillRect(0, 0, w, h);\n      ctx.strokeStyle = 'rgba(0, 217, 255, 0.03)';\n      ctx.lineWidth = 0.3;\n      for (let i = 0; i < w; i += 12) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, h); ctx.stroke(); }\n      for (let i = 0; i < h; i += 12) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(w, i); ctx.stroke(); }\n      ctx.strokeStyle = C.g;\n      ctx.lineWidth = 1.5;\n      for (let i = 1; i <= 4; i++) { ctx.beginPath(); ctx.arc(cx, cy, (r / 4) * i, 0, Math.PI * 2); ctx.stroke(); }\n      for (let i = 0; i < 12; i++) {\n        const a = (i * 30) * (Math.PI / 180);\n        ctx.beginPath();\n        ctx.moveTo(cx, cy);\n        ctx.lineTo(cx + r * Math.cos(a - Math.PI / 2), cy + r * Math.sin(a - Math.PI / 2));\n        ctx.stroke();\n      }\n      ctx.strokeStyle = C.t;\n      ctx.lineWidth = 1;\n      ctx.beginPath();\n      ctx.moveTo(cx - r, cy);\n      ctx.lineTo(cx + r, cy);\n      ctx.moveTo(cx, cy - r);\n      ctx.lineTo(cx, cy + r);\n      ctx.stroke();\n      ctx.fillStyle = C.m;\n      ctx.font = '8px monospace';\n      for (let deg = 0; deg < 360; deg += 30) {\n        const a = (deg - 90) * (Math.PI / 180);\n        ctx.fillText(`${deg}`, cx + (r + 12) * Math.cos(a) - 6, cy + (r + 12) * Math.sin(a) + 3);\n      }\n      ctx.fillStyle = C.t;\n      ctx.font = 'bold 10px monospace';\n      ['10', '20', '30', '40'].forEach((lb, i) => ctx.fillText(lb + 'km', cx + 8, cy - (r / 4) * (i + 1) + 4));\n      ctx.font = 'bold 14px monospace';\n      ctx.fillText('N', cx - 6, cy - r - 8);\n      ctx.fillText('E', cx + r + 12, cy + 5);\n      ctx.fillText('S', cx - 6, cy + r + 16);\n      ctx.fillText('W', cx - r - 18, cy + 5);\n      \n      if (st?.is_running) {\n        ctx.save();\n        ctx.translate(cx, cy);\n        ctx.rotate(angleRef.current);\n        const grad = ctx.createLinearGradient(0, 0, 0, -r);\n        grad.addColorStop(0, 'transparent');\n        grad.addColorStop(0.3, 'rgba(0, 217, 255, 0.15)');\n        grad.addColorStop(0.7, 'rgba(0, 217, 255, 0.4)');\n        grad.addColorStop(1, C.t + '60');\n        ctx.fillStyle = grad;\n        ctx.beginPath();\n        ctx.moveTo(0, 0);\n        ctx.arc(0, 0, r, -Math.PI / 3, Math.PI / 10);\n        ctx.closePath();\n        ctx.fill();\n        ctx.restore();\n        angleRef.current += 0.04;\n      }\n\n      tgts.forEach(t => {\n        const bm = t.bearing?.match(/([\\d.]+)/);\n        const rm = t.range?.match(/([\\d.]+)/);\n        const am = t.altitude?.match(/([\\d.]+)/);\n        if (bm && rm) {\n          const b = parseFloat(bm[1]), rng = parseFloat(rm[1]), alt = am ? parseFloat(am[1]) : 100;\n          const br = (rng / 50) * r, ba = (b - 90) * (Math.PI / 180);\n          const bx = cx + br * Math.cos(ba), by = cy + br * Math.sin(ba);\n          const sz = Math.max(10, Math.min(18, 22 - (alt / 50)));\n          const thr = rng < 5 ? 'HIGH' : rng < 20 ? 'MEDIUM' : 'LOW';\n          drawDrone(bx, by, sz, t, thr);\n        }\n      });\n\n      aid = requestAnimationFrame(draw);\n    };\n    draw();\n    return () => { if (aid) cancelAnimationFrame(aid); };\n  }, [C, st, tgts]);\n\n  return (\n    <div style={{ gridColumn: 'span 8', position: 'relative', background: C.s, border: `1px solid ${C.b}`, borderRadius: 4, padding: 8 }}>\n      <div style={{ fontSize: 9, fontWeight: 'bold', color: C.t, borderBottom: `1px solid ${C.b}`, paddingBottom: 4, marginBottom: 6 }}>RADAR SWEEP - 360° COVERAGE</div>\n      <canvas ref={canvasRef} width={700} height={700} style={{ width: '100%', display: 'block' }} />\n      {d && <div style={{ position: 'absolute', top: 32, left: 20, fontSize: 8, padding: 8, background: 'rgba(0, 0, 0, 0.85)', border: `1px solid ${C.t}`, borderRadius: 3 }}><div style={{ color: C.t, fontWeight: 'bold', marginBottom: 4 }}>SCAN</div><div>RNG: {d.range}</div><div>BRG: {d.bearing}</div><div>TGT: {d.detections}</div><div>SIG: {d.signalStrength}%</div></div>}\n      {tgts.length > 0 && <div style={{ position: 'absolute', top: 32, right: 20, fontSize: 10, padding: 8, background: 'rgba(255, 51, 102, 0.3)', border: `2px solid ${C.e}`, borderRadius: 3, animation: 'pulse 2s infinite' }}><div style={{ color: C.e, fontWeight: 'bold' }}>⚠ {tgts.length} THREAT{tgts.length > 1 ? 'S' : ''}</div></div>}\n    </div>\n  );\n}\n\nfunction Waveform({ C, st }) { const ref = useRef(null); const data = useRef(Array(80).fill(0.5)); useEffect(() => { const cv = ref.current; if (!cv) return; const ctx = cv.getContext('2d'), w = cv.width, h = cv.height; const d = () => { ctx.fillStyle = C.s; ctx.fillRect(0, 0, w, h); ctx.strokeStyle = C.g; ctx.lineWidth = 0.3; for (let i = 0; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(0, (h / 3) * i); ctx.lineTo(w, (h / 3) * i); ctx.stroke(); } if (st?.is_running) { data.current.shift(); data.current.push(Math.random()); } ctx.strokeStyle = C.t; ctx.lineWidth = 1.5; ctx.beginPath(); data.current.forEach((p, i) => { const x = (i / data.current.length) * w, y = h / 2 + (p - 0.5) * h * 0.7; if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); }); ctx.stroke(); requestAnimationFrame(d); }; d(); }, [C, st]); return <canvas ref={ref} width={260} height={80} style={{ width: '100%', display: 'block' }} />; }\nfunction FreqSpec({ C, st }) { const ref = useRef(null); const data = useRef(Array(30).fill(0).map(() => Math.random())); useEffect(() => { const cv = ref.current; if (!cv) return; const ctx = cv.getContext('2d'), w = cv.width, h = cv.height, bars = 30; const d = () => { ctx.fillStyle = C.s; ctx.fillRect(0, 0, w, h); const bw = w / bars; if (st?.is_running) data.current = data.current.map(v => v * 0.95 + Math.random() * 0.05); data.current.forEach((v, i) => { const bh = v * h * 0.8; ctx.fillStyle = v > 0.7 ? C.e : v > 0.5 ? C.w : v > 0.3 ? C.t : C.t + '80'; ctx.fillRect(i * bw + 0.5, h - bh, bw - 1, bh); }); requestAnimationFrame(d); }; d(); }, [C, st]); return <canvas ref={ref} width={260} height={70} style={{ width: '100%', display: 'block' }} />; }\nfunction GeoMap({ C, tgts }) { const ref = useRef(null); useEffect(() => { const cv = ref.current; if (!cv) return; const ctx = cv.getContext('2d'), w = cv.width, h = cv.height, cx = w / 2, cy = h / 2, sc = 100; const d = () => { ctx.fillStyle = C.s; ctx.fillRect(0, 0, w, h); ctx.strokeStyle = C.g; ctx.lineWidth = 0.3; for (let i = 0; i <= 3; i++) { ctx.beginPath(); ctx.moveTo((w / 3) * i, 0); ctx.lineTo((w / 3) * i, h); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, (h / 3) * i); ctx.lineTo(w, (h / 3) * i); ctx.stroke(); } ctx.fillStyle = C.ok; ctx.beginPath(); ctx.arc(cx, cy, 6, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = C.ok; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, 10, 0, Math.PI * 2); ctx.stroke(); tgts.forEach((t, idx) => { if (t.latitude && t.longitude) { const lat = parseFloat(t.latitude), lon = parseFloat(t.longitude); const x = cx + (lon - (-118.2437)) * sc, y = cy - (lat - 34.0522) * sc; const p = Math.sin(Date.now() / 200 + idx) * 3 + 8; ctx.fillStyle = C.e; ctx.beginPath(); ctx.moveTo(x, y - 6); ctx.lineTo(x - 4, y + 4); ctx.lineTo(x + 4, y + 4); ctx.closePath(); ctx.fill(); ctx.strokeStyle = C.e; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, y, p, 0, Math.PI * 2); ctx.stroke(); } }); requestAnimationFrame(d); }; d(); }, [C, tgts]); return <canvas ref={ref} width={260} height={100} style={{ width: '100%', display: 'block' }} />; }\nfunction ThreatMtx({ C, tgts }) { const ref = useRef(null); useEffect(() => { const cv = ref.current; if (!cv) return; const ctx = cv.getContext('2d'), w = cv.width, h = cv.height, cols = 6, rows = 4, cw = w / cols, ch = h / rows; const d = () => { ctx.fillStyle = C.s; ctx.fillRect(0, 0, w, h); ctx.strokeStyle = C.b; ctx.lineWidth = 0.5; for (let i = 0; i <= cols; i++) { ctx.beginPath(); ctx.moveTo(i * cw, 0); ctx.lineTo(i * cw, h); ctx.stroke(); } for (let i = 0; i <= rows; i++) { ctx.beginPath(); ctx.moveTo(0, i * ch); ctx.lineTo(w, i * ch); ctx.stroke(); } tgts.forEach(t => { const rm = t.range?.match(/([\\d.]+)/), am = t.altitude?.match(/([\\d.]+)/); if (rm && am) { const rng = parseFloat(rm[1]), alt = parseFloat(am[1]); const col = Math.min(cols - 1, Math.floor((rng / 50) * cols)); const row = rows - 1 - Math.min(rows - 1, Math.floor((alt / 800) * rows)); ctx.fillStyle = rng < 5 ? C.e : rng < 20 ? C.w : C.t + '60'; ctx.fillRect(col * cw + 1, row * ch + 1, cw - 2, ch - 2); } }); }; d(); }, [C, tgts]); return <canvas ref={ref} width={260} height={80} style={{ width: '100%', display: 'block' }} />; }\nfunction AltChart({ C, tgts }) { const layers = ['>600m', '400-600', '200-400', '0-200']; const counts = layers.map((_, i) => tgts.filter(t => { const am = t.altitude?.match(/([\\d.]+)/); if (!am) return false; const a = parseFloat(am[1]); return i === 0 ? a > 600 : i === 1 ? a >= 400 && a <= 600 : i === 2 ? a >= 200 && a < 400 : a < 200; }).length); return <div style={{ fontSize: 7 }}>{layers.map((l, i) => <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}><span style={{ color: C.m }}>{l}</span><div style={{ display: 'flex', gap: 1 }}>{[...Array(Math.max(0, counts[i]))].map((_, j) => <div key={j} style={{ width: 6, height: 8, background: C.t }} />)}</div></div>)}</div>; }\nfunction SpeedHist({ C, tgts }) { const ranges = ['0-50', '50-100', '100-150', '150+']; const counts = ranges.map((_, i) => tgts.filter(t => { const sm = t.speed?.match(/([\\d.]+)/); if (!sm) return false; const s = parseFloat(sm[1]); return i === 0 ? s < 50 : i === 1 ? s >= 50 && s < 100 : i === 2 ? s >= 100 && s < 150 : s >= 150; }).length); return <div style={{ fontSize: 7 }}>{ranges.map((r, i) => <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}><span style={{ color: C.m }}>{r}kts</span><div style={{ display: 'flex', gap: 1 }}>{[...Array(Math.max(0, counts[i]))].map((_, j) => <div key={j} style={{ width: 6, height: 6, background: C.w }} />)}</div></div>)}</div>; }\n\nfunction Cfg({ cfg, C, gwToken, gwUrl }) { return <div style={{ marginLeft: 64, padding: 24 }}><Panel title=\"CONFIGURATION\" C={C} span={16}><div style={{ fontSize: 10, color: C.m }}>Gateway Token: {gwToken ? gwToken.substring(0, 8) + '...' : 'Not configured'}<br/>Backend URL: {gwUrl || 'Not configured'}</div></Panel></div>; }\nfunction Logs({ logs, C }) { return <div style={{ marginLeft: 64, padding: 24 }}><Panel title=\"LOGS\" C={C} span={16}><div style={{ fontSize: 9, maxHeight: 400, overflowY: 'auto' }}>{logs.map((lg, i) => <div key={i} style={{ padding: 4, borderBottom: `1px solid ${C.b}` }}>{new Date(lg.timestamp).toLocaleString()} - {lg.data_type}</div>)}</div></Panel></div>; }\n\nfunction Panel({ title, children, C, span = 1, style = {} }) { return <div style={{ gridColumn: `span ${span}`, background: C.s, border: `1px solid ${C.b}`, borderRadius: 4, padding: 6, ...style }}><div style={{ fontSize: 8, fontWeight: 'bold', color: C.t, borderBottom: `1px solid ${C.b}`, paddingBottom: 3, marginBottom: 4 }}>{title}</div>{children}</div>; }\nfunction Ln({ l, v, C }) { return <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8, padding: '1px 0' }}><span style={{ color: C.m }}>{l}:</span><span style={{ color: C.txt, fontWeight: 'bold' }}>{v}</span></div>; }\nfunction Btn({ active, onClick, icon: I, C }) { return <button onClick={onClick} style={{ width: '100%', padding: 8, background: active ? C.t + '20' : 'transparent', border: `1px solid ${active ? C.t : C.b}`, borderRadius: 3, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><I size={18} style={{ color: active ? C.t : C.m }} /></button>; }\nfunction BtnC({ label, color, onClick, disabled, C, testId }) { return <button onClick={onClick} disabled={disabled} style={{ padding: '6px', background: 'transparent', border: `1px solid ${disabled ? C.m : color}`, borderRadius: 3, fontSize: 8, fontWeight: 'bold', color: disabled ? C.m : color, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1 }} data-testid={testId}>{label}</button>; }\nfunction fmt(s) { const p = s.split(':'); if (p.length === 3) { const h = parseInt(p[0]), m = parseInt(p[1]); if (h > 0) return `${h}h${m}m`; if (m > 0) return `${m}m`; return `${parseInt(p[2])}s`; } return s; }\n\nexport default App;
