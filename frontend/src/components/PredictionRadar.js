import React, { useRef, useEffect, useState } from 'react';

export function EnhancedRadarWithPredictions({ colors, status, data, targets, predictions, showPredictions, onTargetClick, onPredictionClick }) {
  const canvasRef = useRef(null);
  const angleRef = useRef(0);
  const targetPositionsRef = useRef([]);
  const predictionPositionsRef = useRef([]);
  const [validations, setValidations] = useState([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d'), w = canvas.width, h = canvas.height, cx = w / 2, cy = h / 2, r = Math.min(w, h) / 2 - 50;
    let aid;

    const drawPrediction = (x, y, sz, pred) => {
      ctx.save();
      const pulse = Math.sin(Date.now() / 400) * 0.3 + 0.7;
      ctx.shadowBlur = 20 * pulse;
      ctx.shadowColor = '#FFD700';
      
      // Dashed yellow rings
      [20, 14, 10].forEach((rs, idx) => {
        ctx.strokeStyle = '#FFD700' + (idx === 0 ? '40' : idx === 1 ? '70' : '');
        ctx.lineWidth = idx === 0 ? 2 : 3;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.arc(x, y, sz + rs, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      });
      
      // Yellow filled center
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.arc(x, y, sz, 0, Math.PI * 2);
      ctx.fill();
      
      // Question mark symbol
      ctx.fillStyle = colors.primary;
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('?', x, y + 4);
      
      ctx.shadowBlur = 0;
      
      // Label with countdown if ≤ 10s
      if (pred.show_countdown && pred.seconds_remaining <= 10) {
        const boxX = x + 25, boxY = y - 20, boxW = 60, boxH = 30;
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
    };

    const drawValidation = (x, y) => {
      ctx.save();
      const pulse = Math.sin(Date.now() / 200) * 0.2 + 0.8;
      ctx.shadowBlur = 30 * pulse;
      ctx.shadowColor = colors.success;
      
      // Green checkmark circle
      ctx.fillStyle = colors.success;
      ctx.beginPath();
      ctx.arc(x, y, 20, 0, Math.PI * 2);
      ctx.fill();
      
      // Checkmark symbol
      ctx.strokeStyle = colors.primary;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x - 8, y);
      ctx.lineTo(x - 2, y + 6);
      ctx.lineTo(x + 8, y - 6);
      ctx.stroke();
      
      ctx.shadowBlur = 0;
      ctx.restore();
    };

    const draw = () => {
      targetPositionsRef.current = [];
      predictionPositionsRef.current = [];
      
      ctx.fillStyle = colors.surface;
      ctx.fillRect(0, 0, w, h);

      // Background grid and radar elements (keep existing code)
      ctx.strokeStyle = 'rgba(0, 217, 255, 0.03)';
      ctx.lineWidth = 0.3;
      for (let i = 0; i < w; i += 10) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, h); ctx.stroke();
      }
      for (let i = 0; i < h; i += 10) {
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(w, i); ctx.stroke();
      }

      // Range rings
      ctx.strokeStyle = colors.gridLine;
      ctx.lineWidth = 1.5;
      for (let i = 1; i <= 5; i++) {
        ctx.beginPath();
        ctx.arc(cx, cy, (r / 5) * i, 0, Math.PI * 2);
        ctx.stroke();
      }
      
      // Radial lines
      for (let i = 0; i < 12; i++) {
        const angle = (i * 30) * (Math.PI / 180);
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + r * Math.cos(angle - Math.PI / 2), cy + r * Math.sin(angle - Math.PI / 2));
        ctx.stroke();
      }
      
      // Crosshairs
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx - r, cy);
      ctx.lineTo(cx + r, cy);
      ctx.moveTo(cx, cy - r);
      ctx.lineTo(cx, cy + r);
      ctx.stroke();
      
      // Degree markers
      ctx.fillStyle = colors.textMuted;
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
      
      // Sweep beam
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
              const br = (rng / 50) * r;
              const ba = (b - 90) * (Math.PI / 180);
              const bx = cx + br * Math.cos(ba);
              const by = cy + br * Math.sin(ba);
              const sz = 12;
              
              predictionPositionsRef.current.push({ prediction: pred, x: bx, y: by, radius: sz + 25 });
              drawPrediction(bx, by, sz, pred);
            }
          }
        });
      }

      // Draw real targets (existing code - keep as is)
      // ... existing target drawing code ...

      // Draw validation checkmarks
      validations.forEach(val => {
        if (Date.now() - val.validatedAt < 5000) {
          // Find position of validated prediction
          const bm = val.bearing?.match(/([\d.]+)/);
          if (bm) {
            const b = parseFloat(bm[1]);
            const rng = 20;
            const br = (rng / 50) * r;
            const ba = (b - 90) * (Math.PI / 180);
            const bx = cx + br * Math.cos(ba);
            const by = cy + br * Math.sin(ba);
            drawValidation(bx, by);
          }
        }
      });

      aid = requestAnimationFrame(draw);
    };

    draw();
    return () => { if (aid) cancelAnimationFrame(aid); };
  }, [colors, status, targets, predictions, showPredictions, validations]);

  const handleClick = (e) => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;
    
    // Check prediction clicks first
    for (const pos of predictionPositionsRef.current) {
      const dist = Math.sqrt(Math.pow(clickX - pos.x, 2) + Math.pow(clickY - pos.y, 2));
      if (dist <= pos.radius) {
        if (onPredictionClick) onPredictionClick(pos.prediction);
        return;
      }
    }
    
    // Then check target clicks
    for (const pos of targetPositionsRef.current) {
      const dist = Math.sqrt(Math.pow(clickX - pos.x, 2) + Math.pow(clickY - pos.y, 2));
      if (dist <= pos.radius) {
        if (onTargetClick) onTargetClick(pos.target);
        return;
      }
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas ref={canvasRef} width={800} height={800} style={{ width: '100%', cursor: 'pointer' }} onClick={handleClick} />
      {data && <div style={{ position: 'absolute', top: 16, left: 20, fontSize: 8, padding: 8, background: 'rgba(0, 0, 0, 0.85)', border: '1px solid ' + colors.teal, borderRadius: 3 }}><div style={{ color: colors.teal, fontWeight: 'bold', marginBottom: 4 }}>SCAN</div><div>RNG: {data.range}</div><div>BRG: {data.bearing}</div><div>TGT: {data.detections}</div><div>SIG: {data.signalStrength}%</div></div>}
      {targets.length > 0 && <div style={{ position: 'absolute', top: 16, right: 20, fontSize: 10, padding: 8, background: 'rgba(255, 51, 102, 0.3)', border: '2px solid ' + colors.error, borderRadius: 3, animation: 'pulse 2s infinite' }}><div style={{ color: colors.error, fontWeight: 'bold' }}>⚠ {targets.length} THREAT{targets.length > 1 ? 'S' : ''}</div></div>}
      {showPredictions && predictions?.filter(p => p.show_on_radar && p.confidence >= 80).length > 0 && (
        <div style={{ position: 'absolute', top: 60, right: 20, fontSize: 9, padding: 6, background: 'rgba(255, 215, 0, 0.2)', border: '1px solid #FFD700', borderRadius: 3 }}>
          <div style={{ color: '#FFD700', fontWeight: 'bold' }}>🤖 {predictions.filter(p => p.show_on_radar && p.confidence >= 80).length} PREDICTION{predictions.filter(p => p.show_on_radar && p.confidence >= 80).length > 1 ? 'S' : ''}</div>
        </div>
      )}
    </div>
  );
}
