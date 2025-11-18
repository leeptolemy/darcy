import React, { useState, useRef, useEffect } from 'react';
import { X, Share2, Shield, AlertTriangle, Eye, Target, Clock, Activity, Radio } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
const API = `${BACKEND_URL}/api`;

export function TargetDetailModal({ target, onClose, colors }) {
  const [targetStatus, setTargetStatus] = useState('unknown'); // 'safe', 'hostile', 'unknown'
  const [detectionHistory, setDetectionHistory] = useState([
    { time: '10:35:00', range: '15.2km', bearing: '042°' },
    { time: '10:30:00', range: '18.5km', bearing: '045°' },
    { time: '10:25:00', range: '22.1km', bearing: '048°' }
  ]);

  const shareToLocrypt = () => {
    // Trigger share modal with this specific target
    alert(`Sharing ${target.id} to LoCrypt`);
  };

  const markSafe = () => {
    setTargetStatus('safe');
    alert(`${target.id} marked as SAFE`);
  };

  const markHostile = () => {
    setTargetStatus('hostile');
    alert(`${target.id} marked as HOSTILE`);
  };

  // Parse target data
  const rangeKm = parseFloat(target.range?.match(/([\d.]+)/)?.[1] || 0);
  const bearingDeg = parseFloat(target.bearing?.match(/([\d.]+)/)?.[1] || 0);
  const altitudeM = parseFloat(target.altitude?.match(/([\d.]+)/)?.[1] || 0);
  const speedKts = parseFloat(target.speed?.match(/([\d.]+)/)?.[1] || 0);

  const threatLevel = rangeKm < 5 ? 'HIGH' : rangeKm < 20 ? 'MEDIUM' : 'LOW';
  const threatColor = threatLevel === 'HIGH' ? colors.error : threatLevel === 'MEDIUM' ? colors.warning : colors.teal;

  return (
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      right: 0, 
      bottom: 0, 
      background: 'rgba(0, 0, 0, 0.9)', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      zIndex: 2000 
    }} onClick={onClose}>
      <div style={{ 
        background: colors.surface, 
        border: '3px solid ' + colors.teal, 
        borderRadius: 8, 
        padding: 0,
        width: '90%',
        maxWidth: 900,
        maxHeight: '90vh',
        overflow: 'hidden',
        boxShadow: '0 0 60px ' + colors.teal,
        display: 'grid',
        gridTemplateColumns: '400px 1fr'
      }} onClick={(e) => e.stopPropagation()}>
        
        {/* Left: 3D Drone Visualization */}
        <div style={{ background: colors.primary, borderRight: '2px solid ' + colors.border, padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <Drone3DVisualization colors={colors} targetId={target.id} />
          <div style={{ marginTop: 20, fontSize: 10, color: colors.textMuted, textAlign: 'center' }}>
            <div style={{ fontSize: 14, fontWeight: 'bold', color: colors.teal, marginBottom: 8 }}>DJI PHANTOM 4 PRO</div>
            <div>Commercial Quadcopter</div>
          </div>
        </div>

        {/* Right: Detailed Information */}
        <div style={{ padding: 20, overflowY: 'auto', maxHeight: '90vh' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 12, borderBottom: '2px solid ' + colors.border }}>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 'bold', color: colors.teal, margin: 0, letterSpacing: '0.1em' }}>{target.id}</h2>
              <p style={{ fontSize: 10, color: colors.textMuted, margin: 0 }}>TARGET ANALYSIS & CLASSIFICATION</p>
            </div>
            <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
              <X size={24} style={{ color: colors.textMuted }} />
            </button>
          </div>

          {/* Threat Assessment */}
          <div style={{ marginBottom: 16, padding: 12, background: threatColor + '20', border: '2px solid ' + threatColor, borderRadius: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <AlertTriangle size={20} style={{ color: threatColor }} />
                <span style={{ fontSize: 12, fontWeight: 'bold', color: threatColor }}>THREAT LEVEL: {threatLevel}</span>
              </div>
              <div style={{ fontSize: 10, color: colors.textMuted }}>
                {targetStatus === 'safe' ? '✓ MARKED SAFE' : targetStatus === 'hostile' ? '⚠ HOSTILE' : 'UNKNOWN'}
              </div>
            </div>
          </div>

          {/* Current Status Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 16 }}>
            <InfoCard label="RANGE" value={target.range} icon="📏" colors={colors} />
            <InfoCard label="BEARING" value={target.bearing} icon="🧭" colors={colors} />
            <InfoCard label="ALTITUDE" value={target.altitude} icon="✈️" colors={colors} />
            <InfoCard label="SPEED" value={target.speed} icon="⚡" colors={colors} />
          </div>

          {/* Specifications */}
          <Section title="DRONE SPECIFICATIONS" colors={colors}>
            <DataRow label="Model" value="DJI Phantom 4 Pro" colors={colors} />
            <DataRow label="Type" value="Quadcopter (4 rotors)" colors={colors} />
            <DataRow label="Weight" value="~1.4kg" colors={colors} />
            <DataRow label="Max Speed" value="72 km/h (20 m/s)" colors={colors} />
            <DataRow label="Max Range" value="7km (advertised)" colors={colors} />
            <DataRow label="Flight Time" value="~30 min (typical)" colors={colors} />
            <DataRow label="Camera" value='20MP 1" sensor, 4K video' colors={colors} />
            <DataRow label="Price" value="~$1,589 USD" colors={colors} />
          </Section>

          {/* Detection History */}
          <Section title="DETECTION HISTORY" colors={colors}>
            <div style={{ fontSize: 10, color: colors.text, marginBottom: 8 }}>
              ✓ Seen before <span style={{ color: colors.teal, fontWeight: 'bold' }}>3 times</span> today
            </div>
            <div style={{ fontSize: 9, color: colors.textMuted }}>
              {detectionHistory.map((d, i) => (
                <div key={i} style={{ padding: '4px 0', borderBottom: '1px solid ' + colors.border }}>
                  <Clock size={10} style={{ display: 'inline', marginRight: 4 }} />
                  {d.time} - {d.range} at {d.bearing}
                </div>
              ))}
            </div>
          </Section>

          {/* Current Flight Info */}
          <Section title="CURRENT FLIGHT DATA" colors={colors}>
            <DataRow label="Time in Air" value="~12 minutes" colors={colors} />
            <DataRow label="Estimated Battery" value="60% (~18min left)" colors={colors} />
            <DataRow label="Track Quality" value="85% (Excellent)" colors={colors} />
            <DataRow label="Signal Strength" value="91 dBm (Strong)" colors={colors} />
            <DataRow label="GPS Lock" value="12 satellites" colors={colors} />
            <DataRow label="Movement" value="Approaching (−2.5 m/s)" colors={colors} />
          </Section>

          {/* RF Analysis */}
          <Section title="RF SIGNATURE ANALYSIS" colors={colors}>
            <DataRow label="Control Freq" value="2.437 GHz (WiFi Ch 6)" colors={colors} />
            <DataRow label="Video Freq" value="5.745 GHz" colors={colors} />
            <DataRow label="Telemetry" value="433 MHz (MAVLink)" colors={colors} />
            <DataRow label="Encryption" value="WPA2-PSK (Standard)" colors={colors} />
            <DataRow label="SSID" value="DJI_FPV_XXXXXX" colors={colors} />
          </Section>

          {/* Threat Assessment */}
          <Section title="THREAT ASSESSMENT" colors={colors}>
            <div style={{ fontSize: 9, color: colors.textMuted, lineHeight: 1.6 }}>
              <div style={{ marginBottom: 6 }}>✓ Commercial drone (not military)</div>
              <div style={{ marginBottom: 6 }}>✓ Standard DJI flight pattern</div>
              <div style={{ marginBottom: 6 }}>✓ No unusual modifications detected</div>
              <div style={{ marginBottom: 6 }}>⚠ Flying in restricted airspace</div>
              <div style={{ marginBottom: 6 }}>⚠ Altitude violation (max 120m allowed)</div>
              <div style={{ color: rangeKm < 5 ? colors.error : colors.warning }}>
                {rangeKm < 5 ? '⚠️ CRITICAL: Within 5km danger zone' : rangeKm < 10 ? '⚠ WARNING: Approaching security perimeter' : '✓ Outside critical range'}
              </div>
            </div>
          </Section>

          {/* Action Buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginTop: 16 }}>
            <ActionButton icon={Share2} label="SHARE TO LOCRYPT" onClick={shareToLocrypt} color={colors.teal} />
            <ActionButton icon={Shield} label="MARK AS SAFE" onClick={markSafe} color={colors.success} active={targetStatus === 'safe'} />
            <ActionButton icon={AlertTriangle} label="MARK HOSTILE" onClick={markHostile} color={colors.error} active={targetStatus === 'hostile'} />
            <ActionButton icon={Eye} label="TRACK" onClick={() => alert('Tracking enabled')} color={colors.warning} />
            <ActionButton icon={Target} label="ENGAGE" onClick={() => alert('Engagement protocols')} color={colors.error} />
            <ActionButton icon={Radio} label="JAM SIGNAL" onClick={() => alert('Jamming activated')} color={colors.warning} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Drone3DVisualization({ colors, targetId }) {
  const canvasRef = useRef(null);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;

    let animId;
    let currentRotation = rotation;

    const draw = () => {
      ctx.fillStyle = colors.primary;
      ctx.fillRect(0, 0, w, h);

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(currentRotation);

      // Draw wireframe drone (top-down view)
      const droneSize = 80;
      
      // Center body
      ctx.strokeStyle = colors.teal;
      ctx.lineWidth = 2;
      ctx.shadowBlur = 15;
      ctx.shadowColor = colors.teal;
      
      // Center circle (main body)
      ctx.beginPath();
      ctx.arc(0, 0, droneSize / 4, 0, Math.PI * 2);
      ctx.stroke();
      
      // 4 arms for quadcopter
      const armLength = droneSize / 2;
      for (let i = 0; i < 4; i++) {
        const angle = (i * Math.PI / 2) + Math.PI / 4;
        const x = Math.cos(angle) * armLength;
        const y = Math.sin(angle) * armLength;
        
        // Arm
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(x, y);
        ctx.stroke();
        
        // Rotor at end
        ctx.beginPath();
        ctx.arc(x, y, 12, 0, Math.PI * 2);
        ctx.stroke();
        
        // Rotor blades (spinning)
        const bladeAngle = currentRotation * 10 + i * Math.PI / 2;
        ctx.beginPath();
        ctx.moveTo(x + Math.cos(bladeAngle) * 12, y + Math.sin(bladeAngle) * 12);
        ctx.lineTo(x - Math.cos(bladeAngle) * 12, y - Math.sin(bladeAngle) * 12);
        ctx.stroke();
      }

      // Camera gimbal
      ctx.fillStyle = colors.teal + '80';
      ctx.fillRect(-8, -8, 16, 16);
      ctx.strokeRect(-8, -8, 16, 16);

      ctx.shadowBlur = 0;
      ctx.restore();

      // Target ID label
      ctx.fillStyle = colors.teal;
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(targetId, cx, cy + droneSize + 20);

      currentRotation += 0.02;
      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => { if (animId) cancelAnimationFrame(animId); };
  }, [colors, targetId, rotation]);

  return <canvas ref={canvasRef} width={350} height={350} style={{ width: '100%', display: 'block' }} />;
}

function InfoCard({ label, value, icon, colors }) {
  return (
    <div style={{ padding: 12, background: colors.primary, border: '1px solid ' + colors.border, borderRadius: 4 }}>
      <div style={{ fontSize: 9, color: colors.textMuted, marginBottom: 4 }}>{icon} {label}</div>
      <div style={{ fontSize: 16, fontWeight: 'bold', color: colors.teal }}>{value}</div>
    </div>
  );
}

function Section({ title, children, colors }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 'bold', color: colors.teal, marginBottom: 8, paddingBottom: 6, borderBottom: '1px solid ' + colors.border, letterSpacing: '0.1em' }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function DataRow({ label, value, colors }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 10, borderBottom: '1px solid ' + colors.border }}>
      <span style={{ color: colors.textMuted }}>{label}:</span>
      <span style={{ color: colors.text, fontWeight: 'bold' }}>{value}</span>
    </div>
  );
}

function ActionButton({ icon: Icon, label, onClick, color, active }) {
  return (
    <button 
      onClick={onClick}
      style={{ 
        padding: '10px 12px', 
        borderRadius: 4, 
        fontSize: 10, 
        fontWeight: 'bold', 
        background: active ? color : 'transparent', 
        color: active ? '#0A1628' : color, 
        border: '2px solid ' + color, 
        cursor: 'pointer', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        gap: 6,
        boxShadow: '0 0 10px ' + color,
        transition: 'all 0.2s'
      }}
    >
      <Icon size={14} />
      <span>{label}</span>
    </button>
  );
}
