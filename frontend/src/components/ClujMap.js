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
      
      // Main coordinate grid
      ctx.strokeStyle = 'rgba(0, 217, 255, 0.15)';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 6; i++) {
        ctx.beginPath(); ctx.moveTo((w / 6) * i, 0); ctx.lineTo((w / 6) * i, h); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, (h / 6) * i); ctx.lineTo(w, (h / 6) * i); ctx.stroke();
      }
      
      // River Someș (more prominent, curved)
      ctx.strokeStyle = 'rgba(0, 150, 255, 0.4)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(w * 0.1, h * 0.35);
      ctx.quadraticCurveTo(w * 0.3, h * 0.55, w * 0.5, h * 0.5);
      ctx.quadraticCurveTo(w * 0.7, h * 0.45, w * 0.9, h * 0.55);
      ctx.stroke();
      
      // Main roads/boulevards (more detailed)
      ctx.strokeStyle = 'rgba(0, 217, 255, 0.25)';
      ctx.lineWidth = 2;
      
      // Horizontal main streets
      [0.25, 0.5, 0.75].forEach(ratio => {
        ctx.beginPath();
        ctx.moveTo(w * 0.15, h * ratio);
        ctx.lineTo(w * 0.85, h * ratio);
        ctx.stroke();
      });
      
      // Vertical main streets
      [0.3, 0.5, 0.7].forEach(ratio => {
        ctx.beginPath();
        ctx.moveTo(w * ratio, h * 0.15);
        ctx.lineTo(w * ratio, h * 0.85);
        ctx.stroke();
      });
      
      // Secondary streets (lighter)
      ctx.strokeStyle = 'rgba(0, 217, 255, 0.1)';
      ctx.lineWidth = 1;
      for (let i = 0.2; i < 0.9; i += 0.1) {
        ctx.beginPath();
        ctx.moveTo(w * 0.15, h * i);
        ctx.lineTo(w * 0.85, h * i);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(w * i, h * 0.15);
        ctx.lineTo(w * i, h * 0.85);
        ctx.stroke();
      }
      
      // District boundaries
      ctx.strokeStyle = 'rgba(0, 217, 255, 0.12)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      [[0.2, 0.15, 0.25, 0.35], [0.5, 0.15, 0.3, 0.35], [0.2, 0.55, 0.25, 0.3], [0.5, 0.55, 0.3, 0.3]].forEach(([x, y, w, h]) => {
        ctx.strokeRect(cv.width * x, cv.height * y, cv.width * w, cv.height * h);
      });
      ctx.setLineDash([]);
      
      // Landmarks (simplified buildings)
      ctx.fillStyle = 'rgba(0, 217, 255, 0.15)';
      [[0.48, 0.48, 0.04, 0.04], [0.35, 0.3, 0.03, 0.03], [0.65, 0.7, 0.03, 0.03]].forEach(([x, y, bw, bh]) => {
        ctx.fillRect(w * x, h * y, w * bw, h * bh);
      });
      
      // District labels
      ctx.fillStyle = colors.textMuted;
      ctx.font = '7px monospace';
      ctx.fillText('CENTRU', w * 0.48, h * 0.48);
      ctx.fillText('MANASTUR', w * 0.25, h * 0.25);
      ctx.fillText('GHEORGHENI', w * 0.65, h * 0.25);
      ctx.fillText('GRIGORESCU', w * 0.3, h * 0.68);
      
      // BASE marker (Cluj-Napoca center)
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
      ctx.font = 'bold 8px monospace';
      ctx.fillText('CLUJ-NAPOCA', cx + 18, cy + 3);
      ctx.font = '6px monospace';
      ctx.fillStyle = colors.textMuted;
      ctx.fillText('46.7712°N 23.6236°E', cx + 18, cy + 12);
      
      // Targets on map (accurate GPS positioning)
      targets.forEach((t, idx) => {
        if (t.latitude && t.longitude) {
          const latDiff = (parseFloat(t.latitude) - 46.7712) * 800;
          const lonDiff = (parseFloat(t.longitude) - 23.6236) * 800;
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
            ctx.font = 'bold 7px monospace';
            ctx.fillText(t.id || `T${idx}`, x + 10, y - 3);
          }
        }
      });
      
      requestAnimationFrame(draw);
    };
    draw();
  }, [colors, targets]);

  return <canvas ref={canvasRef} width={300} height={200} style={{ width: '100%', display: 'block' }} />;
}
