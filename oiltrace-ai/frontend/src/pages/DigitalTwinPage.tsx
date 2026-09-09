import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { fetchSpill, fetchAllTracks, fetchAttribution } from '../services/api';
import { useHindcast, useForecast } from '../hooks/useSpill';
import InvestigationMap from '../map/InvestigationMap';
import LayerControl from '../components/LayerControl';
import { useStore } from '../state/store';
import { LoadingState } from '../components/StateComponents';

export default function DigitalTwinPage() {
  const { id } = useParams<{id:string}>();
  const [spill, setSpill] = useState<any>(null);
  const [tracks, setTracks] = useState<any[]>([]);
  const [vessels, setVessels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { hindcast } = useHindcast(id||null);
  const { forecast } = useForecast(id||null);
  const { timelinePosition, setTimelinePosition, timelinePlaying, setTimelinePlaying, timelineSpeed } = useStore();
  const animRef = useRef<number|null>(null);
  const prevTimeRef = useRef<number|null>(null);

  useEffect(() => {
    if (!id) return;
    Promise.all([fetchSpill(id), fetchAllTracks(id)])
      .then(([sp, tr]) => { setSpill(sp); setTracks(tr); })
      .catch(console.error)
      .finally(() => setLoading(false));
    fetchAttribution(id).then(a => setVessels(a.vessels || [])).catch(() => {});
  }, [id]);

  const animate = useCallback((ts: number) => {
    if (prevTimeRef.current !== null) {
      const dt = (ts - prevTimeRef.current) / 1000;
      setTimelinePosition(p => {
        const next = p + dt * timelineSpeed * 0.005;
        if (next >= 1) { setTimelinePlaying(false); return 1; }
        return next;
      });
    }
    prevTimeRef.current = ts;
    animRef.current = requestAnimationFrame(animate);
  }, [timelineSpeed, setTimelinePosition, setTimelinePlaying]);

  useEffect(() => {
    if (timelinePlaying) {
      prevTimeRef.current = null;
      animRef.current = requestAnimationFrame(animate);
    } else {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    }
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [timelinePlaying, animate]);

  if (loading) return <LoadingState message="Loading digital twin..." />;

  const hindcastHours = hindcast?.hindcast_hours || hindcast?.integration_hours || 18;
  const forecastHours = forecast?.forecast_hours || forecast?.integration_hours || 48;
  const totalHours = Math.max(1, hindcastHours + forecastHours);

  let formattedTime = '2024-03-15T06:00 UTC';
  try {
    const rawT0 = spill?.satellite_acquisition_time;
    const t0 = rawT0 ? new Date(rawT0).getTime() : Date.now();
    const safeT0 = isNaN(t0) ? Date.now() : t0;
    const safePos = typeof timelinePosition === 'number' && !isNaN(timelinePosition) ? timelinePosition : 0;
    const currentOffsetH = (safePos - (hindcastHours / totalHours)) * totalHours;
    const currentTime = new Date(safeT0 + currentOffsetH * 3600 * 1000);
    if (!isNaN(currentTime.getTime())) {
      formattedTime = `${currentTime.toISOString().slice(0, 16)} UTC`;
    }
  } catch (e) {
    // Keep fallback
  }

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%',overflow:'hidden'}}>
      <div style={{padding:'10px 16px',borderBottom:'1px solid var(--border)',display:'flex',justifyContent:'space-between',alignItems:'center',background:'var(--surface-1)',flexShrink:0}}>
        <div>
          <div style={{fontSize:'15px',fontWeight:600}}>{id} — Digital Twin Replay</div>
          <div style={{fontSize:'11px',color:'var(--text-muted)',fontFamily:'var(--font-mono)'}}>Hindcast + Forecast ensemble visualization • All data synthetic</div>
        </div>
        <div style={{fontFamily:'var(--font-mono)',fontSize:'13px',color:'var(--text-secondary)'}}>
          T: {formattedTime}
        </div>
      </div>
      <div style={{flex:1,overflow:'hidden',position:'relative'}}>
        <InvestigationMap spill={spill} hindcast={hindcast} forecast={forecast} tracks={tracks} attributions={vessels} timelineStep={timelinePosition}>
          <LayerControl />
        </InvestigationMap>
      </div>
      {/* Timeline bar */}
      <div className="timeline-bar" style={{flexShrink:0}}>
        <div className="timeline-controls">
          <button className="btn btn-secondary btn-sm" onClick={()=>setTimelinePosition(0)}>|&lt;</button>
          <button className="btn btn-secondary btn-sm" onClick={()=>setTimelinePosition(p=>Math.max(0,p-0.05))}>&lt;</button>
          <button className="btn btn-primary btn-sm" onClick={()=>setTimelinePlaying(!timelinePlaying)} style={{minWidth:64}}>
            {timelinePlaying ? '⏸ Pause' : '▶ Play'}
          </button>
          <button className="btn btn-secondary btn-sm" onClick={()=>setTimelinePosition(p=>Math.min(1,p+0.05))}>&gt;</button>
          <button className="btn btn-secondary btn-sm" onClick={()=>setTimelinePosition(1)}>&gt;|</button>
          <input type="range" min="0" max="1" step="0.001" value={timelinePosition} onChange={e=>setTimelinePosition(parseFloat(e.target.value))} className="timeline-scrubber" />
          <span className="timeline-current-time">{formattedTime}</span>
          <span style={{fontSize:'11px',color:'var(--text-muted)',fontFamily:'var(--font-mono)',whiteSpace:'nowrap'}}>Speed: 1x</span>
        </div>
        <div className="timeline-markers">
          <span>T-{hindcastHours}h (Hindcast start)</span>
          <span>T-0 (SAR Acquisition)</span>
          <span>T+{forecastHours}h (Forecast end)</span>
        </div>
        <div style={{fontSize:'10px',color:'var(--text-disabled)',fontFamily:'var(--font-mono)'}}>
          DIGITAL TWIN — Synthetic simulation, seed=26143. Not operational. For demonstration only.
        </div>
      </div>
    </div>
  );
}
