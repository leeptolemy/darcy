import React, { useEffect, useRef } from 'react';

export function RadarDisplay({ colors, status, data, targets }) {
  const canvasRef = useRef(null);
  const angleRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 60;
    let animationId;

    const drawDrone = (x, y, droneSize, target, threatLevel) => {
      ctx.save();
      
      // Pulsing glow
      const pulse = Math.sin(Date.now() / 300) * 0.3 + 0.7;
      ctx.shadowBlur = 30 * pulse;
      ctx.shadowColor = colors.error;
      
      // Three concentric rings
      [25, 18, 12].forEach((ringSize, idx) => {
        ctx.strokeStyle = idx === 0 ? `${colors.error}40` : idx === 1 ? `${colors.error}80` : colors.error;
        ctx.lineWidth = idx === 0 ? 2 : idx === 1 ? 3 : 4;
        ctx.beginPath();
        ctx.arc(x, y, droneSize + ringSize, 0, Math.PI * 2);
        ctx.stroke();
      });
      
      // Filled center circle
      ctx.fillStyle = colors.error;
      ctx.beginPath();
      ctx.arc(x, y, droneSize, 0, Math.PI * 2);
      ctx.fill();
      
      // Drone triangle icon
      ctx.fillStyle = colors.text;
      ctx.beginPath();
      ctx.moveTo(x, y - droneSize * 0.6);
      ctx.lineTo(x - droneSize * 0.5, y + droneSize * 0.4);
      ctx.lineTo(x + droneSize * 0.5, y + droneSize * 0.4);
      ctx.closePath();
      ctx.fill();
      
      ctx.shadowBlur = 0;
      
      // Info box with arrow
      const boxX = x + 35;
      const boxY = y - 35;
      const boxWidth = 120;
      const boxHeight = 70;
      
      // Arrow line
      ctx.strokeStyle = colors.error;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + droneSize + 10, y);
      ctx.lineTo(boxX, boxY + boxHeight / 2);
      ctx.stroke();
      
      // Info box background
      ctx.fillStyle = 'rgba(255, 51, 102, 0.95)';
      ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
      ctx.strokeStyle = colors.error;
      ctx.lineWidth = 3;
      ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
      
      // Info box text
      ctx.fillStyle = colors.text;
      ctx.font = 'bold 11px monospace';
      ctx.fillText(target.id || 'TGT-???', boxX + 5, boxY + 15);
      ctx.font = '9px monospace';
      ctx.fillText(`RNG: ${target.range}`, boxX + 5, boxY + 28);
      ctx.fillText(`BRG: ${target.bearing}`, boxX + 5, boxY + 40);
      ctx.fillText(`ALT: ${target.altitude}`, boxX + 5, boxY + 52);
      ctx.fillText(`SIZE: ${droneSize}m`, boxX + 5, boxY + 64);
      
      // Threat level badge
      const threatColor = threatLevel === 'HIGH' ? colors.error : threatLevel === 'MEDIUM' ? colors.warning : colors.info;
      ctx.fillStyle = threatColor;
      ctx.fillRect(boxX + 68, boxY + 55, 45, 12);
      ctx.fillStyle = colors.primary;
      ctx.font = 'bold 9px monospace';
      ctx.fillText(threatLevel, boxX + 72, boxY + 64);
      
      ctx.restore();
    };

    const draw = () => {
      ctx.fillStyle = colors.surface;
      ctx.fillRect(0, 0, width, height);

      // Fine grid mesh (crosshatch pattern)
      ctx.strokeStyle = 'rgba(0, 217, 255, 0.03)';
      ctx.lineWidth = 0.5;
      for (let i = 0; i < width; i += 15) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, height);
        ctx.stroke();
      }
      for (let i = 0; i < height; i += 15) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(width, i);
        ctx.stroke();
      }

      // Major grid circles
      ctx.strokeStyle = colors.gridLine;
      ctx.lineWidth = 2;
      for (let i = 1; i <= 4; i++) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, (radius / 4) * i, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Radial lines every 30 degrees
      for (let i = 0; i < 12; i++) {
        const angle = (i * 30) * (Math.PI / 180);
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(centerX + radius * Math.cos(angle - Math.PI / 2), centerY + radius * Math.sin(angle - Math.PI / 2));
        ctx.stroke();
      }

      // Crosshairs (thicker)
      ctx.strokeStyle = colors.teal;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(centerX - radius, centerY);
      ctx.lineTo(centerX + radius, centerY);
      ctx.moveTo(centerX, centerY - radius);
      ctx.lineTo(centerX, centerY + radius);
      ctx.stroke();

      // Degree markers every 10 degrees
      ctx.fillStyle = colors.textMuted;
      ctx.font = '9px monospace';
      for (let deg = 0; deg < 360; deg += 30) {
        const angle = (deg - 90) * (Math.PI / 180);
        const x = centerX + (radius + 20) * Math.cos(angle);
        const y = centerY + (radius + 20) * Math.sin(angle);
        ctx.fillText(`${deg}°`, x - 10, y + 4);
      }

      // Range labels
      ctx.fillStyle = colors.teal;
      ctx.font = 'bold 12px monospace';
      ['10km', '20km', '30km', '40km'].forEach((label, i) => {
        ctx.fillText(label, centerX + 10, centerY - (radius / 4) * (i + 1) + 5);
      });

      // Compass directions
      ctx.font = 'bold 20px monospace';
      ctx.shadowBlur = 15;
      ctx.shadowColor = colors.teal;
      ctx.fillText('N', centerX - 10, centerY - radius - 15);
      ctx.fillText('E', centerX + radius + 20, centerY + 8);
      ctx.fillText('S', centerX - 10, centerY + radius + 25);
      ctx.fillText('W', centerX - radius - 30, centerY + 8);
      ctx.shadowBlur = 0;

      // Enhanced sweep beam with trail
      if (status?.is_running) {
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(angleRef.current);
        
        const gradient = ctx.createLinearGradient(0, 0, 0, -radius);
        gradient.addColorStop(0, 'transparent');
        gradient.addColorStop(0.2, 'rgba(0, 217, 255, 0.1)');
        gradient.addColorStop(0.6, 'rgba(0, 217, 255, 0.4)');
        gradient.addColorStop(0.9, 'rgba(0, 217, 255, 0.8)');
        gradient.addColorStop(1, colors.teal);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, radius, -Math.PI / 3, Math.PI / 10);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
        angleRef.current += 0.04;
      }

      // Draw drones
      targets.forEach((target, idx) => {
        const bearingMatch = target.bearing?.match(/([\d.]+)/);
        const rangeMatch = target.range?.match(/([\d.]+)/);
        const altMatch = target.altitude?.match(/([\d.]+)/);
        
        if (bearingMatch && rangeMatch) {
          const bearing = parseFloat(bearingMatch[1]);
          const range = parseFloat(rangeMatch[1]);
          const altitude = altMatch ? parseFloat(altMatch[1]) : 100;
          const maxRange = 50;
          
          const blipRadius = (range / maxRange) * radius;
          const blipAngle = (bearing - 90) * (Math.PI / 180);
          
          const blipX = centerX + blipRadius * Math.cos(blipAngle);
          const blipY = centerY + blipRadius * Math.sin(blipAngle);
          
          const droneSize = Math.max(12, Math.min(22, 25 - (altitude / 50)));
          const threatLevel = range < 5 ? 'HIGH' : range < 20 ? 'MEDIUM' : 'LOW';
          
          drawDrone(blipX, blipY, droneSize, target, threatLevel);
        }
      });\n\n      animationId = requestAnimationFrame(draw);\n    };\n\n    draw();\n    return () => { if (animationId) cancelAnimationFrame(animationId); };\n  }, [colors, status, targets]);\n\n  return (\n    <div className=\"relative w-full h-full\">\n      <canvas ref={canvasRef} width={800} height={800} style={{ width: '100%', height: '100%', display: 'block' }} />\n      {data && (\n        <div className=\"absolute top-4 left-4 text-xs space-y-1 px-4 py-3 rounded\" style={{ \n          backgroundColor: 'rgba(0, 0, 0, 0.85)', \n          border: `2px solid ${colors.teal}`,\n          boxShadow: `0 0 15px ${colors.glowTeal}`\n        }}>\n          <div style={{ color: colors.teal }} className=\"font-bold mb-2 border-b pb-1\" style={{ borderColor: colors.teal }}>CURRENT SCAN</div>\n          <div style={{ color: colors.text }}>RANGE:     {data.range}</div>\n          <div style={{ color: colors.text }}>BEARING:   {data.bearing}</div>\n          <div style={{ color: colors.text }}>TARGETS:   {data.detections}</div>\n          <div style={{ color: colors.text }}>ALTITUDE:  {data.altitude}</div>\n          <div style={{ color: colors.text }}>SIGNAL:    {data.signalStrength}%</div>\n          <div style={{ color: colors.text }}>CONF:      {data.confidence}</div>\n        </div>\n      )}\n      {targets.length > 0 && (\n        <div className=\"absolute top-4 right-4 text-sm px-4 py-3 rounded animate-pulse\" style={{ \n          backgroundColor: 'rgba(255, 51, 102, 0.3)', \n          border: `3px solid ${colors.error}`,\n          boxShadow: `0 0 20px ${colors.error}`\n        }}>\n          <div style={{ color: colors.error }} className=\"font-bold text-center\">\n            ⚠ THREAT ALERT ⚠\n          </div>\n          <div style={{ color: colors.text }} className=\"text-xs mt-1\">\n            {targets.length} ACTIVE TARGET{targets.length > 1 ? 'S' : ''}\n          </div>\n        </div>\n      )}\n    </div>\n  );\n}\n