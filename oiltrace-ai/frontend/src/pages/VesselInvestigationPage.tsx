import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { fetchSpill, runAttribution, fetchAttribution, fetchAllTracks, runHindcast } from '../services/api';
import InvestigationMap from '../map/InvestigationMap';
import LayerControl from '../components/LayerControl';
import EvidenceBar from '../components/EvidenceBar';
import FilteringFunnel from '../components/FilteringFunnel';
import ProvenanceBadge from '../components/ProvenanceBadge';
import { LoadingState, ErrorState, UnavailableState } from '../components/StateComponents';
import { useStore } from '../state/store';

export default function VesselInvestigationPage() {
  const { id } = useParams<{id:string}>();
  const [spill, setSpill] = useState<any>(null);
  const [attribution, setAttribution] = useState<any>(null);
  const [funnel, setFunnel] = useState<any>(null);
  const [tracks, setTracks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [tab, setTab] = useState<'rank'|'funnel'|'evidence'>('rank');
  const { selectedMmsi, setSelectedMmsi } = useStore();

  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [sp, tr] = await Promise.all([fetchSpill(id), fetchAllTracks(id)]);
      setSpill(sp); setTracks(tr);
      try { const a = await fetchAttribution(id); setAttribution(a); } catch(e) { /* none yet */ }
    } finally { setLoading(false); }
  }, [id]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleRunAttribution = async () => {
    if (!id) return; setRunning(true);
    try {
      try { await runHindcast(id); } catch(e) { /* might exist */ }
      const f = await runAttribution(id); setFunnel(f); await loadData();
    } finally { setRunning(false); }
  };

  if (loading) return <LoadingState message="Loading vessel investigation..." />;

  const vessels = attribution?.vessels || funnel?.vessels || [];
  const topVessel = vessels[activeIdx];
  const funnelStages = funnel ? [
    { label: 'All AIS Observations', count: funnel.total_ais_observations || 0 },
    { label: 'Spatial Filter', count: funnel.spatial_filter?.output_count || 0, removed: funnel.spatial_filter?.removed_count, config: funnel.spatial_filter?.radius_km+'km radius' },
    { label: 'Temporal Filter', count: funnel.temporal_filter?.output_count || 0, removed: funnel.temporal_filter?.removed_count, config: '±'+funnel.temporal_filter?.window_hours+'h window' },
    { label: 'Trajectory Filter', count: funnel.trajectory_filter?.output_count || 0, removed: funnel.trajectory_filter?.removed_count, config: 'heading compatible', active: true },
    { label: 'Behaviour Analysis', count: funnel.behaviour_analysis_count || 0 },
    { label: 'Ranked Candidates', count: funnel.ranked_candidates || 0 },
  ] : [];

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%',overflow:'hidden'}}>
      <div style={{padding:'10px 16px',borderBottom:'1px solid var(--border)',display:'flex',justifyContent:'space-between',alignItems:'center',background:'var(--surface-1)',flexShrink:0}}>
        <div>
          <div style={{fontSize:'15px',fontWeight:600}}>{id} — Vessel Investigation</div>
          <div style={{fontSize:'11px',color:'var(--text-muted)',fontFamily:'var(--font-mono)'}}>AIS correlation • Multi-factor scoring • Ranked candidates</div>
        </div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <button className="btn btn-primary" onClick={handleRunAttribution} disabled={running}>
            {running ? 'Analyzing...' : vessels.length ? 'Re-run Attribution' : 'Run Attribution Analysis'}
          </button>
          <ProvenanceBadge provenance="synthetic" />
        </div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'260px 1fr 380px',flex:1,overflow:'hidden'}}>
        {/* Left: Vessel ranking table */}
        <div style={{borderRight:'1px solid var(--border)',background:'var(--bg-secondary)',display:'flex',flexDirection:'column',overflow:'hidden'}}>
          <div style={{display:'flex',gap:0,flexShrink:0,borderBottom:'1px solid var(--border)'}}>
            {['rank','funnel','evidence'].map(t => (
              <button key={t} onClick={()=>setTab(t as any)}
                style={{flex:1,padding:'8px 4px',fontSize:'11px',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.05em',
                  background:tab===t?'var(--surface-3)':'transparent',color:tab===t?'var(--accent)':'var(--text-muted)',
                  borderBottom:tab===t?'2px solid var(--accent)':'2px solid transparent',borderTop:'none',borderLeft:'none',borderRight:'none'}}>
                {t}
              </button>
            ))}
          </div>
          <div style={{flex:1,overflow:'auto',padding:tab==='funnel'?12:0}}>
            {tab==='rank' && (
              vessels.length>0 ? vessels.map((v:any,i:number)=>(
                <div key={v.mmsi} onClick={()=>{setActiveIdx(i);setSelectedMmsi(v.mmsi);}}
                  style={{padding:'10px 12px',borderBottom:'1px solid var(--border)',cursor:'pointer',
                    background:selectedMmsi===v.mmsi?'var(--accent-dim)':'transparent',
                    borderLeft:selectedMmsi===v.mmsi?'2px solid var(--accent)':'2px solid transparent'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
                    <span style={{fontFamily:'var(--font-mono)',fontSize:'13px',color:i===0?'var(--corr-high)':i===1?'var(--corr-med-high)':'var(--text-muted)'}}>
                      #{v.rank}
                    </span>
                    <span style={{fontFamily:'var(--font-mono)',fontSize:'15px',fontWeight:600,color:i===0?'var(--oil)':'var(--text-secondary)'}}>
                      {(v.final_score*100).toFixed(1)}
                    </span>
                  </div>
                  <div style={{fontSize:'12px',fontWeight:600,color:'var(--text-primary)',marginBottom:2}}>{v.vessel_name||v.mmsi}</div>
                  <div style={{fontSize:'11px',color:'var(--text-muted)',fontFamily:'var(--font-mono)'}}>
                    {v.vessel_type} • MMSI {v.mmsi} • {v.flag}
                  </div>
                  <div style={{display:'flex',gap:8,marginTop:4}}>
                    <span style={{fontSize:'10px',fontFamily:'var(--font-mono)',color:'var(--text-muted)'}}>evid: {v.evidence_score?.toFixed(3)}</span>
                    <span style={{fontSize:'10px',fontFamily:'var(--font-mono)',color:'var(--text-muted)'}}>conf: {v.data_confidence?.toFixed(3)}</span>
                  </div>
                </div>
              )) : <UnavailableState title="No analysis" message="Run attribution to see ranked vessels" />
            )}
            {tab==='funnel' && (
              funnelStages.length>0 ? <FilteringFunnel stages={funnelStages} /> : <UnavailableState title="No funnel" message="Run attribution first" />
            )}
            {tab==='evidence' && topVessel && (
              <div style={{padding:12}}>
                <div style={{marginBottom:10,fontSize:'13px',fontWeight:600,color:'var(--text-primary)'}}>{topVessel.vessel_name}</div>
                {(topVessel.factors||[]).map((f:any) => (
                  <EvidenceBar key={f.factor} label={f.label} rawValue={f.raw_value} rawUnit={f.raw_unit}
                    normalized={f.normalized} weight={f.weight} contribution={f.contribution} />
                ))}
              </div>
            )}
          </div>
        </div>
        {/* Center: Map */}
        <InvestigationMap spill={spill} tracks={tracks} attributions={vessels} selectedMmsi={selectedMmsi} onVesselClick={setSelectedMmsi}>
          <LayerControl />
        </InvestigationMap>
        {/* Right: Detail panel */}
        <div style={{borderLeft:'1px solid var(--border)',background:'var(--bg-secondary)',overflow:'auto'}}>
          {topVessel ? (
            <div>
              <div style={{padding:'10px 12px',borderBottom:'1px solid var(--border)',display:'flex',justifyContent:'space-between'}}>
                <div style={{fontSize:'12px',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.05em',color:'var(--text-muted)'}}>Vessel Detail</div>
                <span style={{fontFamily:'var(--font-mono)',fontSize:'20px',fontWeight:700,color:'var(--oil)'}}>{(topVessel.final_score*100).toFixed(1)}</span>
              </div>
              <div style={{padding:12}}>
                <div className="alert alert-warning" style={{marginBottom:12}}>
                  <span>⚠</span>
                  <div style={{fontSize:'12px'}}>Scores are investigative correlation indicators. They do not constitute legal attribution of responsibility for this spill.</div>
                </div>
                {[
                  ['Vessel Name', topVessel.vessel_name||'—'],
                  ['MMSI', topVessel.mmsi],
                  ['IMO', topVessel.imo||'—'],
                  ['Type', topVessel.vessel_type||'—'],
                  ['Flag', topVessel.flag||'—'],
                  ['Length', topVessel.length_m ? topVessel.length_m+'m' : '—'],
                  ['GRT', topVessel.gross_tonnage ? topVessel.gross_tonnage?.toLocaleString()+' GT' : '—'],
                  ['Rank', '#'+topVessel.rank],
                  ['Evidence Score', topVessel.evidence_score?.toFixed(4)],
                  ['Data Confidence', topVessel.data_confidence?.toFixed(4)],
                  ['Final Score', topVessel.final_score?.toFixed(4)],
                  ['Distance to Origin', topVessel.distance_km?.toFixed(2)+' km'],
                  ['Temporal Delta', topVessel.time_delta_h?.toFixed(2)+' h'],
                  ['AIS Coverage', topVessel.ais_coverage_pct?.toFixed(1)+'%'],
                  ['AIS Gap Detected', topVessel.ais_gap_detected ? 'YES (⚠)' : 'No'],
                  ['Slowdown Observed', topVessel.slowdown_observed ? 'YES' : 'No'],
                ].map(([k,v]) => (
                  <div key={k} style={{display:'flex',justifyContent:'space-between',padding:'4px 0',borderBottom:'1px solid var(--border)'}}>
                    <span style={{fontSize:'12px',color:'var(--text-muted)'}}>{k}</span>
                    <span style={{fontSize:'12px',fontFamily:'var(--font-mono)',color: String(v).includes('⚠')||String(v).includes('YES')?'var(--status-warning)':'var(--text-primary)'}}>{v}</span>
                  </div>
                ))}
                {topVessel.behaviour_observations?.length>0 && (
                  <div style={{marginTop:12}}>
                    <div style={{fontSize:'11px',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.06em',color:'var(--text-muted)',marginBottom:6}}>Behaviour Observations</div>
                    {topVessel.behaviour_observations.map((obs:string,i:number) => (
                      <div key={i} style={{fontSize:'12px',color:'var(--status-warning)',padding:'4px 0',borderBottom:'1px solid var(--border)'}}>• {obs}</div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : <UnavailableState title="Select a vessel" message="Run attribution and click a vessel from the ranking list" />}
        </div>
      </div>
    </div>
  );
}
