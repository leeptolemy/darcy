import React, { useRef, useEffect } from 'react';

export function RadarSweep({ colors, status, data, targets, onTargetClick }) {
  const canvasRef = useRef(null);
  const angleRef = useRef(0);
  const targetPositionsRef = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const r = Math.min(w, h) / 2 - 40;
    let aid;

    const drawDrone = (x, y, sz, t, thr) => {
      ctx.save();
      const p = Math.sin(Date.now() / 300) * 0.3 + 0.7;
      ctx.shadowBlur = 20 * p;
      ctx.shadowColor = colors.error;
      
      [20, 14, 10].forEach((rs, idx) => {
        ctx.strokeStyle = idx === 0 ? colors.error + '30' : idx === 1 ? colors.error + '60' : colors.error;
        ctx.lineWidth = idx === 0 ? 2 : 3;
        ctx.beginPath();
        ctx.arc(x, y, sz + rs, 0, Math.PI * 2);
        ctx.stroke();
      });
      
      ctx.fillStyle = colors.error;
      ctx.beginPath();
      ctx.arc(x, y, sz, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = colors.text;
      ctx.beginPath();
      ctx.moveTo(x, y - sz * 0.6);
      ctx.lineTo(x - sz * 0.5, y + sz * 0.4);
      ctx.lineTo(x + sz * 0.5, y + sz * 0.4);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
      
      const bx = x + 30;
      const by = y - 30;
      const bw = 100;
      const bh = 55;
      
      ctx.strokeStyle = colors.error;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x + sz + 8, y);
      ctx.lineTo(bx, by + bh / 2);
      ctx.stroke();
      
      ctx.fillStyle = 'rgba(255, 51, 102, 0.95)';
      ctx.fillRect(bx, by, bw, bh);
      ctx.strokeRect(bx, by, bw, bh);
      
      ctx.fillStyle = colors.text;
      ctx.font = 'bold 9px monospace';
      ctx.fillText(t.id || 'TGT', bx + 4, by + 12);
      ctx.font = '7px monospace';
      ctx.fillText(t.range + ' ' + t.bearing, bx + 4, by + 23);
      ctx.fillText(t.altitude + ' ' + t.speed, bx + 4, by + 33);
      ctx.fillText('SIZE: ' + sz + 'm', bx + 4, by + 43);
      
      const tc = thr === 'HIGH' ? colors.error : thr === 'MEDIUM' ? colors.warning : colors.teal;
      ctx.fillStyle = tc;
      ctx.fillRect(bx + 58, by + 40, 38, 10);
      ctx.fillStyle = colors.primary;
      ctx.font = 'bold 7px monospace';
      ctx.fillText(thr, bx + 62, by + 48);
      ctx.restore();
    };

    const draw = () => {
      // Clear target positions for new frame
      targetPositionsRef.current = [];
      
      ctx.fillStyle = colors.surface;
      ctx.fillRect(0, 0, w, h);
      
      ctx.strokeStyle = 'rgba(0, 217, 255, 0.03)';
      ctx.lineWidth = 0.3;
      for (let i = 0; i < w; i += 12) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, h);
        ctx.stroke();
      }
      for (let i = 0; i < h; i += 12) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(w, i);
        ctx.stroke();
      }
      
      ctx.strokeStyle = colors.gridLine;
      ctx.lineWidth = 1.5;
      for (let i = 1; i <= 4; i++) {
        ctx.beginPath();
        ctx.arc(cx, cy, (r / 4) * i, 0, Math.PI * 2);
        ctx.stroke();
      }
      
      for (let i = 0; i < 12; i++) {
        const a = (i * 30) * (Math.PI / 180);
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + r * Math.cos(a - Math.PI / 2), cy + r * Math.sin(a - Math.PI / 2));
        ctx.stroke();
      }
      
      ctx.strokeStyle = colors.teal;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx - r, cy);
      ctx.lineTo(cx + r, cy);
      ctx.moveTo(cx, cy - r);
      ctx.lineTo(cx, cy + r);
      ctx.stroke();
      
      ctx.fillStyle = colors.textMuted;
      ctx.font = '8px monospace';
      for (let deg = 0; deg < 360; deg += 30) {
        const a = (deg - 90) * (Math.PI / 180);
        const dx = cx + (r + 12) * Math.cos(a) - 6;
        const dy = cy + (r + 12) * Math.sin(a) + 3;
        ctx.fillText(deg.toString(), dx, dy);
      }
      
      ctx.fillStyle = colors.teal;
      ctx.font = 'bold 10px monospace';
      ['10', '20', '30', '40'].forEach((lb, i) => {
        ctx.fillText(lb + 'km', cx + 8, cy - (r / 4) * (i + 1) + 4);
      });
      
      ctx.font = 'bold 14px monospace';
      ctx.fillText('N', cx - 6, cy - r - 8);
      ctx.fillText('E', cx + r + 12, cy + 5);
      ctx.fillText('S', cx - 6, cy + r + 16);
      ctx.fillText('W', cx - r - 18, cy + 5);
      
      if (status?.is_running) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angleRef.current);
        
        const grad = ctx.createLinearGradient(0, 0, 0, -r);
        grad.addColorStop(0, 'transparent');
        grad.addColorStop(0.3, 'rgba(0, 217, 255, 0.15)');
        grad.addColorStop(0.7, 'rgba(0, 217, 255, 0.4)');
        grad.addColorStop(1, colors.teal + '60');
        
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, r, -Math.PI / 3, Math.PI / 10);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        angleRef.current += 0.04;
      }

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
          const sz = Math.max(10, Math.min(18, 22 - (alt / 50)));
          const thr = rng < 5 ? 'HIGH' : rng < 20 ? 'MEDIUM' : 'LOW';
          
          // Store position for click detection
          targetPositionsRef.current.push({
            target: t,
            x: bx,
            y: by,
            radius: sz + 25
          });
          
          drawDrone(bx, by, sz, t, thr);
        }
      });

      aid = requestAnimationFrame(draw);
    };

    draw();
    return () => { if (aid) cancelAnimationFrame(aid); };
  }, [colors, status, targets]);

  const handleCanvasClick = (event) => {
    if (!onTargetClick) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clickX = (event.clientX - rect.left) * scaleX;
    const clickY = (event.clientY - rect.top) * scaleY;
    
    // Check if click is near any target
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
      <canvas 
        ref={canvasRef} 
        width={700} 
        height={700} 
        style={{ width: '100%', display: 'block', cursor: onTargetClick ? 'pointer' : 'default' }}
        onClick={handleCanvasClick}
      />
      {data && (
        <div style={{ 
          position: 'absolute', 
          top: 16, 
          left: 20, 
          fontSize: 8, 
          padding: 8, 
          background: 'rgba(0, 0, 0, 0.85)', 
          border: '1px solid ' + colors.teal, 
          borderRadius: 3 
        }}>
          <div style={{ color: colors.teal, fontWeight: 'bold', marginBottom: 4 }}>SCAN</div>
          <div>RNG: {data.range}</div>
          <div>BRG: {data.bearing}</div>
          <div>TGT: {data.detections}</div>
          <div>SIG: {data.signalStrength}%</div>
        </div>
      )}
      {targets.length > 0 && (
        <div style={{ 
          position: 'absolute', 
          top: 16, 
          right: 20, 
          fontSize: 10, 
          padding: 8, 
          background: 'rgba(255, 51, 102, 0.3)', 
          border: '2px solid ' + colors.error, 
          borderRadius: 3, 
          animation: 'pulse 2s infinite' 
        }}>
          <div style={{ color: colors.error, fontWeight: 'bold' }}>
            ⚠ {targets.length} THREAT{targets.length > 1 ? 'S' : ''}
          </div>
        </div>
      )}
    </div>
  );
}
