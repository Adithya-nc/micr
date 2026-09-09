import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { generateReport, fetchReport, getReportHtmlUrl } from '../services/api';
import { LoadingState } from '../components/StateComponents';

export default function ReportPage() {
  const { id } = useParams<{id:string}>();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!id) return; setLoading(true);
    fetchReport(id).then(setReport).catch(()=>{}).finally(()=>setLoading(false));
  }, [id]);

  const handleGenerate = async () => {
    if (!id) return; setGenerating(true);
    try { const r = await generateReport(id); setReport(r); fetchReport(id).then(setReport).catch(()=>{}); }
    finally { setGenerating(false); }
  };

  if (loading) return <LoadingState message="Checking for existing report..." />;

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%',overflow:'hidden'}}>
      <div style={{padding:'10px 16px',borderBottom:'1px solid var(--border)',display:'flex',justifyContent:'space-between',alignItems:'center',background:'var(--surface-1)',flexShrink:0}}>
        <div>
          <div style={{fontSize:'15px',fontWeight:600}}>{id} — Investigation Report</div>
          <div style={{fontSize:'11px',color:'var(--text-muted)',fontFamily:'var(--font-mono)'}}>Automated narrative evidence report • HTML + Structured</div>
        </div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <button className="btn btn-primary" onClick={handleGenerate} disabled={generating}>
            {generating ? 'Generating...' : report ? 'Regenerate Report' : 'Generate Report'}
          </button>
          {report && (
            <a href={getReportHtmlUrl(id||'')} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
              Open Full Report
            </a>
          )}
        </div>
      </div>
      {report ? (
        <div style={{flex:1,overflow:'hidden',display:'flex',flexDirection:'column'}}>
          <div style={{padding:'8px 16px',background:'var(--surface-1)',borderBottom:'1px solid var(--border)',display:'flex',gap:12,alignItems:'center',flexShrink:0,fontSize:'12px',fontFamily:'var(--font-mono)'}}>
            <span style={{color:'var(--text-muted)'}}>Report ID:</span>
            <span style={{color:'var(--accent)'}}>{report.report_id}</span>
            <span style={{color:'var(--text-muted)'}}>Generated:</span>
            <span>{report.generated_at?.slice(0,19)} UTC</span>
            <span style={{color:'var(--text-muted)'}}>Status:</span>
            <span style={{color:'var(--status-success)'}}>{report.status?.toUpperCase()}</span>
          </div>
          <iframe
            src={getReportHtmlUrl(id||'')}
            style={{flex:1,border:'none',width:'100%',background:'#0B0F14'}}
            title="Investigation Report"
          />
        </div>
      ) : (
        <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:12}}>
          <div style={{fontSize:'24px',color:'var(--text-muted)'}}>&#x1f4c4;</div>
          <div style={{fontSize:'15px',color:'var(--text-secondary)',fontWeight:600}}>No report generated yet</div>
          <div style={{fontSize:'13px',color:'var(--text-muted)',maxWidth:360,textAlign:'center'}}>
            Generate a comprehensive HTML investigation report containing all analysis results: detection metrics, hindcast origin, vessel correlation, and audit trail.
          </div>
          <button className="btn btn-primary" onClick={handleGenerate} disabled={generating}>
            {generating ? 'Generating...' : 'Generate Investigation Report'}
          </button>
          <div className="alert alert-warning" style={{maxWidth:400}}>
            <span>⚠</span>
            <div style={{fontSize:'12px'}}>Ensure hindcast and attribution analysis have been run before generating the report. The report includes all completed analysis stages.</div>
          </div>
        </div>
      )}
    </div>
  );
}
