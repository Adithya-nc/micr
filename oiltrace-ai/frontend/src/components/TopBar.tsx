import React, { useState, useEffect } from 'react';
import { useStore } from '../state/store';

function UtcClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return <span className="topbar-time">{time.toISOString().replace('T',' ').slice(0,19)} UTC</span>;
}

interface TopBarProps { health?: Record<string,string>; }

export default function TopBar({ health }: TopBarProps) {
  const { dataMode, selectedSpillId } = useStore();
  return (
    <header className="topbar app-topbar">
      <div className="topbar-brand">
        <div>
          <div className="topbar-brand-name">OILTRACE AI</div>
          <div className="topbar-brand-id mono">SIH26143</div>
        </div>
        <div style={{marginLeft:8, borderLeft:'1px solid var(--border)', paddingLeft:8}}>
          <div className="topbar-brand-desc">MARITIME INCIDENT INVESTIGATION</div>
          <div style={{fontSize:'10px',color:'var(--text-disabled)'}}>Detect &bull; Reconstruct &bull; Correlate &bull; Explain</div>
        </div>
      </div>
      <div className="topbar-incident">
        {selectedSpillId ? selectedSpillId : 'No incident selected'}
      </div>
      <div className="topbar-right">
        <div className={'mode-badge ' + (dataMode === 'simulation' ? 'mode-badge--sim' : 'mode-badge--real')}>
          <div className="mode-dot"/>
          {dataMode === 'simulation' ? 'SIMULATION MODE' : 'REAL DATA'}
        </div>
        {health && (
          <div style={{display:'flex',gap:4,alignItems:'center'}}>
            {Object.entries(health).slice(0,3).map(([k,v]) => (
              <div key={k} title={k + ': ' + v} style={{width:7,height:7,borderRadius:'50%',background: v==='online'?'var(--status-success)':v==='precomputed_demo'?'var(--mode-sim)':'var(--status-warning)'}} />
            ))}
          </div>
        )}
        <UtcClock />
      </div>
    </header>
  );
}
