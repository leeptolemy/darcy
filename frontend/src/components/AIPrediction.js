import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Brain, Clock } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
const API = `${BACKEND_URL}/api`;

export function AIPredictionWidget({ colors }) {
  const [predictions, setPredictions] = useState([]);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [timeline, setTimeline] = useState(30);

  useEffect(() => {
    fetchPredictions();
    const interval = setInterval(() => fetchPredictions(), 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchPredictions = async () => {
    try {
      const [predRes, histRes, statsRes] = await Promise.all([
        axios.get(`${API}/predictions/active`),
        axios.get(`${API}/predictions/history?limit=5`),
        axios.get(`${API}/predictions/stats`)
      ]);
      setPredictions(predRes.data.predictions || []);
      setHistory(histRes.data.history || []);
      setStats(statsRes.data);
    } catch (e) {
      console.error('Prediction error:', e);
    }
  };

  const updateTimeline = async (newTimeline) => {
    try {
      await axios.post(`${API}/predictions/set-timeline?seconds=${newTimeline}`);
      setTimeline(newTimeline);
    } catch (e) {}
  };

  return (
    <div style={{ fontSize: 8 }}>
      <div style={{ marginBottom: 6, padding: 4, background: colors.teal + '20', border: '1px solid ' + colors.teal, borderRadius: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <Brain size={12} style={{ color: colors.teal }} />
          <span style={{ fontWeight: 'bold', color: colors.teal }}>AI PREDICT</span>
        </div>
        <span style={{ fontSize: 10, fontWeight: 'bold', color: colors.teal }}>{stats?.accuracy ? stats.accuracy.toFixed(0) : 0}%</span>
      </div>
      <div style={{ marginBottom: 6, padding: 4, background: colors.primary, borderRadius: 2 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2, fontSize: 7, color: colors.textMuted }}><span>TIMELINE</span><span>{timeline}s</span></div>
        <input type="range" min="5" max="120" step="5" value={timeline} onChange={(e) => updateTimeline(parseInt(e.target.value))} style={{ width: '100%', height: 4 }} />
        {stats?.recommended_timeline && stats.recommended_timeline !== timeline && <div style={{ fontSize: 6, color: colors.warning, marginTop: 2 }}>Rec: {stats.recommended_timeline}s</div>}
      </div>
      <div style={{ marginBottom: 6 }}>
        <div style={{ fontSize: 7, fontWeight: 'bold', color: colors.textMuted, marginBottom: 2 }}>ACTIVE:</div>
        {predictions.length === 0 ? <div style={{ color: colors.textMuted, fontSize: 7 }}>No predictions</div> : predictions.map((p, i) => <div key={i} style={{ marginBottom: 3, padding: 3, background: colors.teal + '10', border: '1px solid ' + colors.teal, borderRadius: 2 }}><div style={{ fontWeight: 'bold', color: colors.teal, fontSize: 7 }}>[{p.id}]</div><div style={{ color: colors.text, fontSize: 7, marginBottom: 2 }}>{p.message}</div><div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 6, color: colors.textMuted }}><span>CONF: {p.confidence}%</span><span><Clock size={6} style={{ display: 'inline', marginRight: 2 }} />{p.seconds_remaining}s</span></div></div>)}
      </div>
      <div>
        <div style={{ fontSize: 7, fontWeight: 'bold', color: colors.textMuted, marginBottom: 2 }}>HISTORY:</div>
        {history.length === 0 ? <div style={{ color: colors.textMuted, fontSize: 7 }}>No history</div> : <div style={{ maxHeight: 80, overflowY: 'auto' }}>{history.map((h, i) => <div key={i} style={{ marginBottom: 2, padding: 2, background: colors.primary, border: '1px solid ' + colors.border, borderRadius: 2, fontSize: 7 }}><div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontWeight: 'bold', color: h.result ? colors.success : colors.error }}>[{h.id} {h.result ? 'TRUE' : 'FALSE'}]</span><span style={{ fontSize: 6, color: colors.textMuted }}>{h.confidence}%</span></div><div style={{ color: colors.textMuted, fontSize: 6 }}>{h.message}</div></div>)}</div>}
      </div>
      {stats && <div style={{ marginTop: 6, padding: 4, background: colors.primary, borderRadius: 2, fontSize: 6, color: colors.textMuted }}><div>Total: {stats.total_predictions} | ✓ {stats.correct_predictions} | ✗ {stats.false_predictions}</div></div>}
    </div>
  );
}
