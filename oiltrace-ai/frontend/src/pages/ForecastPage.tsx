import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { fetchSpill, runForecast } from '../services/api';
import { useForecast } from '../hooks/useSpill';
import InvestigationMap from '../map/InvestigationMap';
import LayerControl from '../components/LayerControl';
import ProvenanceBadge from '../components/ProvenanceBadge';
import { LoadingState, UnavailableState } from '../components/StateComponents';

export default function ForecastPage() {
  const { id } = useParams<{id:string}>();
  const [spill, setSpill] = useState<any>(null);
  const [running, setRunning] = useState(false);
  const { forecast, loading, refetch } = useForecast(id||null);

  useEffect(() => { if (!id) return; fetchSpill(id).then(setSpill).catch(console.error); }, [id]);

  const handleRun = async () => {
    if (!id) return; setRunning(true);
    try { await runForecast(id); refetch(); } finally { setRunning(false); }
  };

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%',overflow:'hidden'}}>
      <div style={{padding:'10px 16px',borderBottom:'1px solid var(--border)',display:'flex',justifyContent:'space-between',alignItems:'center',background:'var(--surface-1)',flexShrink:0}}>
        <div>
          <div style={{fontSize:'15px',fontWeight:600}}>{id} — Drift Forecast</div>
          <div style={{fontSize:'11px',color:'var(--text-muted)',fontFamily:'var(--font-mono)'}}>Forward particle integration • RK4 • +48h ensemble</div>
        </div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          {!forecast && !loading && (
            <button className="btn btn-primary" onClick={handleRun} disabled={running}>
              {running ? 'Running...' : 'Run Forecast'}
            </button>
          )}
          <ProvenanceBadge provenance="predicted" />
        </div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 300px',flex:1,overflow:'hidden'}}>
        {loading ? <LoadingState message="Loading forecast..." /> : (
          <InvestigationMap spill={spill} forecast={forecast}>
            <LayerControl />
          </InvestigationMap>
        )}
        <div style={{borderLeft:'1px solid var(--border)',background:'var(--bg-secondary)',overflow:'auto'}}>
          <div style={{padding:'10px 12px',borderBottom:'1px solid var(--border)',fontSize:'11px',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.06em',color:'var(--text-muted)'}}>Forecast Horizons</div>
          {forecast ? (
            <div style={{padding:12}}>
              <div className="alert alert-warning" style={{marginBottom:12}}>
                <span>⚠</span>
                <div style={{fontSize:'12px'}}>Forecast is based on synthetic environmental data. Accuracy degrades beyond 24h. Not for operational use.</div>
              </div>
              {Object.entries(forecast.horizon_stats||{}).map(([h,st]: [string,any]) => (
                <div key={h} style={{background:'var(--surface-1)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:'10px',marginBottom:8}}>
                  <div style={{fontSize:'14px',fontFamily:'var(--font-mono)',fontWeight:600,color:'var(--predicted)',marginBottom:6}}>{h}</div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:4,fontSize:'12px'}}>
                    <span style={{color:'var(--text-muted)'}}>Centroid</span>
                    <span style={{fontFamily:'var(--font-mono)'}}>{st.centroid_lat?.toFixed(4)}, {st.centroid_lon?.toFixed(4)}</span>
                    <span style={{color:'var(--text-muted)'}}>Spread</span>
                    <span style={{fontFamily:'var(--font-mono)'}}>{st.spread_km?.toFixed(2)} km</span>
                    <span style={{color:'var(--text-muted)'}}>Particles</span>
                    <span style={{fontFamily:'var(--font-mono)'}}>{st.particle_count}</span>
                  </div>
                </div>
              ))}
              <div style={{fontSize:'11px',color:'var(--text-muted)',marginTop:8}}>
                Particles: {forecast.particle_count} | Method: {forecast.integration_method} | Δt: {forecast.timestep_min} min
              </div>
            </div>
          ) : (
            <div style={{padding:16}}>
              <UnavailableState title="No Forecast" message="Click 'Run Forecast' to project the spill forward 48h." />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
