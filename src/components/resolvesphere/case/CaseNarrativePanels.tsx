import { StatusBadge } from '@/components/resolvesphere/StatusBadge'

export function ContradictionPanel({ sources }: { sources: { system: string; value: string }[] }) {
  return (
    <section className="rounded-lg border border-destructive/50 bg-destructive/5 p-4">
      <h2 className="text-sm font-semibold text-destructive">Conflicting records</h2>
      <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
        {sources.map((s) => (
          <div key={s.system}><dt className="text-xs text-muted-foreground">{s.system}</dt><dd>{s.value}</dd></div>
        ))}
      </dl>
      <p className="mt-3 text-sm">Automatic action is blocked until a specialist confirms the correct state.</p>
    </section>
  )
}

export function EvidenceGapPanel({ question }: { question: string }) {
  return (
    <section className="rounded-lg border border-warning/50 bg-warning/5 p-4">
      <h2 className="text-sm font-semibold text-warning">Waiting for the customer</h2>
      <p className="mt-2 text-sm">Account records were checked first. One detail is still needed:</p>
      <p className="mt-1 text-sm font-medium">{question}</p>
    </section>
  )
}

export function CustomerPanel({ caseRow }: { caseRow: { customer_id: string; customer_name: string | null; customer_email: string | null; reference_id: string | null } }) {
  const rows = [
    { label: 'Account', value: caseRow.customer_id },
    { label: 'Email', value: caseRow.customer_email },
    { label: 'Reference', value: caseRow.reference_id },
  ]
  return (
    <section className="rounded-lg border bg-card">
      <header className="border-b px-4 py-3"><h2 className="text-sm font-semibold">Customer</h2></header>
      <dl className="divide-y">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between px-4 py-2 text-sm">
            <dt className="text-muted-foreground">{row.label}</dt>
            <dd className="text-right">{row.value ?? '—'}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

export function ResolutionPassportPanel({ passport }: { passport: Record<string, unknown> | null }) {
  if (!passport) return null
  return (
    <section className="rounded-lg border bg-card">
      <header className="border-b px-4 py-3"><h2 className="text-sm font-semibold">Resolution record</h2></header>
      <dl className="grid gap-3 px-4 py-4 text-sm sm:grid-cols-2">
        <div><dt className="text-xs text-muted-foreground">Reported problem</dt><dd>{String(passport.reported_problem)}</dd></div>
        <div><dt className="text-xs text-muted-foreground">Actual problem</dt><dd>{String(passport.actual_problem).replace(/_/g, ' ')}</dd></div>
        <div><dt className="text-xs text-muted-foreground">Policy</dt><dd>{String(passport.policy_id)}</dd></div>
        <div><dt className="text-xs text-muted-foreground">Outcome</dt><dd><StatusBadge value={String(passport.final_state)} tone="success" /></dd></div>
      </dl>
    </section>
  )
}

export function CaseBriefPanel({ caseRow, evidenceCount, decision }: { caseRow: { raw_complaint: string; escalation_reason: string | null; risk_level: string | null; root_cause: string | null }; evidenceCount: number; decision: { policy_id: string; risk_score: number; reason_codes?: string[] } | undefined }) {
  const reasons: Record<string, string> = {
    MATERIAL_CONTRADICTION: 'Order and billing systems disagree on the refund state, so the true position is unconfirmed.',
    CUSTOMER_STATEMENT_INSUFFICIENT: 'Only the customer statement supports the claim; policy requires a system record before a refund.',
    MANUAL_REVIEW_REQUIRED: 'Available records do not authorise an automatic resolution.',
  }
  return (
    <section className="rounded-lg border bg-card">
      <header className="border-b px-4 py-3"><h2 className="text-sm font-semibold">Case brief for the specialist</h2></header>
      <dl className="divide-y text-sm">
        <div className="px-4 py-3"><dt className="text-xs text-muted-foreground">Customer issue</dt><dd className="mt-1">{caseRow.raw_complaint}</dd></div>
        <div className="px-4 py-3"><dt className="text-xs text-muted-foreground">Root cause analysis</dt><dd className="mt-1">{caseRow.root_cause ?? 'Not determined.'}</dd></div>
        <div className="px-4 py-3"><dt className="text-xs text-muted-foreground">Why it was escalated</dt><dd className="mt-1">{reasons[caseRow.escalation_reason ?? ''] ?? caseRow.escalation_reason ?? 'Not recorded'} <span className="text-xs text-muted-foreground">({caseRow.escalation_reason})</span></dd></div>
        <div className="px-4 py-3"><dt className="text-xs text-muted-foreground">Evidence gathered</dt><dd className="mt-1">{evidenceCount} records reviewed{decision ? `, policy ${decision.policy_id}, risk score ${decision.risk_score}` : ''}</dd></div>
        <div className="px-4 py-3"><dt className="text-xs text-muted-foreground">Recommended next step</dt><dd className="mt-1">Confirm the disputed record with the source system, then approve or reject the proposed action.</dd></div>
      </dl>
    </section>
  )
}

export function CaseTwinPanel({ twin }: { twin: Record<string, unknown> | null }) {
  if (!twin) {
    return (
      <section className="rounded-lg border bg-card">
        <header className="border-b px-4 py-3"><h2 className="text-sm font-semibold">Linked records</h2></header>
        <p className="px-4 py-6 text-sm text-muted-foreground">Case context not built yet.</p>
      </section>
    )
  }
  const context = (twin.context ?? {}) as Record<string, string[]>
  const groups = [
    { label: 'Payments', items: context.relevant_payments ?? [] },
    { label: 'Orders', items: context.relevant_orders ?? [] },
    { label: 'Refunds', items: context.relevant_refunds ?? [] },
  ]
  return (
    <section className="rounded-lg border bg-card">
      <header className="border-b px-4 py-3"><h2 className="text-sm font-semibold">Linked records</h2></header>
      <dl className="divide-y">
        {groups.map((group) => (
          <div key={group.label} className="flex items-start justify-between px-4 py-2 text-sm">
            <dt className="text-muted-foreground">{group.label}</dt>
            <dd className="text-right">{group.items.length ? group.items.join(', ') : '—'}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
