import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchDashboardStats } from '../services/api';
import { useStore } from '../state/store';
import KpiStrip from '../components/KpiStrip';
import InvestigationMap from '../map/InvestigationMap';
import LayerControl from '../components/LayerControl';
import { LoadingState, ErrorState } from '../components/StateComponents';
import ProvenanceBadge from '../components/ProvenanceBadge';

export default function CommandCenter() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string|null>(null);
  const { setSelectedSpillId } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardStats().then(setStats).catch(e=>setError(e.message)).finally(()=>setLoading(false));
  }, []);

  if (loading) return <LoadingState message="Loading command center..." />;
  if (error) return <ErrorState message={error} onRetry={()=>{ setLoading(true); setError(null); fetchDashboardStats().then(setStats).catch(e=>setError(e.message)).finally(()=>setLoading(false));}} />;

  const incidents = stats?.incidents || [];

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%',overflow:'hidden'}}>
      <KpiStrip activeIncidents={stats?.active_incidents||0} analyzedScenes={stats?.analyzed_scenes||0}
        analyzedVessels={stats?.analyzed_vessels||0} highPriority={stats?.high_priority_cases||0} />
      <div style={{display:'grid',gridTemplateColumns:'260px 1fr 320px',flex:1,overflow:'hidden'}}>
        {/* Left: Incident list */}
        <div style={{borderRight:'1px solid var(--border)',background:'var(--bg-secondary)',overflow:'auto'}}>
          <div style={{padding:'10px 16px',borderBottom:'1px solid var(--border)',fontSize:'11px',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.06em',color:'var(--text-muted)'}}>
            Active Incidents
          </div>
          {incidents.map((inc: any) => (
            <div key={inc.id} onClick={()=>{ setSelectedSpillId(inc.id); navigate('/incidents/'+inc.id);}}
              style={{padding:'10px 16px',borderBottom:'1px solid var(--border)',cursor:'pointer',transition:'background 150ms'}}
              onMouseEnter={e=>(e.currentTarget.style.background='var(--surface-2)')}
              onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
                <span style={{fontFamily:'var(--font-mono)',fontSize:'12px',color:'var(--accent)'}}>{inc.id}</span>
                <ProvenanceBadge provenance={inc.provenance} />
              </div>
              <div style={{fontSize:'12px',color:'var(--text-secondary)',marginBottom:2}}>{inc.incident_name}</div>
              <div style={{display:'flex',gap:8,fontSize:'11px',color:'var(--text-muted)',fontFamily:'var(--font-mono)'}}>
                <span>{inc.area_km2?.toFixed(2)} km²</span>
                <span>conf: {inc.detection_confidence?.toFixed(3)}</span>
                <span style={{color: inc.severity==='high'?'var(--status-error)':'var(--status-warning)'}}>{inc.severity?.toUpperCase()}</span>
              </div>
              <div style={{fontSize:'10px',color:'var(--text-disabled)',marginTop:2,fontFamily:'var(--font-mono)'}}>
                T0: {inc.satellite_acquisition_time?.slice(0,16)} UTC
              </div>
            </div>
          ))}
          {incidents.length===0 && <div style={{padding:16,fontSize:'12px',color:'var(--text-muted)'}}>No incidents found</div>}
        </div>
        {/* Center: Map */}
        <InvestigationMap spill={incidents[0]} >
          <LayerControl />
        </InvestigationMap>
        {/* Right: Evidence panel */}
        <div style={{borderLeft:'1px solid var(--border)',background:'var(--bg-secondary)',overflow:'auto',padding:0}}>
          <div style={{padding:'10px 16px',borderBottom:'1px solid var(--border)',fontSize:'11px',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.06em',color:'var(--text-muted)'}}>
            System Status
          </div>
          <div style={{padding:16}}>
            <div style={{fontSize:'12px',color:'var(--text-secondary)',marginBottom:12}}>
              OILTRACE AI maritime investigation workstation is operational.
              All pipeline stages available in Simulation Mode.
            </div>
            <div className="alert alert-info" style={{marginBottom:12}}>
              <span>ℹ</span>
              <div style={{fontSize:'12px'}}>Running in <strong>SIMULATION MODE</strong>. All data is synthetic with seed 26143. Results are deterministic and reproducible.</div>
            </div>
            <div style={{fontSize:'11px',color:'var(--text-muted)',marginBottom:8,textTransform:'uppercase',letterSpacing:'0.06em',fontWeight:600}}>Quick Access</div>
            {incidents[0] && [
              ['Satellite Detection', '/incidents/'+incidents[0].id+'/detection'],
              ['Drift / Hindcast', '/incidents/'+incidents[0].id+'/drift'],
              ['Forecast', '/incidents/'+incidents[0].id+'/forecast'],
              ['Vessel Investigation', '/incidents/'+incidents[0].id+'/vessels'],
              ['Digital Twin', '/incidents/'+incidents[0].id+'/timeline'],
              ['Investigation Report', '/incidents/'+incidents[0].id+'/report'],
            ].map(([label,path]) => (
              <div key={path as string} onClick={()=>navigate(path as string)}
                style={{padding:'7px 10px',marginBottom:2,borderRadius:'var(--radius)',border:'1px solid var(--border)',cursor:'pointer',fontSize:'13px',color:'var(--text-secondary)',background:'var(--surface-1)'}}
                onMouseEnter={e=>{e.currentTarget.style.background='var(--surface-2)';e.currentTarget.style.color='var(--text-primary)';}}
                onMouseLeave={e=>{e.currentTarget.style.background='var(--surface-1)';e.currentTarget.style.color='var(--text-secondary)';}}
              >{label as string}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
