import React, { useRef, useEffect } from 'react';

export function Altitude3D({ colors, targets }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d'), w = cv.width, h = cv.height;

    const draw = () => {
      ctx.fillStyle = colors.surface;
      ctx.fillRect(0, 0, w, h);
      
      // Horizon line
      const horizonY = h * 0.75;
      ctx.strokeStyle = colors.gridLine;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, horizonY);
      ctx.lineTo(w, horizonY);
      ctx.stroke();
      
      // Ground reference grid
      ctx.strokeStyle = 'rgba(0, 217, 255, 0.05)';
      ctx.lineWidth = 0.5;
      for (let i = 0; i < 10; i++) {
        const y = horizonY + (h - horizonY) * (i / 10);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
      
      // Y-axis altitude labels
      ctx.fillStyle = colors.textMuted;
      ctx.font = '7px monospace';
      [0, 200, 400, 600, 800].forEach((alt, i) => {
        const y = horizonY - (horizonY * 0.9) * (alt / 800);
        ctx.fillText(alt + 'm', 5, y);
        
        ctx.strokeStyle = colors.gridLine;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(30, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      });
      
      // Draw drones at altitude (side view)
      const sortedTargets = [...targets].sort((a, b) => {
        const distA = parseFloat(a.range?.match(/([\d.]+)/)?.[1] || 0);
        const distB = parseFloat(b.range?.match(/([\d.]+)/)?.[1] || 0);
        return distB - distA; // Far to near
      });
      
      sortedTargets.forEach((t, idx) => {
        const altMatch = t.altitude?.match(/([\d.]+)/);
        const rangeMatch = t.range?.match(/([\d.]+)/);
        
        if (altMatch && rangeMatch) {
          const alt = parseFloat(altMatch[1]);
          const range = parseFloat(rangeMatch[1]);
          
          // Position: X based on distance, Y based on altitude
          const x = 50 + (range / 50) * (w - 100);
          const y = horizonY - (horizonY * 0.9) * (alt / 800);
          
          // Vertical line from ground to drone
          ctx.strokeStyle = colors.teal + '60';
          ctx.lineWidth = 1;
          ctx.setLineDash([2, 2]);
          ctx.beginPath();
          ctx.moveTo(x, horizonY);
          ctx.lineTo(x, y);
          ctx.stroke();
          ctx.setLineDash([]);
          
          // Drone icon (3D wireframe)
          const droneSize = 8;
          ctx.fillStyle = colors.error;
          ctx.shadowBlur = 12;
          ctx.shadowColor = colors.error;
          
          // Draw simple 3D drone shape
          ctx.save();
          ctx.translate(x, y);
          
          // Body
          ctx.fillRect(-droneSize, -droneSize/2, droneSize*2, droneSize);
          
          // Wings/rotors
          ctx.fillStyle = colors.error + '80';
          ctx.fillRect(-droneSize*1.5, -droneSize/4, droneSize/2, droneSize/2);
          ctx.fillRect(droneSize, -droneSize/4, droneSize/2, droneSize/2);
          
          ctx.restore();
          ctx.shadowBlur = 0;
          
          // Label
          ctx.fillStyle = colors.error;
          ctx.font = 'bold 7px monospace';
          ctx.fillText(t.id || `T${idx}`, x + droneSize + 4, y - 4);
          ctx.font = '6px monospace';
          ctx.fillStyle = colors.textMuted;
          ctx.fillText(alt + 'm', x + droneSize + 4, y + 4);
        }
      });
      
      // Ground label
      ctx.fillStyle = colors.textMuted;
      ctx.font = '8px monospace';
      ctx.fillText('GROUND', 5, h - 5);
      
      requestAnimationFrame(draw);
    };
    draw();
  }, [colors, targets]);

  return <canvas ref={canvasRef} width={260} height={140} style={{ width: '100%', display: 'block' }} />;
}
