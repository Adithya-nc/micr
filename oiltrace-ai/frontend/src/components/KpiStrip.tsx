import React from 'react';

interface KpiProps { value: string|number; label: string; source?: string; color?: string; }
function KpiCard({ value, label, source, color }: KpiProps) {
  return (
    <div className="kpi-card">
      <div className="kpi-card__value" style={color?{color}:{}}>{value}</div>
      <div className="kpi-card__label">{label}</div>
      {source && <div className="kpi-card__source">{source}</div>}
    </div>
  );
}

interface KpiStripProps {
  activeIncidents: number; analyzedScenes: number; analyzedVessels: number; highPriority: number;
}
export default function KpiStrip({ activeIncidents, analyzedScenes, analyzedVessels, highPriority }: KpiStripProps) {
  return (
    <div className="kpi-strip">
      <KpiCard value={activeIncidents} label="Active Incidents" source="oil_spills table" />
      <KpiCard value={analyzedScenes} label="Analyzed Scenes" source="satellite_images table" />
      <KpiCard value={analyzedVessels} label="Analyzed Vessels" source="vessels table" />
      <KpiCard value={highPriority} label="High Priority Cases" source="severity=high|critical" color="var(--status-error)" />
    </div>
  );
}
