import { StatusBadge } from '@/components/resolvesphere/StatusBadge'
import { AlertTriangle, Clock, FileText, GitBranch, Database, CheckCircle2 } from 'lucide-react'

export function ContradictionPanel({ sources }: { sources: { system: string; value: string }[] }) {
  return (
    <section className="rounded-xl border border-red-500/30 bg-red-500/5 p-5">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="h-4 w-4 text-red-500" />
        <h2 className="text-sm font-semibold text-red-600 dark:text-red-400">Conflicting Records</h2>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {sources.map((source) => (
          <div key={source.system} className="rounded-lg border border-red-500/20 bg-background/50 p-3">
            <p className="text-xs font-medium text-muted-foreground mb-1">{source.system}</p>
            <p className="text-sm font-medium">{source.value}</p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-sm text-muted-foreground">
        Automatic action is blocked until a specialist confirms the correct state.
      </p>
    </section>
  )
}

export function EvidenceGapPanel({ question }: { question: string }) {
  return (
    <section className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5">
      <div className="flex items-center gap-2 mb-2">
        <Clock className="h-4 w-4 text-amber-500" />
        <h2 className="text-sm font-semibold text-amber-600 dark:text-amber-400">Waiting for Customer</h2>
      </div>
      <p className="text-sm text-muted-foreground">Account records were checked first. One detail is still needed:</p>
      <p className="mt-2 text-sm font-semibold">{question}</p>
    </section>
  )
}

export function CustomerPanel({
  caseRow,
}: {
  caseRow: {
    customer_id: string
    customer_name: string | null
    customer_email: string | null
    reference_id: string | null
  }
}) {
  const rows = [
    { label: 'Account ID', value: caseRow.customer_id, mono: true },
    { label: 'Email', value: caseRow.customer_email, mono: false },
    { label: 'Reference', value: caseRow.reference_id, mono: true },
  ]

  return (
    <section className="rounded-xl border bg-card">
      <header className="flex items-center gap-2 border-b px-4 py-3.5">
        <Database className="h-3.5 w-3.5 text-muted-foreground" />
        <h2 className="text-sm font-semibold">Customer</h2>
      </header>
      <dl className="divide-y">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between px-4 py-2.5 text-sm">
            <dt className="text-muted-foreground">{row.label}</dt>
            <dd className={`max-w-[60%] break-all text-right ${row.mono ? 'font-mono text-xs' : ''}`}>
              {row.value ?? '—'}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

export function ResolutionPassportPanel({
  passport,
}: {
  passport: Record<string, unknown> | null
}) {
  if (!passport) return null

  return (
    <section className="rounded-xl border bg-card">
      <header className="flex items-center gap-2 border-b px-4 py-3.5">
        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
        <h2 className="text-sm font-semibold">Resolution Record</h2>
      </header>
      <dl className="grid gap-4 px-4 py-4 text-sm sm:grid-cols-2">
        <div className="rounded-lg bg-muted/40 p-3">
          <dt className="text-xs font-medium text-muted-foreground mb-1">Reported problem</dt>
          <dd className="font-medium">{String(passport.reported_problem ?? '—')}</dd>
        </div>
        <div className="rounded-lg bg-muted/40 p-3">
          <dt className="text-xs font-medium text-muted-foreground mb-1">Actual problem</dt>
          <dd className="font-medium capitalize">{String(passport.actual_problem ?? '—').replace(/_/g, ' ')}</dd>
        </div>
        <div className="rounded-lg bg-muted/40 p-3">
          <dt className="text-xs font-medium text-muted-foreground mb-1">Policy applied</dt>
          <dd className="font-mono text-xs">{String(passport.policy_id ?? '—')}</dd>
        </div>
        <div className="rounded-lg bg-muted/40 p-3">
          <dt className="text-xs font-medium text-muted-foreground mb-1">Outcome</dt>
          <dd>
            <StatusBadge value={String(passport.final_state ?? 'UNKNOWN')} tone="success" />
          </dd>
        </div>
      </dl>
    </section>
  )
}

export function CaseBriefPanel({
  caseRow,
  evidenceCount,
  decision,
}: {
  caseRow: {
    raw_complaint: string
    escalation_reason: string | null
    risk_level: string | null
    root_cause: string | null
  }
  evidenceCount: number
  decision:
    | {
        policy_id: string
        risk_score: number
        reason_codes?: string[]
      }
    | undefined
}) {
  const reasons: Record<string, string> = {
    MATERIAL_CONTRADICTION: 'Order and billing systems disagree on the refund state, so the true position is unconfirmed.',
    CUSTOMER_STATEMENT_INSUFFICIENT: 'Only the customer statement supports the claim; policy requires a system record before a refund.',
    MANUAL_REVIEW_REQUIRED: 'Available records do not authorise an automatic resolution.',
  }

  return (
    <section className="rounded-xl border bg-card">
      <header className="flex items-center gap-2 border-b px-4 py-3.5">
        <FileText className="h-3.5 w-3.5 text-muted-foreground" />
        <h2 className="text-sm font-semibold">Case Brief for Specialist</h2>
      </header>
      <dl className="divide-y text-sm">
        {[
          { label: 'Customer issue', value: caseRow.raw_complaint },
          { label: 'Root cause analysis', value: caseRow.root_cause ?? 'Not determined.' },
          {
            label: 'Why escalated',
            value: (reasons[caseRow.escalation_reason ?? ''] ?? caseRow.escalation_reason ?? 'Not recorded') +
              (caseRow.escalation_reason ? ` (${caseRow.escalation_reason})` : ''),
          },
          {
            label: 'Evidence gathered',
            value: `${evidenceCount} records reviewed${decision ? `, policy ${decision.policy_id}, risk score ${decision.risk_score}` : ''}`,
          },
          {
            label: 'Recommended next step',
            value: 'Confirm the disputed record with the source system, then approve or reject the proposed action.',
          },
        ].map((item) => (
          <div key={item.label} className="px-4 py-3.5">
            <dt className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{item.label}</dt>
            <dd className="leading-relaxed">{item.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

export function CaseTwinPanel({
  twin,
}: {
  twin: Record<string, unknown> | null
}) {
  if (!twin) {
    return (
      <section className="rounded-xl border bg-card">
        <header className="flex items-center gap-2 border-b px-4 py-3.5">
          <GitBranch className="h-3.5 w-3.5 text-muted-foreground" />
          <h2 className="text-sm font-semibold">Linked Records</h2>
        </header>
        <p className="px-4 py-6 text-sm text-muted-foreground">Case context not built yet.</p>
      </section>
    )
  }

  const context = (twin.context ?? {}) as Record<string, string[]>
  const groups = [
    { label: 'Payments', items: context.relevant_payments ?? [], color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
    { label: 'Orders', items: context.relevant_orders ?? [], color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
    { label: 'Refunds', items: context.relevant_refunds ?? [], color: 'bg-violet-500/10 text-violet-600 dark:text-violet-400' },
  ]

  return (
    <section className="rounded-xl border bg-card">
      <header className="flex items-center gap-2 border-b px-4 py-3.5">
        <GitBranch className="h-3.5 w-3.5 text-muted-foreground" />
        <h2 className="text-sm font-semibold">Linked Records</h2>
      </header>
      <div className="space-y-3 p-4">
        {groups.map((group) => (
          <div key={group.label}>
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">{group.label}</p>
            {group.items.length ? (
              <div className="flex flex-wrap gap-1.5">
                {group.items.map((item) => (
                  <span key={item} className={`rounded-md px-2 py-0.5 font-mono text-xs font-medium ${group.color}`}>
                    {item}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground/60">—</p>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}