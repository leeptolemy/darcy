import React, { useEffect, useRef } from 'react';

export function ThreatMatrix({ colors, targets }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    const cols = 8; // Range buckets
    const rows = 6; // Altitude buckets
    const cellWidth = width / cols;
    const cellHeight = height / rows;

    const draw = () => {
      ctx.fillStyle = colors.surface;
      ctx.fillRect(0, 0, width, height);

      // Draw grid
      ctx.strokeStyle = colors.border;
      ctx.lineWidth = 1;
      for (let i = 0; i <= cols; i++) {
        ctx.beginPath();
        ctx.moveTo(i * cellWidth, 0);
        ctx.lineTo(i * cellWidth, height);
        ctx.stroke();
      }
      for (let i = 0; i <= rows; i++) {
        ctx.beginPath();
        ctx.moveTo(0, i * cellHeight);
        ctx.lineTo(width, i * cellHeight);
        ctx.stroke();
      }

      // Plot targets as heat cells
      targets.forEach(target => {
        const rangeMatch = target.range?.match(/([\d.]+)/);
        const altMatch = target.altitude?.match(/([\d.]+)/);
        
        if (rangeMatch && altMatch) {
          const range = parseFloat(rangeMatch[1]);
          const alt = parseFloat(altMatch[1]);
          
          const col = Math.min(cols - 1, Math.floor((range / 50) * cols));
          const row = rows - 1 - Math.min(rows - 1, Math.floor((alt / 800) * rows));
          
          ctx.fillStyle = range < 5 ? colors.error : range < 20 ? colors.warning : colors.info;
          ctx.fillRect(col * cellWidth + 2, row * cellHeight + 2, cellWidth - 4, cellHeight - 4);
        }
      });

      // Labels
      ctx.fillStyle = colors.textMuted;
      ctx.font = '9px monospace';
      ctx.fillText('0km', 5, height - 5);
      ctx.fillText('50km', width - 30, height - 5);
      ctx.save();
      ctx.translate(10, height / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText('Altitude', 0, 0);
      ctx.restore();
    };

    draw();
  }, [colors, targets]);

  return <canvas ref={canvasRef} width={280} height={200} style={{ width: '100%', display: 'block' }} />;
}
