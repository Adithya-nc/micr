import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchSpill, fetchEnvironment, runHindcast } from '../services/api';
import { useHindcast, useEnvironment } from '../hooks/useSpill';
import InvestigationMap from '../map/InvestigationMap';
import LayerControl from '../components/LayerControl';
import ProvenanceBadge from '../components/ProvenanceBadge';
import { LoadingState, ErrorState, UnavailableState } from '../components/StateComponents';

export default function DriftPage() {
  const { id } = useParams<{id:string}>();
  const [spill, setSpill] = useState<any>(null);
  const [running, setRunning] = useState(false);
  const [envFields, setEnvFields] = useState<any[]>([]);
  const { hindcast, loading: hLoading, error: hError, notFound, refetch } = useHindcast(id||null);

  useEffect(() => {
    if (!id) return;
    fetchSpill(id).then(setSpill).catch(console.error);
    fetchEnvironment(id).then(setEnvFields).catch(console.error);
  }, [id]);

  const handleRunHindcast = async () => {
    if (!id) return;
    setRunning(true);
    try { await runHindcast(id); refetch(); } catch(e) { console.error(e); }
    finally { setRunning(false); }
  };

  const currentField = envFields.find(f=>f.field_type==='current');
  const windField = envFields.find(f=>f.field_type==='wind');
  const currentPt = currentField?.field_data?.points?.[12];
  const windPt = windField?.field_data?.points?.[12];
  const currentSpeed = currentPt ? Math.sqrt(currentPt.current_u**2 + currentPt.current_v**2) : null;
  const windSpeed = windPt ? Math.sqrt(windPt.wind_u**2 + windPt.wind_v**2) : null;

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%',overflow:'hidden'}}>
      <div style={{padding:'10px 16px',borderBottom:'1px solid var(--border)',display:'flex',justifyContent:'space-between',alignItems:'center',background:'var(--surface-1)',flexShrink:0}}>
        <div>
          <div style={{fontSize:'15px',fontWeight:600}}>{id} — Drift Reconstruction / Hindcast</div>
          <div style={{fontSize:'11px',color:'var(--text-muted)',fontFamily:'var(--font-mono)'}}>Backward particle integration &bull; RK4 &bull; Multi-particle ensemble</div>
        </div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          {!hindcast && !hLoading && (
            <button className="btn btn-primary" onClick={handleRunHindcast} disabled={running}>
              {running ? 'Running...' : 'Run Hindcast'}
            </button>
          )}
          <ProvenanceBadge provenance="reconstructed" />
        </div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'260px 1fr 300px',flex:1,overflow:'hidden'}}>
        {/* Left: Environment panel */}
        <div style={{borderRight:'1px solid var(--border)',background:'var(--bg-secondary)',overflow:'auto'}}>
          <div style={{padding:'10px 12px',borderBottom:'1px solid var(--border)',fontSize:'11px',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.06em',color:'var(--text-muted)'}}>
            Environmental Data
          </div>
          <div style={{padding:12}}>
            <div style={{marginBottom:12}}>
              <div style={{fontSize:'11px',color:'var(--text-muted)',marginBottom:6,textTransform:'uppercase',letterSpacing:'0.06em'}}>Ocean Current</div>
              {currentField ? (
                <div>
                  <div style={{display:'flex',justifyContent:'space-between',padding:'3px 0',borderBottom:'1px solid var(--border)'}}>
                    <span style={{fontSize:'12px',color:'var(--text-muted)'}}>Speed (center)</span>
                    <span style={{fontFamily:'var(--font-mono)',fontSize:'12px'}}>{currentSpeed?.toFixed(3)} m/s</span>
                  </div>
                  <div style={{display:'flex',justifyContent:'space-between',padding:'3px 0',borderBottom:'1px solid var(--border)'}}>
                    <span style={{fontSize:'12px',color:'var(--text-muted)'}}>U component</span>
                    <span style={{fontFamily:'var(--font-mono)',fontSize:'12px'}}>{currentPt?.current_u?.toFixed(4)} m/s E</span>
                  </div>
                  <div style={{display:'flex',justifyContent:'space-between',padding:'3px 0',borderBottom:'1px solid var(--border)'}}>
                    <span style={{fontSize:'12px',color:'var(--text-muted)'}}>V component</span>
                    <span style={{fontFamily:'var(--font-mono)',fontSize:'12px'}}>{currentPt?.current_v?.toFixed(4)} m/s N</span>
                  </div>
                  <div style={{display:'flex',justifyContent:'space-between',padding:'3px 0',borderBottom:'1px solid var(--border)'}}>
                    <span style={{fontSize:'12px',color:'var(--text-muted)'}}>Source</span>
                    <span style={{fontFamily:'var(--font-mono)',fontSize:'11px',color:'var(--synthetic)'}}>{currentField.source}</span>
                  </div>
                </div>
              ) : <div style={{fontSize:'12px',color:'var(--text-muted)'}}>Unavailable</div>}
            </div>
            <div style={{marginBottom:12}}>
              <div style={{fontSize:'11px',color:'var(--text-muted)',marginBottom:6,textTransform:'uppercase',letterSpacing:'0.06em'}}>Wind (ERA5)</div>
              {windField ? (
                <div>
                  <div style={{display:'flex',justifyContent:'space-between',padding:'3px 0',borderBottom:'1px solid var(--border)'}}>
                    <span style={{fontSize:'12px',color:'var(--text-muted)'}}>Speed (center)</span>
                    <span style={{fontFamily:'var(--font-mono)',fontSize:'12px'}}>{windSpeed?.toFixed(2)} m/s</span>
                  </div>
                  <div style={{display:'flex',justifyContent:'space-between',padding:'3px 0',borderBottom:'1px solid var(--border)'}}>
                    <span style={{fontSize:'12px',color:'var(--text-muted)'}}>U10</span>
                    <span style={{fontFamily:'var(--font-mono)',fontSize:'12px'}}>{windPt?.wind_u?.toFixed(3)} m/s E</span>
                  </div>
                  <div style={{display:'flex',justifyContent:'space-between',padding:'3px 0',borderBottom:'1px solid var(--border)'}}>
                    <span style={{fontSize:'12px',color:'var(--text-muted)'}}>V10</span>
                    <span style={{fontFamily:'var(--font-mono)',fontSize:'12px'}}>{windPt?.wind_v?.toFixed(3)} m/s N</span>
                  </div>
                  <div style={{display:'flex',justifyContent:'space-between',padding:'3px 0'}}>
                    <span style={{fontSize:'12px',color:'var(--text-muted)'}}>Source</span>
                    <span style={{fontFamily:'var(--font-mono)',fontSize:'11px',color:'var(--synthetic)'}}>{windField.source}</span>
                  </div>
                </div>
              ) : <div style={{fontSize:'12px',color:'var(--text-muted)'}}>Unavailable</div>}
            </div>
            {envFields.length>0 && (
              <div className="alert alert-warning">
                <span>⚠</span>
                <div style={{fontSize:'11px'}}>{currentField?.field_data?.note || 'Environmental data is synthetic. Not real ocean/wind data.'}</div>
              </div>
            )}
          </div>
        </div>
        {/* Center: Map */}
        {hLoading ? <LoadingState message="Loading hindcast..." /> : (
          <InvestigationMap spill={spill} hindcast={hindcast}>
            <LayerControl />
            {!hindcast && !hLoading && (
              <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',background:'var(--surface-1)',border:'1px solid var(--border)',borderRadius:'var(--radius-md)',padding:'20px 24px',textAlign:'center'}}>
                <div style={{fontSize:'13px',color:'var(--text-secondary)',marginBottom:12}}>No hindcast computed yet</div>
                <button className="btn btn-primary" onClick={handleRunHindcast} disabled={running}>{running?'Running...':'Run Hindcast'}</button>
              </div>
            )}
          </InvestigationMap>
        )}
        {/* Right: Hindcast results */}
        <div style={{borderLeft:'1px solid var(--border)',background:'var(--bg-secondary)',overflow:'auto'}}>
          <div style={{padding:'10px 12px',borderBottom:'1px solid var(--border)',fontSize:'11px',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.06em',color:'var(--text-muted)'}}>
            Origin Estimate
          </div>
          {hindcast ? (
            <div style={{padding:12}}>
              <div className="alert alert-info" style={{marginBottom:12}}>
                <div style={{fontSize:'12px'}}>Estimated Origin Region— not an exact point. Spatial and temporal uncertainty shown below.</div>
              </div>
              {[
                ['Origin Lat', hindcast.origin_lat?.toFixed(6)+'°N'],
                ['Origin Lon', hindcast.origin_lon?.toFixed(6)+'°E'],
                ['Estimated Release Window', hindcast.origin_time_estimate?.slice(0,19)+' UTC'],
                ['Temporal Uncertainty', '±'+hindcast.origin_time_uncertainty_h+' h'],
                ['Spatial Uncertainty', hindcast.spatial_uncertainty_km?.toFixed(2)+' km'],
                ['Particle Count', hindcast.particle_count],
                ['Integration Method', hindcast.integration_method],
                ['Windage Coefficient', hindcast.windage_coefficient+' (\u03b1)'],
                ['Timestep', hindcast.timestep_min+' min'],
                ['Hindcast Duration', (hindcast.hindcast_hours || hindcast.integration_hours)+' h'],
                ['Provenance', 'RECONSTRUCTED / SYNTHETIC'],
              ].map(([k,v]) => (
                <div key={k} style={{display:'flex',justifyContent:'space-between',padding:'4px 0',borderBottom:'1px solid var(--border)'}}>
                  <span style={{fontSize:'12px',color:'var(--text-muted)'}}>{k}</span>
                  <span style={{fontSize:'12px',fontFamily:'var(--font-mono)',color: String(v).includes('RECONSTRUCTED')?'var(--reconstructed)':'var(--text-primary)'}}>{v}</span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{padding:16}}>
              <UnavailableState title="No Hindcast" message="Click 'Run Hindcast' to compute the backward particle integration and estimate the probable origin region." />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
