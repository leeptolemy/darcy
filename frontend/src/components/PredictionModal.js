import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Share2, AlertTriangle, TrendingUp } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
const API = `${BACKEND_URL}/api`;

export function PredictionModal({ prediction, onClose, onShareToLocrypt, colors }) {
  if (!prediction) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }} onClick={onClose}>
      <div style={{ background: colors.surface, border: '3px solid #FFD700', borderRadius: 8, padding: 24, maxWidth: 700, width: '90%', boxShadow: '0 0 60px #FFD700' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 12, borderBottom: '2px solid ' + colors.border }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 'bold', color: '#FFD700', margin: 0, letterSpacing: '0.1em' }}>🤖 AI PREDICTION</h2>
            <p style={{ fontSize: 10, color: colors.textMuted, margin: 0 }}>{prediction.id}</p>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', fontSize: 24, color: colors.textMuted, cursor: 'pointer' }}>×</button>
        </div>

        <div style={{ marginBottom: 16, padding: 12, background: '#FFD700' + '20', border: '2px solid #FFD700', borderRadius: 4 }}>
          <div style={{ fontSize: 14, fontWeight: 'bold', color: '#FFD700', marginBottom: 8 }}>{prediction.message}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, fontSize: 11 }}>
            <div><span style={{ color: colors.textMuted }}>Confidence:</span> <span style={{ color: colors.text, fontWeight: 'bold' }}>{prediction.confidence}%</span></div>
            <div><span style={{ color: colors.textMuted }}>Time Remaining:</span> <span style={{ color: '#FFD700', fontWeight: 'bold' }}>{prediction.seconds_remaining}s</span></div>
            <div><span style={{ color: colors.textMuted }}>Expected Bearing:</span> <span style={{ color: colors.text }}>{prediction.bearing}</span></div>
            <div><span style={{ color: colors.textMuted }}>Expected Range:</span> <span style={{ color: colors.text }}>{prediction.predicted_range_km}km</span></div>
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 'bold', color: colors.teal, marginBottom: 8, paddingBottom: 6, borderBottom: '1px solid ' + colors.border }}>PREDICTED LOCATION</div>
          <div style={{ fontSize: 10, color: colors.textMuted, lineHeight: 1.6 }}>
            <div>Latitude: {prediction.predicted_lat?.toFixed(4)}°N</div>
            <div>Longitude: {Math.abs(prediction.predicted_lon)?.toFixed(4)}°E</div>
            <div>Sector: {prediction.sector}</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
          <button onClick={() => onShareToLocrypt(prediction)} style={{ padding: '12px', borderRadius: 4, fontSize: 11, fontWeight: 'bold', background: colors.teal, color: colors.primary, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <Share2 size={14} />
            <span>SHARE TO LOCRYPT</span>
          </button>
          <button onClick={onClose} style={{ padding: '12px', borderRadius: 4, fontSize: 11, fontWeight: 'bold', background: 'transparent', color: '#FFD700', border: '2px solid #FFD700', cursor: 'pointer' }}>CLOSE</button>
        </div>
      </div>
    </div>
  );
}
