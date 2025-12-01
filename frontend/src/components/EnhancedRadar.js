import React, { useRef, useEffect } from 'react';

export function EnhancedRadar({ colors, status, data, targets, onTargetClick, showPredictions }) {
  const canvasRef = useRef(null);
  const angleRef = useRef(0);
  const targetPositionsRef = useRef([]);
  const [predictions, setPredictions] = useState([]);
  const [validatedPredictions, setValidatedPredictions] = useState([]);

  // Fetch predictions every 3 seconds
  useEffect(() => {
    const fetchPredictions = async () => {
      try {
        const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
        const response = await fetch(`${BACKEND_URL}/api/predictions/active`);
        const data = await response.json();
        setPredictions(data.predictions || []);
      } catch (e) {}
    };
    
    fetchPredictions();
    const interval = setInterval(fetchPredictions, 3000);
    return () => clearInterval(interval);
  }, []);

  // Check for validated predictions (for checkmark animation)
  useEffect(() => {
    predictions.forEach(pred => {
      if (pred.seconds_remaining === 0 && pred.show_on_radar) {
        // Check if real drone appeared at predicted location
        const matchingTarget = targets.find(t => {
          const bearingMatch = t.bearing?.match(/([\d.]+)/);
          if (!bearingMatch) return false;
          const targetBearing = parseFloat(bearingMatch[1]);
          const predBearing = parseFloat(pred.bearing?.replace('°', '') || 0);
          return Math.abs(targetBearing - predBearing) < 10; // Within 10 degrees
        });
        
        if (matchingTarget && !validatedPredictions.find(v => v.id === pred.id)) {
          setValidatedPredictions(prev => [...prev, { ...pred, targetId: matchingTarget.id, validatedAt: Date.now() }]);
          setTimeout(() => {
            setValidatedPredictions(prev => prev.filter(v => v.id !== pred.id));
          }, 5000); // Remove after 5 seconds
        }
      }
    });
  }, [predictions, targets]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const r = Math.min(w, h) / 2 - 50;
    let aid;

    const drawTopography = () => {
      // Draw terrain contours (mountains around Cluj)
      ctx.strokeStyle = 'rgba(0, 217, 255, 0.08)';
      ctx.lineWidth = 1;
      
      // Random contour lines for terrain
      for (let i = 0; i < 8; i++) {
        const offsetAngle = i * Math.PI / 4;
        const offsetDist = r * 0.3 + (i % 3) * r * 0.15;
        
        ctx.beginPath();
        for (let angle = 0; angle < Math.PI * 2; angle += 0.1) {
          const dist = offsetDist + Math.sin(angle * 3 + i) * r * 0.1;
          const x = cx + Math.cos(angle + offsetAngle) * dist;
          const y = cy + Math.sin(angle + offsetAngle) * dist;
          if (angle === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
      }
    };

    const drawDrone = (x, y, sz, t, thr) => {
      ctx.save();
      const p = Math.sin(Date.now() / 300) * 0.3 + 0.7;
      ctx.shadowBlur = 25 * p;
      ctx.shadowColor = colors.error;
      
      // 3-point propeller design (like image)
      ctx.strokeStyle = colors.error;
      ctx.fillStyle = colors.error;
      ctx.lineWidth = 3;
      
      // Center
      ctx.beginPath();
      ctx.arc(x, y, sz, 0, Math.PI * 2);
      ctx.fill();
      
      // 3 radiating arms
      for (let i = 0; i < 3; i++) {
        const angle = (i * Math.PI * 2 / 3) + Date.now() / 1000;
        const armX = x + Math.cos(angle) * (sz + 15);
        const armY = y + Math.sin(angle) * (sz + 15);
        
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(armX, armY);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(armX, armY, 6, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Outer rings
      [20, 14].forEach((rs, idx) => {
        ctx.strokeStyle = colors.error + (idx === 0 ? '40' : '80');
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, sz + rs, 0, Math.PI * 2);
        ctx.stroke();
      });
      
      ctx.shadowBlur = 0;
      ctx.restore();
    };

    const draw = () => {
      targetPositionsRef.current = [];
      
      ctx.fillStyle = colors.surface;
      ctx.fillRect(0, 0, w, h);

      // Fine background grid
      ctx.strokeStyle = 'rgba(0, 217, 255, 0.02)';
      ctx.lineWidth = 0.3;
      for (let i = 0; i < w; i += 10) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, h); ctx.stroke();
      }
      for (let i = 0; i < h; i += 10) {
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(w, i); ctx.stroke();
      }

      // Topographic overlay
      drawTopography();

      // Range rings (multiple)
      ctx.strokeStyle = colors.gridLine;
      ctx.lineWidth = 1.5;
      for (let i = 1; i <= 5; i++) {
        ctx.beginPath();
        ctx.arc(cx, cy, (r / 5) * i, 0, Math.PI * 2);
        ctx.stroke();
      }
      
      // Radial lines every 10 degrees
      ctx.lineWidth = 0.5;
      for (let deg = 0; deg < 360; deg += 10) {
        const angle = (deg - 90) * (Math.PI / 180);
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + r * Math.cos(angle), cy + r * Math.sin(angle));
        ctx.stroke();
      }
      
      // White crosshairs (prominent)
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx - r, cy);
      ctx.lineTo(cx + r, cy);
      ctx.moveTo(cx, cy - r);
      ctx.lineTo(cx, cy + r);
      ctx.stroke();
      
      // Degree markers every 10 degrees
      ctx.fillStyle = colors.text;
      ctx.font = '9px monospace';
      for (let deg = 0; deg < 360; deg += 10) {
        const angle = (deg - 90) * (Math.PI / 180);
        const labelDist = r + 15;
        const x = cx + labelDist * Math.cos(angle) - 10;
        const y = cy + labelDist * Math.sin(angle) + 4;
        ctx.fillText(deg.toString(), x, y);
      }
      
      // Range labels
      ctx.fillStyle = colors.teal;
      ctx.font = 'bold 11px monospace';
      for (let i = 1; i <= 5; i++) {
        ctx.fillText((i * 10) + 'km', cx + 10, cy - (r / 5) * i + 5);
      }
      
      // Compass
      ctx.font = 'bold 18px monospace';
      ctx.shadowBlur = 15;
      ctx.shadowColor = colors.teal;
      ctx.fillText('N', cx - 8, cy - r - 12);
      ctx.fillText('E', cx + r + 18, cy + 6);
      ctx.fillText('S', cx - 8, cy + r + 22);
      ctx.fillText('W', cx - r - 25, cy + 6);
      ctx.shadowBlur = 0;
      
      // Enhanced sweep beam (bright illuminated sector)
      if (status?.is_running) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angleRef.current);
        
        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
        grad.addColorStop(0, 'rgba(0, 217, 255, 0.6)');
        grad.addColorStop(0.5, 'rgba(0, 217, 255, 0.3)');
        grad.addColorStop(1, 'transparent');
        
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, r, -Math.PI / 4, Math.PI / 6);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
        angleRef.current += 0.03;
      }

      // Draw targets
      targets.forEach(t => {
        const bm = t.bearing?.match(/([\d.]+)/);
        const rm = t.range?.match(/([\d.]+)/);
        const am = t.altitude?.match(/([\d.]+)/);
        
        if (bm && rm) {
          const b = parseFloat(bm[1]);
          const rng = parseFloat(rm[1]);
          const alt = am ? parseFloat(am[1]) : 100;
          const br = (rng / 50) * r;
          const ba = (b - 90) * (Math.PI / 180);
          const bx = cx + br * Math.cos(ba);
          const by = cy + br * Math.sin(ba);
          const sz = Math.max(10, Math.min(16, 20 - (alt / 50)));
          const thr = rng < 5 ? 'HIGH' : rng < 20 ? 'MEDIUM' : 'LOW';
          
          targetPositionsRef.current.push({ target: t, x: bx, y: by, radius: sz + 25 });
          drawDrone(bx, by, sz, t, thr);
        }
      });

      aid = requestAnimationFrame(draw);
    };

    draw();
    return () => { if (aid) cancelAnimationFrame(aid); };
  }, [colors, status, targets]);

  const handleClick = (e) => {
    if (!onTargetClick) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;
    for (const pos of targetPositionsRef.current) {
      const dist = Math.sqrt(Math.pow(clickX - pos.x, 2) + Math.pow(clickY - pos.y, 2));
      if (dist <= pos.radius) {
        onTargetClick(pos.target);
        return;
      }
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas ref={canvasRef} width={800} height={800} style={{ width: '100%', cursor: 'pointer' }} onClick={handleClick} />
      {data && <div style={{ position: 'absolute', top: 16, left: 20, fontSize: 8, padding: 8, background: 'rgba(0, 0, 0, 0.85)', border: '1px solid ' + colors.teal, borderRadius: 3 }}><div style={{ color: colors.teal, fontWeight: 'bold', marginBottom: 4 }}>SCAN</div><div>RNG: {data.range}</div><div>BRG: {data.bearing}</div><div>TGT: {data.detections}</div><div>SIG: {data.signalStrength}%</div></div>}
      {targets.length > 0 && <div style={{ position: 'absolute', top: 16, right: 20, fontSize: 10, padding: 8, background: 'rgba(255, 51, 102, 0.3)', border: '2px solid ' + colors.error, borderRadius: 3, animation: 'pulse 2s infinite' }}><div style={{ color: colors.error, fontWeight: 'bold' }}>⚠ {targets.length} THREAT{targets.length > 1 ? 'S' : ''}</div></div>}
    </div>
  );
}
