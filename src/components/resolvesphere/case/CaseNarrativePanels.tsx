import { StatusBadge } from '@/components/resolvesphere/StatusBadge'

export function ResolutionJourney({ escalated }: { escalated: boolean }) {
  const steps = escalated
    ? ['Customer claim', 'Evidence', 'Contradiction / risk', 'Autonomous action blocked', 'Human case brief']
    : ['Customer claim', 'Evidence', 'Decision', 'Policy', 'Risk / authorization', 'Action', 'Verification', 'Verified resolution']
  return (
    <section className="rounded-lg border bg-card p-4">
      <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
        {steps.map((step, index) => (
          <span key={step} className="flex items-center gap-2">
            {step}
            {index < steps.length - 1 && <span className="text-muted-foreground">→</span>}
          </span>
        ))}
      </div>
    </section>
  )
}

export function ContradictionPanel({ decision }: { decision: { risk_factors?: { level?: string } } | undefined }) {
  return (
    <section className="rounded-lg border border-destructive/50 bg-destructive/5 p-4">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-semibold text-destructive">Material Contradiction Detected</h2>
        <StatusBadge value="Autonomy Suspended" tone="danger" />
      </div>
      <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
        <div><dt className="text-xs text-muted-foreground">Source A — Payment DB</dt><dd>refund_status: PENDING</dd></div>
        <div><dt className="text-xs text-muted-foreground">Source B — Support DB</dt><dd>refund_status: COMPLETED</dd></div>
      </dl>
      <p className="mt-3 text-sm">Impact: Autonomous resolution blocked. Risk level: {decision?.risk_factors?.level ?? 'HIGH'}.</p>
    </section>
  )
}

export function EvidenceGapPanel({ question }: { question: string }) {
  return (
    <section className="rounded-lg border border-warning/50 bg-warning/5 p-4">
      <h2 className="text-sm font-semibold text-warning">Evidence Gap</h2>
      <p className="mt-2 text-sm">Missing information: refund confirmation reference.</p>
      <p className="text-sm text-muted-foreground">Systems checked: Payment DB, Refund DB.</p>
      <p className="mt-2 text-sm font-medium">Targeted question: "{question}"</p>
      <StatusBadge value="Do not ask again once answered" tone="warning" />
    </section>
  )
}

export function ResolutionProposalPanel({ decision }: { decision: { policy_id: string; risk_score: number; auth_state: string; evidence_ids: string[] } | undefined }) {
  return (
    <section className="rounded-lg border bg-card">
      <header className="border-b px-4 py-3"><h2 className="text-sm font-semibold">Resolution Proposal</h2></header>
      {!decision ? (
        <p className="px-4 py-6 text-sm text-muted-foreground">No validated Resolution Contract is available.</p>
      ) : (
        <dl className="grid gap-3 px-4 py-4 text-sm sm:grid-cols-2">
          <div><dt className="text-xs text-muted-foreground">Policy reference</dt><dd>{decision.policy_id}</dd></div>
          <div><dt className="text-xs text-muted-foreground">Risk score</dt><dd>{decision.risk_score}</dd></div>
          <div><dt className="text-xs text-muted-foreground">Authorization</dt><dd><StatusBadge value={decision.auth_state} /></dd></div>
          <div><dt className="text-xs text-muted-foreground">Evidence references</dt><dd>{decision.evidence_ids.join(', ')}</dd></div>
        </dl>
      )}
    </section>
  )
}

export function ResolutionPassportPanel({ passport }: { passport: Record<string, unknown> | null }) {
  return (
    <section className="rounded-lg border bg-card">
      <header className="border-b px-4 py-3"><h2 className="text-sm font-semibold">Resolution Passport</h2></header>
      {!passport ? (
        <p className="px-4 py-6 text-sm text-muted-foreground">No passport generated.</p>
      ) : (
        <dl className="grid gap-3 px-4 py-4 text-sm sm:grid-cols-2">
          <div><dt className="text-xs text-muted-foreground">Reported problem</dt><dd>{String(passport.reported_problem)}</dd></div>
          <div><dt className="text-xs text-muted-foreground">Actual problem</dt><dd>{String(passport.actual_problem)}</dd></div>
          <div><dt className="text-xs text-muted-foreground">Policy</dt><dd>{String(passport.policy_id)}</dd></div>
          <div><dt className="text-xs text-muted-foreground">Risk level</dt><dd>{String(passport.risk_level)}</dd></div>
          <div><dt className="text-xs text-muted-foreground">Final state</dt><dd><StatusBadge value={String(passport.final_state)} tone="success" /></dd></div>
          <div><dt className="text-xs text-muted-foreground">Recorded at</dt><dd>{new Date(String(passport.created_at)).toLocaleString()}</dd></div>
        </dl>
      )}
    </section>
  )
}

export function CaseBriefPanel({ caseRow }: { caseRow: { raw_complaint: string; escalation_reason: string | null; risk_level: string | null } }) {
  return (
    <section className="rounded-lg border bg-card">
      <header className="border-b px-4 py-3"><h2 className="text-sm font-semibold">Case Brief</h2></header>
      <div className="space-y-2 px-4 py-4 text-sm">
        <p><span className="text-xs text-muted-foreground">Customer issue: </span>{caseRow.raw_complaint}</p>
        <p><span className="text-xs text-muted-foreground">Escalation reason: </span>{caseRow.escalation_reason}</p>
        <p><span className="text-xs text-muted-foreground">Risk level: </span>{caseRow.risk_level ?? 'Not scored'}</p>
        <p className="text-xs text-muted-foreground">Recommended next step: review evidence ledger and decision ledger below, then confirm or reject the proposed action manually.</p>
      </div>
    </section>
  )
}

export function CaseTwinPanel({ twin }: { twin: Record<string, unknown> | null }) {
  return (
    <section className="rounded-lg border bg-card">
      <header className="border-b px-4 py-3"><h2 className="text-sm font-semibold">Case Twin</h2></header>
      {!twin ? (
        <p className="px-4 py-6 text-sm text-muted-foreground">Minimum necessary context appears here after reconstruction.</p>
      ) : (
        <dl className="space-y-2 px-4 py-4 text-sm">
          <div><dt className="text-xs text-muted-foreground">Customer ref</dt><dd>{String(twin.customer_ref)}</dd></div>
          <div><dt className="text-xs text-muted-foreground">Primary intent</dt><dd>{String(twin.primary_intent)}</dd></div>
          <div><dt className="text-xs text-muted-foreground">Domain</dt><dd>{Array.isArray(twin.domain) ? twin.domain.join(', ') : ''}</dd></div>
        </dl>
      )}
    </section>
  )
}
