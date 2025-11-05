import React, { useRef, useEffect } from 'react';
import { MapPin, Navigation } from 'lucide-react';

export function Waveform({ colors, status }) {
  const ref = useRef(null);
  const data = useRef(Array(80).fill(0.5));

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    const w = cv.width;
    const h = cv.height;
    
    const draw = () => {
      ctx.fillStyle = colors.surface;
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = colors.gridLine;
      ctx.lineWidth = 0.3;
      for (let i = 0; i <= 3; i++) {
        ctx.beginPath();
        ctx.moveTo(0, (h / 3) * i);
        ctx.lineTo(w, (h / 3) * i);
        ctx.stroke();
      }
      if (status?.is_running) {
        data.current.shift();
        data.current.push(Math.random());
      }
      ctx.strokeStyle = colors.teal;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      data.current.forEach((p, i) => {
        const x = (i / data.current.length) * w;
        const y = h / 2 + (p - 0.5) * h * 0.7;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      requestAnimationFrame(draw);
    };
    draw();
  }, [colors, status]);

  return <canvas ref={ref} width={260} height={80} style={{ width: '100%', display: 'block' }} />;
}

export function FreqSpec({ colors, status }) {
  const ref = useRef(null);
  const data = useRef(Array(30).fill(0).map(() => Math.random()));

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    const w = cv.width;
    const h = cv.height;
    const bars = 30;
    
    const draw = () => {
      ctx.fillStyle = colors.surface;
      ctx.fillRect(0, 0, w, h);
      const bw = w / bars;
      if (status?.is_running) {
        data.current = data.current.map(v => v * 0.95 + Math.random() * 0.05);
      }
      data.current.forEach((v, i) => {
        const bh = v * h * 0.8;
        const color = v > 0.7 ? colors.error : v > 0.5 ? colors.warning : v > 0.3 ? colors.teal : colors.teal + '80';
        ctx.fillStyle = color;
        ctx.fillRect(i * bw + 0.5, h - bh, bw - 1, bh);
      });
      requestAnimationFrame(draw);
    };
    draw();
  }, [colors, status]);

  return <canvas ref={ref} width={260} height={70} style={{ width: '100%', display: 'block' }} />;
}

export function GeoMap({ colors, targets }) {
  const ref = useRef(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    const w = cv.width;
    const h = cv.height;
    const cx = w / 2;
    const cy = h / 2;
    const sc = 100;
    
    const draw = () => {
      ctx.fillStyle = colors.surface;
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = colors.gridLine;
      ctx.lineWidth = 0.3;
      for (let i = 0; i <= 3; i++) {
        ctx.beginPath();
        ctx.moveTo((w / 3) * i, 0);
        ctx.lineTo((w / 3) * i, h);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, (h / 3) * i);
        ctx.lineTo(w, (h / 3) * i);
        ctx.stroke();
      }
      
      ctx.fillStyle = colors.success;
      ctx.beginPath();
      ctx.arc(cx, cy, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = colors.success;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, 10, 0, Math.PI * 2);
      ctx.stroke();
      
      targets.forEach((t, idx) => {
        if (t.latitude && t.longitude) {
          const lat = parseFloat(t.latitude);
          const lon = parseFloat(t.longitude);
          const x = cx + (lon - (-118.2437)) * sc;
          const y = cy - (lat - 34.0522) * sc;
          const p = Math.sin(Date.now() / 200 + idx) * 3 + 8;
          
          ctx.fillStyle = colors.error;
          ctx.beginPath();
          ctx.moveTo(x, y - 6);
          ctx.lineTo(x - 4, y + 4);
          ctx.lineTo(x + 4, y + 4);
          ctx.closePath();
          ctx.fill();
          
          ctx.strokeStyle = colors.error;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(x, y, p, 0, Math.PI * 2);
          ctx.stroke();
        }
      });
      requestAnimationFrame(draw);
    };
    draw();
  }, [colors, targets]);

  return <canvas ref={ref} width={260} height={100} style={{ width: '100%', display: 'block' }} />;
}

export function ThreatMatrix({ colors, targets }) {
  const ref = useRef(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    const w = cv.width;
    const h = cv.height;
    const cols = 6;
    const rows = 4;
    const cw = w / cols;
    const ch = h / rows;
    
    const draw = () => {
      ctx.fillStyle = colors.surface;
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = colors.border;
      ctx.lineWidth = 0.5;
      for (let i = 0; i <= cols; i++) {
        ctx.beginPath();
        ctx.moveTo(i * cw, 0);
        ctx.lineTo(i * cw, h);
        ctx.stroke();
      }
      for (let i = 0; i <= rows; i++) {
        ctx.beginPath();
        ctx.moveTo(0, i * ch);
        ctx.lineTo(w, i * ch);
        ctx.stroke();
      }
      
      targets.forEach(t => {
        const rm = t.range?.match(/([\d.]+)/);
        const am = t.altitude?.match(/([\d.]+)/);
        if (rm && am) {
          const rng = parseFloat(rm[1]);
          const alt = parseFloat(am[1]);
          const col = Math.min(cols - 1, Math.floor((rng / 50) * cols));
          const row = rows - 1 - Math.min(rows - 1, Math.floor((alt / 800) * rows));
          ctx.fillStyle = rng < 5 ? colors.error : rng < 20 ? colors.warning : colors.teal + '60';
          ctx.fillRect(col * cw + 1, row * ch + 1, cw - 2, ch - 2);
        }
      });
    };
    draw();
  }, [colors, targets]);

  return <canvas ref={ref} width={260} height={80} style={{ width: '100%', display: 'block' }} />;
}

export function LocationWidget({ colors, data }) {
  return (
    <div style={{ fontSize: 9 }}>
      <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginBottom: 4 }}>
        <MapPin size={10} style={{ color: colors.teal }} />
        <div>
          <div style={{ fontSize: 7, color: colors.textMuted }}>LAT</div>
          <div style={{ fontWeight: 'bold' }}>
            {data?.latitude ? data.latitude.toFixed(4) + '°N' : '34.0522°N'}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginBottom: 4 }}>
        <MapPin size={10} style={{ color: colors.teal }} />
        <div>
          <div style={{ fontSize: 7, color: colors.textMuted }}>LON</div>
          <div style={{ fontWeight: 'bold' }}>
            {data?.longitude ? Math.abs(data.longitude).toFixed(4) + '°W' : '118.24°W'}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <Navigation size={10} style={{ color: colors.success }} />
        <div>
          <div style={{ fontSize: 7, color: colors.textMuted }}>HDG</div>
          <div style={{ fontWeight: 'bold' }}>{data?.bearing || '000°'}</div>
        </div>
      </div>
    </div>
  );
}

export function AltitudeChart({ colors, targets }) {
  const layers = ['>600m', '400-600', '200-400', '0-200'];
  const counts = layers.map((_, i) => {
    return targets.filter(t => {
      const am = t.altitude?.match(/([\d.]+)/);
      if (!am) return false;
      const a = parseFloat(am[1]);
      if (i === 0) return a > 600;
      if (i === 1) return a >= 400 && a <= 600;
      if (i === 2) return a >= 200 && a < 400;
      return a < 200;
    }).length;
  });
  
  return (
    <div style={{ fontSize: 7 }}>
      {layers.map((l, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
          <span style={{ color: colors.textMuted }}>{l}</span>
          <div style={{ display: 'flex', gap: 1 }}>
            {[...Array(Math.max(0, counts[i]))].map((_, j) => (
              <div key={j} style={{ width: 6, height: 8, background: colors.teal }} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function SpeedHistogram({ colors, targets }) {
  const ranges = ['0-50', '50-100', '100-150', '150+'];
  const counts = ranges.map((_, i) => {
    return targets.filter(t => {
      const sm = t.speed?.match(/([\d.]+)/);
      if (!sm) return false;
      const s = parseFloat(sm[1]);
      if (i === 0) return s < 50;
      if (i === 1) return s >= 50 && s < 100;
      if (i === 2) return s >= 100 && s < 150;
      return s >= 150;
    }).length;
  });
  
  return (
    <div style={{ fontSize: 7 }}>
      {ranges.map((r, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
          <span style={{ color: colors.textMuted }}>{r}kts</span>
          <div style={{ display: 'flex', gap: 1 }}>
            {[...Array(Math.max(0, counts[i]))].map((_, j) => (
              <div key={j} style={{ width: 6, height: 6, background: colors.warning }} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
