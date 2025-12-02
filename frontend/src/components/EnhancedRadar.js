import React, { useRef, useEffect, useState } from 'react';

export function EnhancedRadar({ colors, status, data, targets, predictions, showPredictions, radarZoom, setRadarZoom, showMapBackground, onTargetClick, onPredictionClick }) {
  const canvasRef = useRef(null);
  const angleRef = useRef(0);
  const targetPositionsRef = useRef([]);
  const predictionPositionsRef = useRef([]);
  const [validations, setValidations] = useState([]);

  // Check for validated predictions
  useEffect(() => {
    if (!predictions || !targets) return;
    predictions.forEach(pred => {
      if (pred.seconds_remaining === 0 && pred.confidence >= 80) {
        const matchingTarget = targets.find(t => {
          const bm = t.bearing?.match(/([\d.]+)/);
          if (!bm) return false;
          const tb = parseFloat(bm[1]);
          const pb = parseFloat(pred.bearing?.replace('°', '') || 0);
          return Math.abs(tb - pb) < 10;
        });
        if (matchingTarget && !validations.find(v => v.id === pred.id)) {
          setValidations(prev => [...prev, { ...pred, validatedAt: Date.now() }]);
          setTimeout(() => setValidations(prev => prev.filter(v => v.id !== pred.id)), 5000);
        }
      }
    });
  }, [predictions, targets, validations]);

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
      predictionPositionsRef.current = [];
      
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
      
      // Range labels (adjust based on zoom)
      ctx.fillStyle = colors.teal;
      ctx.font = 'bold 11px monospace';
      const maxRange = radarZoom || 50;
      for (let i = 1; i <= 5; i++) {
        ctx.fillText((i * maxRange / 5) + 'km', cx + 10, cy - (r / 5) * i + 5);
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

      // Draw yellow prediction ghosts (if enabled and confidence > 80%)
      if (showPredictions && predictions) {
        predictions.forEach(pred => {
          if (pred.show_on_radar && pred.confidence >= 80) {
            const bm = pred.bearing?.match(/([\d.]+)/);
            if (bm) {
              const b = parseFloat(bm[1]);
              const rng = pred.predicted_range_km || 20;
              const br = (rng / maxRange) * r;  // Scale based on zoom
              const ba = (b - 90) * (Math.PI / 180);
              const px = cx + br * Math.cos(ba);
              const py = cy + br * Math.sin(ba);
              const sz = 12;
              
              predictionPositionsRef.current.push({ prediction: pred, x: px, y: py, radius: sz + 25 });
              
              // Draw yellow prediction
              ctx.save();
              const pulse = Math.sin(Date.now() / 400) * 0.3 + 0.7;
              ctx.shadowBlur = 20 * pulse;
              ctx.shadowColor = '#FFD700';
              
              // Dashed yellow rings
              [20, 14, 10].forEach((rs, idx) => {
                ctx.strokeStyle = '#FFD700' + (idx === 0 ? '40' : idx === 1 ? '70' : '');
                ctx.lineWidth = 2;
                ctx.setLineDash([5, 5]);
                ctx.beginPath();
                ctx.arc(px, py, sz + rs, 0, Math.PI * 2);
                ctx.stroke();
              });
              ctx.setLineDash([]);
              
              // Yellow filled center
              ctx.fillStyle = '#FFD700';
              ctx.beginPath();
              ctx.arc(px, py, sz, 0, Math.PI * 2);
              ctx.fill();
              
              // Question mark
              ctx.fillStyle = colors.primary;
              ctx.font = 'bold 12px monospace';
              ctx.textAlign = 'center';
              ctx.fillText('?', px, py + 4);
              
              ctx.shadowBlur = 0;
              
              // Countdown if ≤ 10s
              if (pred.show_countdown && pred.seconds_remaining <= 10) {
                const boxX = px + 25, boxY = py - 20, boxW = 60, boxH = 30;
                ctx.fillStyle = 'rgba(255, 215, 0, 0.95)';
                ctx.fillRect(boxX, boxY, boxW, boxH);
                ctx.strokeStyle = '#FFD700';
                ctx.lineWidth = 2;
                ctx.strokeRect(boxX, boxY, boxW, boxH);
                ctx.fillStyle = colors.primary;
                ctx.font = 'bold 9px monospace';
                ctx.textAlign = 'left';
                ctx.fillText(pred.id, boxX + 4, boxY + 12);
                ctx.font = 'bold 11px monospace';
                ctx.fillText(`⏰ ${pred.seconds_remaining}s`, boxX + 4, boxY + 24);
              }
              
              ctx.restore();
            }
          }
        });
      }
      
      // Draw validation checkmarks
      validations.forEach(val => {
        if (Date.now() - val.validatedAt < 5000) {
          const bm = val.bearing?.match(/([\d.]+)/);
          if (bm) {
            const b = parseFloat(bm[1]);
            const rng = 20;
            const br = (rng / 50) * r;
            const ba = (b - 90) * (Math.PI / 180);
            const vx = cx + br * Math.cos(ba);
            const vy = cy + br * Math.sin(ba);
            
            // Green checkmark
            ctx.save();
            const pulse = Math.sin(Date.now() / 200) * 0.2 + 0.8;
            ctx.shadowBlur = 30 * pulse;
            ctx.shadowColor = colors.success;
            ctx.fillStyle = colors.success;
            ctx.beginPath();
            ctx.arc(vx, vy, 20, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = colors.primary;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(vx - 8, vy);
            ctx.lineTo(vx - 2, vy + 6);
            ctx.lineTo(vx + 8, vy - 6);
            ctx.stroke();
            ctx.shadowBlur = 0;
            ctx.restore();
          }
        }
      });

      // Draw targets
      targets.forEach(t => {
        const bm = t.bearing?.match(/([\d.]+)/);
        const rm = t.range?.match(/([\d.]+)/);
        const am = t.altitude?.match(/([\d.]+)/);
        
        if (bm && rm) {
          const b = parseFloat(bm[1]);
          const rng = parseFloat(rm[1]);
          const alt = am ? parseFloat(am[1]) : 100;
          const br = (rng / maxRange) * r;  // Use maxRange already defined above
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
  }, [colors, status, targets, predictions, showPredictions, validations]);

  const handleClick = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;
    
    // Check predictions first
    if (onPredictionClick) {
      for (const pos of predictionPositionsRef.current) {
        const dist = Math.sqrt(Math.pow(clickX - pos.x, 2) + Math.pow(clickY - pos.y, 2));
        if (dist <= pos.radius) {
          onPredictionClick(pos.prediction);
          return;
        }
      }
    }
    
    // Then check targets
    if (onTargetClick) {
      for (const pos of targetPositionsRef.current) {
        const dist = Math.sqrt(Math.pow(clickX - pos.x, 2) + Math.pow(clickY - pos.y, 2));
        if (dist <= pos.radius) {
          onTargetClick(pos.target);
          return;
        }
      }
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas ref={canvasRef} width={800} height={800} style={{ width: '100%', cursor: 'pointer' }} onClick={handleClick} />
      {data && <div style={{ position: 'absolute', top: 16, left: 20, fontSize: 8, padding: 8, background: 'rgba(0, 0, 0, 0.85)', border: '1px solid ' + colors.teal, borderRadius: 3 }}><div style={{ color: colors.teal, fontWeight: 'bold', marginBottom: 4 }}>SCAN</div><div>RNG: {data.range}</div><div>BRG: {data.bearing}</div><div>TGT: {data.detections}</div><div>SIG: {data.signalStrength}%</div></div>}
      {/* Zoom Controls */}
      <div style={{ position: 'absolute', bottom: 16, left: 20, display: 'flex', gap: 4 }}>
        <button onClick={() => setRadarZoom(5)} style={{ padding: '6px 10px', fontSize: 9, fontWeight: 'bold', background: radarZoom === 5 ? colors.teal : 'rgba(0, 217, 255, 0.2)', border: '1px solid ' + colors.teal, borderRadius: 3, color: radarZoom === 5 ? colors.primary : colors.teal, cursor: 'pointer' }}>5 KM</button>
        <button onClick={() => setRadarZoom(20)} style={{ padding: '6px 10px', fontSize: 9, fontWeight: 'bold', background: radarZoom === 20 ? colors.teal : 'rgba(0, 217, 255, 0.2)', border: '1px solid ' + colors.teal, borderRadius: 3, color: radarZoom === 20 ? colors.primary : colors.teal, cursor: 'pointer' }}>20 KM</button>
        <button onClick={() => setRadarZoom(50)} style={{ padding: '6px 10px', fontSize: 9, fontWeight: 'bold', background: radarZoom === 50 ? colors.teal : 'rgba(0, 217, 255, 0.2)', border: '1px solid ' + colors.teal, borderRadius: 3, color: radarZoom === 50 ? colors.primary : colors.teal, cursor: 'pointer' }}>50 KM</button>
      </div>
      {targets.length > 0 && <div style={{ position: 'absolute', top: 16, right: 20, fontSize: 10, padding: 8, background: 'rgba(255, 51, 102, 0.3)', border: '2px solid ' + colors.error, borderRadius: 3, animation: 'pulse 2s infinite' }}><div style={{ color: colors.error, fontWeight: 'bold' }}>⚠ {targets.length} THREAT{targets.length > 1 ? 'S' : ''}</div></div>}
      {showPredictions && predictions?.filter(p => p.show_on_radar && p.confidence >= 80).length > 0 && (
        <div style={{ position: 'absolute', top: 60, right: 20, fontSize: 9, padding: 6, background: 'rgba(255, 215, 0, 0.2)', border: '1px solid #FFD700', borderRadius: 3 }}>
          <div style={{ color: '#FFD700', fontWeight: 'bold' }}>🤖 {predictions.filter(p => p.show_on_radar && p.confidence >= 80).length} PREDICTION{predictions.filter(p => p.show_on_radar && p.confidence >= 80).length > 1 ? 'S' : ''}</div>
        </div>
      )}
    </div>
  );
}
