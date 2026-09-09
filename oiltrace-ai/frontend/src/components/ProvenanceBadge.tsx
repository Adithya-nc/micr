import React from 'react';

type P = 'observed'|'reconstructed'|'predicted'|'synthetic';
const LABELS: Record<P,string> = {observed:'OBSERVED',reconstructed:'RECONSTRUCTED',predicted:'PREDICTED',synthetic:'SYNTHETIC'};
export default function ProvenanceBadge({ provenance }: { provenance: string }) {
  const p = (provenance||'synthetic') as P;
  return <span className={'tag tag-'+p}>{LABELS[p]||p.toUpperCase()}</span>;
}
