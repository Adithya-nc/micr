import { useState } from 'react'
import { StatusBadge } from '@/components/resolvesphere/StatusBadge'

export type EvidenceRow = {
  evidence_id: string
  field_name: string
  value: unknown
  source_system: string
  source_type: string
  source_record_id: string
  authority_level: string
  freshness_status: string
  retrieval_method: string
  relevance: string
  status: string
  retrieved_at: string
}

export function EvidenceLedgerPanel({ evidence }: { evidence: EvidenceRow[] }) {
  const [selected, setSelected] = useState<EvidenceRow | null>(null)

  return (
    <section className="rounded-lg border bg-card">
      <header className="border-b px-4 py-3"><h2 className="text-sm font-semibold">Evidence Ledger</h2></header>
      {evidence.length === 0 ? (
        <p className="px-4 py-6 text-sm text-muted-foreground">No evidence retrieved yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-2">Fact</th>
                <th className="px-4 py-2">Source system</th>
                <th className="px-4 py-2">Authority</th>
                <th className="px-4 py-2">Freshness</th>
                <th className="px-4 py-2">Retrieved</th>
                <th className="px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {evidence.map((row) => (
                <tr key={row.evidence_id} className="cursor-pointer border-b last:border-0 hover:bg-muted/50" onClick={() => setSelected(row)}>
                  <td className="px-4 py-2 font-medium">{row.field_name}: {String(row.value)}</td>
                  <td className="px-4 py-2 text-muted-foreground">{row.source_system}</td>
                  <td className="px-4 py-2"><StatusBadge value={row.authority_level} tone={row.authority_level === 'AUTHORITATIVE' ? 'success' : row.authority_level === 'CUSTOMER_STATEMENT' ? 'warning' : 'info'} /></td>
                  <td className="px-4 py-2"><StatusBadge value={row.freshness_status} tone={row.freshness_status === 'FRESH' ? 'success' : row.freshness_status === 'STALE' ? 'warning' : 'danger'} /></td>
                  <td className="px-4 py-2 text-muted-foreground">{new Date(row.retrieved_at).toLocaleTimeString()}</td>
                  <td className="px-4 py-2"><StatusBadge value={row.status} tone={row.status === 'CONTRADICTED' ? 'danger' : 'neutral'} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {selected && (
        <div role="dialog" aria-label="Evidence provenance" className="fixed inset-0 z-50 grid place-items-center bg-foreground/20 p-4">
          <div className="w-full max-w-md rounded-lg border bg-card p-5">
            <h3 className="text-base font-semibold">Provenance</h3>
            <dl className="mt-4 space-y-2 text-sm">
              <div><dt className="text-muted-foreground">Fact</dt><dd>{selected.field_name || 'Source information unavailable.'}</dd></div>
              <div><dt className="text-muted-foreground">Source</dt><dd>{selected.source_system}</dd></div>
              <div><dt className="text-muted-foreground">Record</dt><dd>{selected.source_record_id}</dd></div>
              <div><dt className="text-muted-foreground">Timestamp</dt><dd>{new Date(selected.retrieved_at).toLocaleString()}</dd></div>
              <div><dt className="text-muted-foreground">Retrieval method</dt><dd>{selected.retrieval_method}</dd></div>
              <div><dt className="text-muted-foreground">Relevance</dt><dd>{selected.relevance}</dd></div>
            </dl>
            <button onClick={() => setSelected(null)} className="mt-5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground">Close</button>
          </div>
        </div>
      )}
    </section>
  )
}
