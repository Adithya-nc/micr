import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchSpill, fetchSpillImage } from '../services/api';
import ProvenanceBadge from '../components/ProvenanceBadge';
import ProcessingPipeline from '../components/ProcessingPipeline';
import SarLimitation from '../components/SarLimitation';
import { LoadingState, ErrorState } from '../components/StateComponents';

export default function DetectionPage() {
  const { id } = useParams<{id:string}>();
  const [spill, setSpill] = useState<any>(null);
  const [image, setImage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string|null>(null);

  useEffect(() => {
    if (!id) return;
    Promise.all([fetchSpill(id), fetchSpillImage(id)])
      .then(([sp,img]) => { setSpill(sp); setImage(img); })
      .catch(e=>setError(e.message)).finally(()=>setLoading(false));
  }, [id]);

  if (loading) return <LoadingState message="Loading detection data..." />;
  if (error) return <ErrorState message={error} />;
  if (!spill) return <ErrorState message="Spill not found" />;

  const stages = [
    { label: '1. Scene uploaded', status: 'complete' as const, detail: image?.filename?.slice(0,40)+'...' },
    { label: '2. Metadata validated', status: 'complete' as const, detail: 'CRS: '+image?.crs+', '+image?.resolution_m+'m/px' },
    { label: '3. SAR preprocessing', status: 'complete' as const, detail: 'v'+spill?.preprocessing_version },
    { label: '4. Model inference', status: 'complete' as const, detail: spill?.model_version+' [PRECOMPUTED / DEMO]' },
    { label: '5. Mask generated', status: 'complete' as const, detail: 'threshold: '+spill?.model_threshold },
    { label: '6. Geometry extracted', status: 'complete' as const, detail: spill?.area_km2?.toFixed(3)+' km²' },
    { label: '7. Characterization complete', status: 'complete' as const, detail: 'compactness: '+spill?.compactness?.toFixed(4) },
  ];

  const metrics = [
    ['Detection Confidence', (spill.detection_confidence*100).toFixed(1)+'%'],
    ['Detected Class', spill.detected_class],
    ['Spill Area', spill.area_km2?.toFixed(3)+' km²'],
    ['Perimeter', spill.perimeter_km?.toFixed(3)+' km'],
    ['Length', spill.length_km?.toFixed(3)+' km'],
    ['Width', spill.width_km?.toFixed(3)+' km'],
    ['Orientation', spill.orientation_deg?.toFixed(1)+'°'],
    ['Compactness (4πA/P²)', spill.compactness?.toFixed(6)],
    ['Centroid Lat', spill.centroid_geojson?.coordinates?.[1]?.toFixed(6)],
    ['Centroid Lon', spill.centroid_geojson?.coordinates?.[0]?.toFixed(6)],
    ['Acquisition Time', spill.satellite_acquisition_time?.slice(0,19)+' UTC'],
    ['CRS', image?.crs],
    ['Resolution', image?.resolution_m+'m/px'],
    ['Satellite', image?.satellite_name],
    ['Model Version', spill.model_version],
    ['Preprocessing', spill.preprocessing_version],
    ['Threshold', spill.model_threshold],
  ];

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%',overflow:'hidden'}}>
      <div style={{padding:'10px 16px',borderBottom:'1px solid var(--border)',display:'flex',justifyContent:'space-between',alignItems:'center',background:'var(--surface-1)',flexShrink:0}}>
        <div>
          <div style={{fontSize:'15px',fontWeight:600}}>{id} — Satellite Detection</div>
          <div style={{fontSize:'11px',color:'var(--text-muted)',fontFamily:'var(--font-mono)'}}>{spill.incident_name}</div>
        </div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <ProvenanceBadge provenance={spill.provenance} />
          <span style={{fontSize:'11px',color:'var(--text-muted)',fontFamily:'var(--font-mono)'}}>class: {spill.detected_class}</span>
          <span style={{fontSize:'15px',fontFamily:'var(--font-mono)',fontWeight:600,color:'var(--accent)'}}>{(spill.detection_confidence*100).toFixed(1)}% conf</span>
        </div>
      </div>
      <div style={{flex:1,display:'grid',gridTemplateColumns:'1fr 280px',overflow:'hidden'}}>
        {/* SAR Image placeholder + overlay */}
        <div style={{background:'#060A0F',position:'relative',overflow:'hidden',borderRight:'1px solid var(--border)',display:'flex',flexDirection:'column'}}>
          <div style={{padding:'8px 12px',borderBottom:'1px solid var(--border)',display:'flex',gap:8,alignItems:'center',background:'var(--surface-1)',flexShrink:0}}>
            <ProvenanceBadge provenance="synthetic" />
            <span style={{fontSize:'11px',color:'var(--text-muted)'}}>PRECOMPUTED / DEMO SAR — Not from real satellite acquisition</span>
          </div>
          {/* Synthetic SAR visualization */}
          <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',position:'relative'}}>
            <svg width="100%" height="100%" viewBox="0 0 800 600" style={{position:'absolute',top:0,left:0}}>
              <rect width="800" height="600" fill="#070C12" />
              {/* Noise background */}
              {Array.from({length:2000}).map((_,i) => {
                const x=(i*137.5)%800,y=(i*73.3)%600,v=0.1+((i*31)%10)/30;
                return <rect key={i} x={x} y={y} width="2" height="2" fill={'rgba(100,140,180,'+v+')'} />;
              })}
              {/* Dark region representing potential slick */}
              <ellipse cx="420" cy="320" rx="140" ry="75" fill="rgba(0,0,0,0.7)" opacity="0.8" />
              {/* Oil outline (detection result) */}
              <ellipse cx="420" cy="320" rx="140" ry="75" fill="none" stroke="#FFB020" strokeWidth="2" strokeDasharray="8 4" opacity="0.9" />
              {/* Centroid marker */}
              <circle cx="420" cy="320" r="6" fill="#F97316" stroke="white" strokeWidth="2" />
              <text x="432" y="316" fill="#FFB020" fontSize="12" fontFamily="monospace">SPILL CENTROID</text>
              {/* Scale bar */}
              <line x1="40" y1="560" x2="120" y2="560" stroke="white" strokeWidth="2" />
              <text x="40" y="555" fill="white" fontSize="10" fontFamily="monospace">~5km</text>
              {/* Coordinate annotations */}
              <text x="10" y="20" fill="rgba(167,176,186,0.7)" fontSize="10" fontFamily="monospace">15.42°N 72.68°E</text>
              <text x="10" y="580" fill="rgba(167,176,186,0.7)" fontSize="10" fontFamily="monospace">Sentinel-1A | VV+VH | 10m/px | 2024-03-15 06:00 UTC</text>
              <text x="580" y="20" fill="rgba(200,164,93,0.8)" fontSize="11" fontFamily="monospace" fontWeight="600">DEMO RENDER</text>
            </svg>
          </div>
          <div style={{padding:'8px 12px',borderTop:'1px solid var(--border)',background:'var(--surface-1)',flexShrink:0}}>
            <SarLimitation />
          </div>
        </div>
        {/* Right panel: metrics + pipeline */}
        <div style={{overflow:'auto',display:'flex',flexDirection:'column',gap:0}}>
          <div style={{padding:'10px 12px',borderBottom:'1px solid var(--border)',fontSize:'11px',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.06em',color:'var(--text-muted)',background:'var(--surface-1)',flexShrink:0}}>Detection Metrics</div>
          <div style={{padding:'12px',flex:1,overflow:'auto'}}>
            {metrics.map(([k,v]) => (
              <div key={k} style={{display:'flex',justifyContent:'space-between',padding:'4px 0',borderBottom:'1px solid var(--border)'}}>
                <span style={{fontSize:'12px',color:'var(--text-muted)'}}>{k}</span>
                <span style={{fontSize:'12px',fontFamily:'var(--font-mono)',color:'var(--text-primary)'}}>{v}</span>
              </div>
            ))}
          </div>
          <div style={{borderTop:'1px solid var(--border)',padding:'10px 12px',background:'var(--surface-1)',flexShrink:0}}>
            <div style={{fontSize:'11px',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.06em',color:'var(--text-muted)',marginBottom:8}}>Processing Pipeline</div>
            <ProcessingPipeline stages={stages} />
          </div>
        </div>
      </div>
    </div>
  );
}
