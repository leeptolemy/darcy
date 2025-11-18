import React, { useRef, useEffect } from 'react';

export function ClujMap({ colors, targets }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d'), w = cv.width, h = cv.height, cx = w / 2, cy = h / 2;

    const draw = () => {
      ctx.fillStyle = colors.surface;
      ctx.fillRect(0, 0, w, h);
      
      // Grid overlay
      ctx.strokeStyle = 'rgba(0, 217, 255, 0.1)';
      ctx.lineWidth = 0.5;
      for (let i = 0; i <= 8; i++) {
        ctx.beginPath(); ctx.moveTo((w / 8) * i, 0); ctx.lineTo((w / 8) * i, h); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, (h / 8) * i); ctx.lineTo(w, (h / 8) * i); ctx.stroke();
      }
      
      // Cluj-Napoca street grid (simplified)
      ctx.strokeStyle = 'rgba(0, 217, 255, 0.15)';
      ctx.lineWidth = 1;
      
      // Main streets (horizontal)
      [0.3, 0.5, 0.7].forEach(ratio => {
        ctx.beginPath();
        ctx.moveTo(w * 0.2, h * ratio);
        ctx.lineTo(w * 0.8, h * ratio);
        ctx.stroke();
      });
      
      // Main streets (vertical)
      [0.3, 0.5, 0.7].forEach(ratio => {
        ctx.beginPath();
        ctx.moveTo(w * ratio, h * 0.2);
        ctx.lineTo(w * ratio, h * 0.8);
        ctx.stroke();
      });
      
      // River Someș (curved line)
      ctx.strokeStyle = 'rgba(0, 150, 255, 0.3)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(w * 0.1, h * 0.4);
      ctx.quadraticCurveTo(w * 0.4, h * 0.6, w * 0.9, h * 0.5);
      ctx.stroke();
      
      // Districts (subtle rectangles)
      ctx.strokeStyle = 'rgba(0, 217, 255, 0.08)';
      ctx.lineWidth = 1;
      [[0.2, 0.2, 0.3, 0.3], [0.5, 0.2, 0.3, 0.3], [0.2, 0.5, 0.3, 0.3], [0.5, 0.5, 0.3, 0.3]].forEach(([rx, ry, rw, rh]) => {
        ctx.strokeRect(w * rx, h * ry, w * rw, h * rh);
      });
      
      // Labels
      ctx.fillStyle = colors.textMuted;
      ctx.font = '7px monospace';
      ctx.fillText('CENTRU', w * 0.48, h * 0.48);
      ctx.fillText('MANASTUR', w * 0.25, h * 0.25);
      ctx.fillText('GHEORGHENI', w * 0.65, h * 0.25);
      
      // Base (Cluj-Napoca center)
      ctx.fillStyle = colors.success;
      ctx.shadowBlur = 15;
      ctx.shadowColor = colors.success;
      ctx.beginPath();
      ctx.arc(cx, cy, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = colors.success;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, 14, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
      
      ctx.fillStyle = colors.success;
      ctx.font = 'bold 9px monospace';
      ctx.fillText('CLUJ-NAPOCA', cx + 20, cy + 4);
      
      // Targets on map
      targets.forEach((t, idx) => {
        if (t.latitude && t.longitude) {
          const latDiff = (parseFloat(t.latitude) - 46.7712) * 600;
          const lonDiff = (parseFloat(t.longitude) - 23.6236) * 600;
          const x = cx + lonDiff;
          const y = cy - latDiff;
          
          if (x > 0 && x < w && y > 0 && y < h) {
            const pulse = Math.sin(Date.now() / 200 + idx) * 4 + 10;
            ctx.fillStyle = colors.error;
            ctx.shadowBlur = 15;
            ctx.shadowColor = colors.error;
            ctx.beginPath();
            ctx.moveTo(x, y - 8);
            ctx.lineTo(x - 6, y + 6);
            ctx.lineTo(x + 6, y + 6);
            ctx.closePath();
            ctx.fill();
            ctx.shadowBlur = 0;
            
            ctx.strokeStyle = colors.error;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(x, y, pulse, 0, Math.PI * 2);
            ctx.stroke();
            
            ctx.fillStyle = colors.error;
            ctx.font = 'bold 8px monospace';
            ctx.fillText(t.id || `T${idx}`, x + 12, y - 4);
          }
        }
      });
      
      requestAnimationFrame(draw);
    };
    draw();
  }, [colors, targets]);

  return <canvas ref={canvasRef} width={300} height={200} style={{ width: '100%', display: 'block' }} />;
}
