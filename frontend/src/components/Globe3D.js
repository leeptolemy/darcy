import React, { useEffect, useRef } from 'react';

export function Globe3D({ colors, targets }) {
  const canvasRef = useRef(null);
  const rotationRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const globeRadius = Math.min(width, height) / 2 - 20;
    let animationId;

    const draw = () => {
      ctx.fillStyle = colors.surface;
      ctx.fillRect(0, 0, width, height);

      // Outer glow
      ctx.shadowBlur = 20;
      ctx.shadowColor = colors.teal;
      ctx.strokeStyle = colors.teal;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(centerX, centerY, globeRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Globe fill
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, globeRadius);
      gradient.addColorStop(0, 'rgba(0, 100, 150, 0.3)');
      gradient.addColorStop(1, 'rgba(0, 50, 80, 0.8)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, globeRadius, 0, Math.PI * 2);
      ctx.fill();

      // Latitude lines
      ctx.strokeStyle = 'rgba(0, 217, 255, 0.2)';
      ctx.lineWidth = 1;
      for (let lat = -60; lat <= 60; lat += 30) {
        const yOffset = (lat / 90) * globeRadius * 0.8;
        const ellipseWidth = Math.cos((lat * Math.PI) / 180) * globeRadius;
        
        ctx.beginPath();
        ctx.ellipse(centerX, centerY + yOffset, ellipseWidth, globeRadius / 10, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Longitude lines
      for (let lon = 0; lon < 360; lon += 30) {
        const angle = ((lon + rotationRef.current) % 360) * (Math.PI / 180);
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, Math.abs(Math.sin(angle)) * globeRadius, globeRadius, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Continents (simplified)
      ctx.strokeStyle = colors.teal;
      ctx.fillStyle = 'rgba(0, 217, 255, 0.1)';
      ctx.lineWidth = 2;
      
      // North America (simplified)
      ctx.beginPath();
      ctx.moveTo(centerX - 40, centerY - 30);
      ctx.lineTo(centerX - 20, centerY - 50);
      ctx.lineTo(centerX + 10, centerY - 40);
      ctx.lineTo(centerX + 20, centerY - 10);
      ctx.lineTo(centerX - 10, centerY + 20);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Current location marker (pulsing)
      const pulse = Math.sin(Date.now() / 500) * 3 + 8;
      ctx.fillStyle = colors.error;
      ctx.beginPath();
      ctx.arc(centerX - 10, centerY, pulse, 0, Math.PI * 2);
      ctx.fill();
      
      // Target markers
      targets.forEach((target, idx) => {
        if (target.latitude) {
          const x = centerX + (Math.random() - 0.5) * globeRadius * 1.5;
          const y = centerY + (Math.random() - 0.5) * globeRadius * 1.5;
          
          // Check if on visible hemisphere
          const dist = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
          if (dist < globeRadius) {
            ctx.fillStyle = colors.error;
            ctx.beginPath();
            ctx.moveTo(x, y - 6);
            ctx.lineTo(x - 4, y + 4);
            ctx.lineTo(x + 4, y + 4);
            ctx.closePath();
            ctx.fill();
          }
        }
      });

      rotationRef.current += 0.5;
      animationId = requestAnimationFrame(draw);
    };

    draw();
    return () => { if (animationId) cancelAnimationFrame(animationId); };
  }, [colors, targets]);

  return <canvas ref={canvasRef} width={280} height={280} style={{ width: '100%', display: 'block' }} />;
}
