import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { MapPin, Share2, AlertTriangle, Users } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
const API = `${BACKEND_URL}/api`;

export function DangerZoneMap({ colors, data, targets }) {
  const [zones, setZones] = useState([]);
  const canvasRef = useRef(null);

  useEffect(() => {
    fetchZones();
    const interval = setInterval(() => fetchZones(), 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchZones = async () => {
    try {
      const r = await axios.get(`${API}/danger-zones/calculate?timeline_minutes=5`);
      setZones(r.data.zones || []);
    } catch (e) {}
  };

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d'), w = cv.width, h = cv.height, cx = w / 2, cy = h / 2, scale = 8;
    
    const draw = () => {
      ctx.fillStyle = colors.surface;
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = colors.gridLine;
      ctx.lineWidth = 0.3;
      for (let i = 0; i <= 3; i++) {
        ctx.beginPath(); ctx.moveTo((w / 3) * i, 0); ctx.lineTo((w / 3) * i, h); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, (h / 3) * i); ctx.lineTo(w, (h / 3) * i); ctx.stroke();
      }
      
      ctx.fillStyle = colors.success;
      ctx.beginPath();
      ctx.arc(cx, cy, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = colors.success;
      ctx.font = 'bold 8px monospace';
      ctx.fillText('CLUJ', cx + 12, cy + 3);
      
      zones.forEach((z, idx) => {
        const latDiff = z.center.lat - 46.7712;
        const lonDiff = z.center.lon - 23.6236;
        const x = cx + lonDiff * scale * 100;
        const y = cy - latDiff * scale * 100;
        
        const radiusPx = z.radius_km * scale;
        
        const pulse = Math.sin(Date.now() / 300 + idx) * 0.2 + 0.8;
        ctx.globalAlpha = 0.3 * pulse;
        ctx.fillStyle = z.type === 'IMMEDIATE' ? colors.error : colors.warning;
        ctx.beginPath();
        ctx.arc(x, y, radiusPx, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        
        ctx.strokeStyle = z.type === 'IMMEDIATE' ? colors.error : colors.warning;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, radiusPx, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.fillStyle = z.type === 'IMMEDIATE' ? colors.error : colors.warning;
        ctx.beginPath();
        ctx.moveTo(x, y - 6);
        ctx.lineTo(x - 4, y + 4);
        ctx.lineTo(x + 4, y + 4);
        ctx.closePath();
        ctx.fill();
        
        ctx.font = 'bold 7px monospace';
        ctx.fillText(z.id, x + 8, y - 2);
      });
      
      requestAnimationFrame(draw);
    };
    draw();
  }, [colors, zones]);

  return (
    <div>
      <canvas ref={canvasRef} width={260} height={160} style={{ width: '100%', display: 'block' }} />
      <div style={{ marginTop: 4, fontSize: 7, color: colors.textMuted }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>🔴 Immediate: {zones.filter(z => z.type === 'IMMEDIATE').length}</span>
          <span>🟡 Predicted: {zones.filter(z => z.type === 'PREDICTED').length}</span>
        </div>
      </div>
    </div>
  );
}

export function LocryptShareModal({ show, onClose, colors }) {
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [sos, setSos] = useState(false);
  const [radius, setRadius] = useState(5);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState('');

  useEffect(() => {
    if (show) {
      fetchGroups();
      fetchZones();
    }
  }, [show]);

  const fetchGroups = async () => {
    try {
      const r = await axios.get(`${API}/locrypt/groups`);
      setGroups(r.data.groups || []);
      if (r.data.groups?.length > 0) {
        setSelectedGroup(r.data.groups[0].id);
      }
    } catch (e) {}
  };

  const fetchZones = async () => {
    try {
      const r = await axios.get(`${API}/danger-zones/calculate?timeline_minutes=5`);
      setZones(r.data.zones || []);
    } catch (e) {}
  };

  const shareAlert = async () => {
    if (!selectedGroup) return;
    setLoading(true);
    try {
      const group = groups.find(g => g.id === selectedGroup);
      const r = await axios.post(`${API}/locrypt/share-danger-zones`, {
        group_id: selectedGroup,
        group_name: group?.name || 'Unknown',
        sos: sos,
        radius_km: radius
      });
      setPreview(r.data.preview || '');
      alert('Alert shared to ' + group?.name);
      setTimeout(() => onClose(), 2000);
    } catch (e) {
      alert('Failed to share alert');
    }
    setLoading(false);
  };

  if (!show) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={onClose}>
      <div style={{ background: colors.surface, border: '2px solid ' + colors.teal, borderRadius: 8, padding: 24, maxWidth: 600, width: '90%', maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 0 40px ' + colors.teal }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <Share2 size={32} style={{ color: colors.teal }} />
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 'bold', color: colors.teal, margin: 0 }}>SHARE TO LOCRYPT</h2>
            <p style={{ fontSize: 10, color: colors.textMuted, margin: 0 }}>Send danger zone alert to group chat</p>
          </div>
        </div>

        <div style={{ marginBottom: 16, padding: 12, background: sos ? colors.error + '20' : colors.teal + '10', border: '2px solid ' + (sos ? colors.error : colors.teal), borderRadius: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" checked={sos} onChange={(e) => setSos(e.target.checked)} style={{ width: 20, height: 20 }} />
            <AlertTriangle size={20} style={{ color: sos ? colors.error : colors.warning }} />
            <span style={{ fontSize: 12, fontWeight: 'bold', color: sos ? colors.error : colors.text }}>MARK AS SOS EMERGENCY</span>
          </div>
          {sos && <div style={{ fontSize: 9, color: colors.error, marginTop: 6, marginLeft: 28 }}>Group members will receive high-priority emergency notification</div>}
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 'bold', marginBottom: 6, color: colors.teal }}>SELECT GROUP</label>
          <select value={selectedGroup} onChange={(e) => setSelectedGroup(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 4, fontSize: 11, fontFamily: 'monospace', background: colors.primary, border: '1px solid ' + colors.border, color: colors.text }}>
            {groups.map(g => <option key={g.id} value={g.id}>{g.name} ({g.members} members)</option>)}
          </select>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 'bold', marginBottom: 6, color: colors.teal }}>DANGER RADIUS: {radius}km</label>
          <input type="range" min="1" max="10" step="0.5" value={radius} onChange={(e) => setRadius(parseFloat(e.target.value))} style={{ width: '100%', height: 6 }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8, color: colors.textMuted, marginTop: 2 }}>
            <span>1km</span><span>5km</span><span>10km</span>
          </div>
        </div>

        <div style={{ marginBottom: 16, background: colors.primary, border: '1px solid ' + colors.border, borderRadius: 4, padding: 12 }}>
          <div style={{ fontSize: 10, fontWeight: 'bold', color: colors.teal, marginBottom: 8 }}>DANGER ZONES TO SHARE:</div>
          <div style={{ fontSize: 9, color: colors.text, marginBottom: 8 }}>
            📍 Base Location: Cluj-Napoca (46.7712°N, 23.6236°E)
          </div>
          <div style={{ fontSize: 9, color: colors.textMuted, lineHeight: 1.6 }}>
            <div style={{ fontWeight: 'bold', color: colors.error }}>🔴 Immediate Threats: {zones.filter(z => z.type === 'IMMEDIATE').length}</div>
            <div style={{ fontWeight: 'bold', color: colors.warning }}>🟡 Predicted Threats: {zones.filter(z => z.type === 'PREDICTED').length}</div>
            <div style={{ marginTop: 6 }}>Total Zones: {zones.length}</div>
            <div>Timeline: Next 5 minutes</div>
          </div>
        </div>

        {preview && (
          <div style={{ marginBottom: 16, background: colors.primary, border: '1px solid ' + colors.success, borderRadius: 4, padding: 12, maxHeight: 200, overflowY: 'auto' }}>
            <div style={{ fontSize: 9, fontWeight: 'bold', color: colors.success, marginBottom: 6 }}>MESSAGE PREVIEW:</div>
            <pre style={{ fontSize: 8, color: colors.textMuted, whiteSpace: 'pre-wrap', margin: 0, fontFamily: 'monospace' }}>{preview}</pre>
          </div>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={shareAlert} disabled={!selectedGroup || loading || zones.length === 0} style={{ flex: 1, padding: '12px', borderRadius: 4, fontSize: 12, fontWeight: 'bold', background: sos ? colors.error : colors.teal, color: colors.primary, border: 'none', cursor: selectedGroup && !loading && zones.length > 0 ? 'pointer' : 'not-allowed', opacity: selectedGroup && !loading && zones.length > 0 ? 1 : 0.5 }}>
            {sos ? '⚠️ SEND SOS ALERT' : 'SHARE TO GROUP'}
          </button>
          <button onClick={onClose} style={{ flex: 1, padding: '12px', borderRadius: 4, fontSize: 12, fontWeight: 'bold', background: 'transparent', color: colors.teal, border: '1px solid ' + colors.teal, cursor: 'pointer' }}>CANCEL</button>
        </div>
      </div>
    </div>
  );
}
