import { useState } from 'react'
import { StatusBadge } from '@/components/resolvesphere/StatusBadge'
import { Database, X } from 'lucide-react'

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
    <section className="rounded-xl border bg-card">
      <header className="flex items-center gap-2 border-b px-4 py-3.5">
        <Database className="h-3.5 w-3.5 text-muted-foreground" />
        <h2 className="text-sm font-semibold">Evidence Ledger</h2>
        {evidence.length > 0 && (
          <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
            {evidence.length} records
          </span>
        )}
      </header>

      {evidence.length === 0 ? (
        <p className="px-4 py-6 text-sm text-muted-foreground">No evidence retrieved yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-muted/40">
              <tr>
                <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Fact</th>
                <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Source</th>
                <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Authority</th>
                <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Freshness</th>
                <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Retrieved</th>
                <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {evidence.map((row) => (
                <tr
                  key={row.evidence_id}
                  className="cursor-pointer transition-smooth hover:bg-muted/40"
                  onClick={() => setSelected(row)}
                >
                  <td className="px-4 py-2.5 font-medium">
                    <span className="text-xs text-muted-foreground">{row.field_name}:</span>{' '}
                    {String(row.value)}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{row.source_system}</td>
                  <td className="px-4 py-2.5">
                    <StatusBadge
                      value={row.authority_level}
                      tone={row.authority_level === 'AUTHORITATIVE' ? 'success' : row.authority_level === 'CUSTOMER_STATEMENT' ? 'warning' : 'info'}
                    />
                  </td>
                  <td className="px-4 py-2.5">
                    <StatusBadge
                      value={row.freshness_status}
                      tone={row.freshness_status === 'FRESH' ? 'success' : row.freshness_status === 'STALE' ? 'warning' : 'danger'}
                    />
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">
                    {new Date(row.retrieved_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-4 py-2.5">
                    <StatusBadge value={row.status} tone={row.status === 'CONTRADICTED' ? 'danger' : 'neutral'} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Evidence provenance modal */}
      {selected && (
        <div
          role="dialog"
          aria-label="Evidence provenance"
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 p-4 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setSelected(null) }}
        >
          <div className="w-full max-w-md rounded-2xl border bg-card shadow-2xl animate-slide-up">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <h3 className="font-semibold">Evidence Provenance</h3>
              <button
                onClick={() => setSelected(null)}
                className="rounded-lg p-1.5 text-muted-foreground transition-smooth hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <dl className="space-y-3 px-5 py-4 text-sm">
              {[
                { label: 'Fact', value: selected.field_name || 'Source information unavailable.' },
                { label: 'Value', value: String(selected.value) },
                { label: 'Source system', value: selected.source_system, mono: true },
                { label: 'Record ID', value: selected.source_record_id, mono: true },
                { label: 'Timestamp', value: new Date(selected.retrieved_at).toLocaleString() },
                { label: 'Retrieval method', value: selected.retrieval_method },
                { label: 'Relevance', value: selected.relevance },
              ].map((item) => (
                <div key={item.label} className="flex items-start justify-between gap-4">
                  <dt className="shrink-0 text-muted-foreground">{item.label}</dt>
                  <dd className={`text-right ${item.mono ? 'font-mono text-xs' : ''}`}>{item.value}</dd>
                </div>
              ))}
            </dl>
            <div className="border-t px-5 py-3.5">
              <div className="flex items-center gap-3">
                <StatusBadge value={selected.authority_level} tone={selected.authority_level === 'AUTHORITATIVE' ? 'success' : 'warning'} />
                <StatusBadge value={selected.status} tone={selected.status === 'CONTRADICTED' ? 'danger' : 'neutral'} />
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
