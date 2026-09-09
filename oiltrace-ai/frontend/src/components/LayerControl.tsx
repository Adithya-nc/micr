import React, { useState } from 'react';
import { useStore } from '../state/store';
import type { LayerKey } from '../state/store';

const LAYERS: Array<{ key: LayerKey; label: string; color: string; }> = [
  { key: 'slickGeometry',  label: 'Slick Geometry',     color: '#F59E0B' },
  { key: 'detectionMask',  label: 'Detection Mask',     color: '#FFB020' },
  { key: 'originRegion',   label: 'Origin Region',      color: '#7C8FA6' },
  { key: 'hindcast',       label: 'Hindcast Particles',  color: '#6F879C' },
  { key: 'forecast',       label: 'Forecast Particles',  color: '#A8B7C5' },
  { key: 'currentVectors', label: 'Current Vectors',    color: '#3FA7D6' },
  { key: 'windVectors',    label: 'Wind Vectors',       color: '#5E91B3' },
  { key: 'aisVessels',     label: 'AIS Vessels',        color: '#E6EAEE' },
  { key: 'vesselTracks',   label: 'Vessel Tracks',      color: '#A7B0BA' },
  { key: 'candidateVessel',label: 'Candidate Vessel',   color: '#D97706' },
  { key: 'uncertainty',    label: 'Uncertainty',        color: '#8FA3B8' },
];

export default function LayerControl() {
  const { layers, setLayer } = useStore();
  const [open, setOpen] = useState(true);
  return (
    <div className="layer-control">
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:open?8:0}}>
        <span style={{fontSize:'10px',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.08em',color:'var(--text-muted)'}}>Layers</span>
        <button onClick={()=>setOpen(!open)} className="btn-icon btn-ghost" style={{padding:'2px 4px',fontSize:'10px'}}>{open?'▲':'▼'}</button>
      </div>
      {open && LAYERS.map(l => (
        <label key={l.key} className="layer-toggle">
          <input type="checkbox" checked={layers[l.key]} onChange={e=>setLayer(l.key,e.target.checked)} />
          <span className="layer-toggle-swatch" style={{background:l.color}}/>
          <span>{l.label}</span>
        </label>
      ))}
    </div>
  );
}
