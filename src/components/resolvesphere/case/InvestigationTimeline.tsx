import { ArrowRight } from 'lucide-react'

type EventRow = { event_id: string; event_type: string; created_at: string; payload: Record<string, unknown> }

const readable: Record<string, string> = {
  CASE_CREATED: 'Case opened',
  INTENT_CLASSIFIED: 'Request understood and categorised',
  DOMAIN_ROUTED: 'Assigned to specialist',
  CONTEXT_RECONSTRUCTED: 'Customer context reconstructed',
  INVESTIGATION_STARTED: 'Investigation started',
  EVIDENCE_RETRIEVED: 'Account records retrieved',
  KNOWLEDGE_RETRIEVED: 'Applicable policies retrieved',
  EVIDENCE_GAP_FOUND: 'Missing information identified',
  QUESTION_ASKED: 'Question sent to customer',
  ANSWER_RECEIVED: 'Customer answer recorded',
  CONTRADICTION_DETECTED: 'Conflicting records detected',
  RESOLUTION_PROPOSED: 'Resolution proposed',
  POLICY_CHECKED: 'Policy checked',
  RISK_ASSESSED: 'Risk assessed',
  ACTION_AUTHORIZED: 'Action authorised',
  ACTION_STARTED: 'Action started',
  ACTION_COMPLETED: 'Action completed',
  VERIFICATION_STARTED: 'Verifying result in source systems',
  VERIFICATION_SUCCESS: 'Result verified',
  VERIFICATION_FAILED: 'Verification failed',
  CASE_REOPENED: 'Case reopened',
  ESCALATED_TO_HUMAN: 'Handed to a human specialist',
  CASE_RESOLVED: 'Case resolved',
  CUSTOMER_RESPONSE_GENERATED: 'Customer reply drafted',
}

export function InvestigationTimeline({ events }: { events: EventRow[] }) {
  const steps = events.filter((e) => e.event_type !== 'AGENT_HANDOFF')
  return (
    <section className="rounded-lg border bg-card">
      <header className="border-b px-4 py-3"><h2 className="text-sm font-semibold">Investigation timeline</h2></header>
      {steps.length === 0 ? (
        <p className="px-4 py-6 text-sm text-muted-foreground">No activity recorded yet.</p>
      ) : (
        <ol className="divide-y">
          {steps.map((event) => (
            <li key={event.event_id} className="flex items-start justify-between gap-4 px-4 py-2.5 text-sm">
              <span>{readable[event.event_type] ?? event.event_type.replace(/_/g, ' ').toLowerCase()}</span>
              <span className="shrink-0 text-xs text-muted-foreground">{new Date(event.created_at).toLocaleTimeString()}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}

export function AgentActivity({ events }: { events: EventRow[] }) {
  const handoffs = events.filter((e) => e.event_type === 'AGENT_HANDOFF')
  return (
    <section className="rounded-lg border bg-card">
      <header className="border-b px-4 py-3"><h2 className="text-sm font-semibold">Agent activity</h2></header>
      {handoffs.length === 0 ? (
        <p className="px-4 py-6 text-sm text-muted-foreground">No agent handoffs recorded yet.</p>
      ) : (
        <ol className="divide-y">
          {handoffs.map((event) => (
            <li key={event.event_id} className="px-4 py-3 text-sm">
              <p className="flex flex-wrap items-center gap-2 font-medium">
                {String(event.payload.from)}
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                {String(event.payload.to)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{String(event.payload.message)}</p>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}

export function RoutingPanel({ caseRow }: { caseRow: { primary_intent: string | null; category: string | null; urgency: string; sentiment: string; assigned_agent: string | null } }) {
  const rows = [
    { label: 'Intent', value: caseRow.primary_intent?.replace(/_/g, ' ') },
    { label: 'Category', value: caseRow.category },
    { label: 'Priority', value: caseRow.urgency },
    { label: 'Tone', value: caseRow.sentiment },
    { label: 'Assigned to', value: caseRow.assigned_agent },
  ]
  return (
    <section className="rounded-lg border bg-card">
      <header className="border-b px-4 py-3"><h2 className="text-sm font-semibold">Routing</h2></header>
      <dl className="divide-y">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between px-4 py-2 text-sm">
            <dt className="text-muted-foreground">{row.label}</dt>
            <dd className="text-right">{row.value ?? 'Not determined yet'}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

export function CustomerReplyPanel({ response }: { response: string | null }) {
  return (
    <section className="rounded-lg border bg-card">
      <header className="border-b px-4 py-3"><h2 className="text-sm font-semibold">Reply to customer</h2></header>
      {!response ? (
        <p className="px-4 py-6 text-sm text-muted-foreground">No reply drafted yet.</p>
      ) : (
        <p className="px-4 py-4 text-sm leading-relaxed">{response}</p>
      )}
    </section>
  )
}

export function DecisionChecks({ decision }: { decision: { policy_id: string; risk_score: number; auth_state: string; reason_codes?: string[]; risk_factors?: { gaps?: string[] } } | undefined }) {
  if (!decision) {
    return (
      <section className="rounded-lg border bg-card">
        <header className="border-b px-4 py-3"><h2 className="text-sm font-semibold">Decision</h2></header>
        <p className="px-4 py-6 text-sm text-muted-foreground">No decision recorded yet.</p>
      </section>
    )
  }
  const outcome: Record<string, string> = {
    AUTO_ALLOWED: 'Approved for automatic resolution',
    HUMAN_APPROVAL_REQUIRED: 'Requires manager approval',
    ESCALATE: 'Blocked, sent to a human specialist',
    ASK_CUSTOMER: 'More information needed from customer',
    BLOCKED: 'Blocked',
  }
  return (
    <section className="rounded-lg border bg-card">
      <header className="border-b px-4 py-3"><h2 className="text-sm font-semibold">Decision</h2></header>
      <dl className="divide-y">
        <div className="flex items-center justify-between px-4 py-2 text-sm"><dt className="text-muted-foreground">Outcome</dt><dd>{outcome[decision.auth_state] ?? decision.auth_state}</dd></div>
        <div className="flex items-center justify-between px-4 py-2 text-sm"><dt className="text-muted-foreground">Policy applied</dt><dd>{decision.policy_id}</dd></div>
        <div className="flex items-center justify-between px-4 py-2 text-sm"><dt className="text-muted-foreground">Risk score</dt><dd>{decision.risk_score}</dd></div>
        {Boolean(decision.reason_codes?.length) && (
          <div className="px-4 py-2 text-sm"><dt className="text-muted-foreground">Reasons</dt><dd className="mt-1">{decision.reason_codes!.map((r) => r.replace(/_/g, ' ').toLowerCase()).join(', ')}</dd></div>
        )}
      </dl>
    </section>
  )
}
