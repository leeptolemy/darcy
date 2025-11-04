import React, { useEffect, useRef } from 'react';

export function CircularGauge({ value, max, label, unit, colors }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 10;
    
    const percentage = (value / max) * 100;
    const angle = (percentage / 100) * Math.PI * 2 - Math.PI / 2;

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Background circle
      ctx.strokeStyle = colors.border;
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.stroke();

      // Progress arc
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, colors.teal);
      gradient.addColorStop(1, colors.success);
      
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, -Math.PI / 2, angle);
      ctx.stroke();

      // Center text
      ctx.fillStyle = colors.text;
      ctx.font = 'bold 24px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${Math.round(percentage)}${unit}`, centerX, centerY + 5);
      
      ctx.font = '10px monospace';
      ctx.fillStyle = colors.textMuted;
      ctx.fillText(label, centerX, centerY + 20);
    };

    draw();
  }, [value, max, label, unit, colors]);

  return <canvas ref={canvasRef} width={100} height={100} style={{ width: '100%', display: 'block' }} />;
}
