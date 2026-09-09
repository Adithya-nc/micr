import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchDashboardStats, runHindcast, runForecast, runAttribution, generateReport } from '../services/api';
import { LoadingState } from '../components/StateComponents';
import ProcessingPipeline from '../components/ProcessingPipeline';

const STEPS = ['Detection', 'Hindcast', 'Forecast', 'AIS Attribution', 'Report'];

export default function AnalyzePage() {
  const [stats, setStats] = useState<any>(null);
  const [step, setStep] = useState(-1);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState<boolean[]>([]);
  const [error, setError] = useState<string|null>(null);
  const navigate = useNavigate();

  useEffect(() => { fetchDashboardStats().then(setStats).catch(console.error); }, []);

  const runFullPipeline = async () => {
    const spillId = stats?.incidents?.[0]?.id;
    if (!spillId) return;
    setRunning(true); setError(null); setDone([]);
    const completed: boolean[] = [];
    try {
      setStep(1); await runHindcast(spillId); completed.push(true); setDone([...completed]);
      setStep(2); await runForecast(spillId); completed.push(true); setDone([...completed]);
      setStep(3); await runAttribution(spillId); completed.push(true); setDone([...completed]);
      setStep(4); await generateReport(spillId); completed.push(true); setDone([...completed]);
      setStep(5);
    } catch(e:any) { setError(e.message); }
    finally { setRunning(false); }
  };

  const spillId = stats?.incidents?.[0]?.id || 'SIH-2024-001';
  const stages = [
    { label: 'SAR Detection & Characterization', status: 'complete' as const, detail: 'Precomputed / DEMO' },
    { label: 'Drift Hindcast (Backward RK4)', status: (step>1||done[0])?'complete' as const:step===1?'processing' as const:'waiting' as const, detail: done[0]?'Done':'50 particles, 18h' },
    { label: 'Drift Forecast (+48h)', status: (step>2||done[1])?'complete' as const:step===2?'processing' as const:'waiting' as const, detail: done[1]?'Done':'50 particles, 48h' },
    { label: 'AIS Attribution Analysis', status: (step>3||done[2])?'complete' as const:step===3?'processing' as const:'waiting' as const, detail: done[2]?'Done':'7 vessels scored' },
    { label: 'Report Generation', status: (step>4||done[3])?'complete' as const:step===4?'processing' as const:'waiting' as const, detail: done[3]?'Done':'HTML+structured' },
  ];

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%',overflow:'auto'}}>
      <div style={{padding:'10px 16px',borderBottom:'1px solid var(--border)',background:'var(--surface-1)',flexShrink:0}}>
        <div style={{fontSize:'15px',fontWeight:600}}>Full Pipeline Analysis</div>
        <div style={{fontSize:'11px',color:'var(--text-muted)'}}>Run all stages sequentially: Hindcast → Forecast → Attribution → Report</div>
      </div>
      <div style={{maxWidth:600,margin:'0 auto',padding:24,width:'100%'}}>
        <div style={{marginBottom:16}}>
          <div style={{fontSize:'13px',fontWeight:600,marginBottom:4,color:'var(--text-secondary)'}}>Target Incident</div>
          <div style={{fontFamily:'var(--font-mono)',fontSize:'14px',color:'var(--accent)',padding:'8px 12px',background:'var(--surface-1)',border:'1px solid var(--border)',borderRadius:'var(--radius)'}}>
            {spillId}
          </div>
        </div>
        <div style={{marginBottom:20}}>
          <div style={{fontSize:'13px',fontWeight:600,marginBottom:8,color:'var(--text-secondary)'}}>Pipeline Stages</div>
          <ProcessingPipeline stages={stages} />
        </div>
        {error && <div className="alert alert-error" style={{marginBottom:16}}><span>✗</span><div>{error}</div></div>}
        {step===5 && <div className="alert alert-info" style={{marginBottom:16}}><span>✓</span><div style={{fontSize:'13px'}}>All pipeline stages completed.</div></div>}
        <div style={{display:'flex',gap:8}}>
          <button className="btn btn-primary" onClick={runFullPipeline} disabled={running} style={{flex:1}}>
            {running ? 'Running Pipeline...' : step===5 ? 'Run Pipeline Again' : 'Run Full Pipeline'}
          </button>
        </div>
        {step===5 && (
          <div style={{display:'flex',gap:8,marginTop:12,flexWrap:'wrap'}}>
            {[['View Vessel Investigation','/incidents/'+spillId+'/vessels'],['Digital Twin','/incidents/'+spillId+'/timeline'],['Investigation Report','/incidents/'+spillId+'/report']].map(([l,p]) => (
              <button key={p} className="btn btn-secondary btn-sm" onClick={()=>navigate(p)}>{l}</button>
            ))}
          </div>
        )}
        <div style={{marginTop:20,padding:'12px',background:'var(--surface-1)',border:'1px solid var(--border)',borderRadius:'var(--radius)'}}>
          <div style={{fontSize:'11px',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.06em',color:'var(--text-muted)',marginBottom:6}}>Technical Parameters</div>
          {[['Particle Count','50'],['Integration Method','RK4'],['Hindcast','18h backward'],['Forecast','48h forward'],['Timestep','Δt=30 min'],['Windage','α=0.03'],['AIS Radius','50 km'],['AIS Window','±2 h'],['Seed','26143 (deterministic)']
          ].map(([k,v]) => (
            <div key={k} style={{display:'flex',justifyContent:'space-between',fontSize:'12px',padding:'2px 0',borderBottom:'1px solid var(--border)'}}>
              <span style={{color:'var(--text-muted)'}}>{k}</span>
              <span style={{fontFamily:'var(--font-mono)',color:'var(--text-primary)'}}>{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
