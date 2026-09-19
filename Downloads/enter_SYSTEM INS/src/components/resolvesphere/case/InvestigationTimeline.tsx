import { ArrowRight, Activity, GitBranch, MessageSquare } from 'lucide-react'

type EventRow = {
  event_id: string
  event_type: string
  created_at: string
  payload: Record<string, unknown>
}

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
  APPROVAL_REQUESTED: 'Approval requested',
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

const eventDot: Record<string, string> = {
  CASE_CREATED: 'bg-blue-400',
  CASE_RESOLVED: 'bg-emerald-400',
  ESCALATED_TO_HUMAN: 'bg-red-400',
  CONTRADICTION_DETECTED: 'bg-red-400',
  EVIDENCE_GAP_FOUND: 'bg-amber-400',
  QUESTION_ASKED: 'bg-amber-400',
  ACTION_COMPLETED: 'bg-emerald-400',
  VERIFICATION_SUCCESS: 'bg-emerald-400',
  VERIFICATION_FAILED: 'bg-red-400',
}

export function InvestigationTimeline({ events }: { events: EventRow[] }) {
  const steps = events.filter((event) => event.event_type !== 'AGENT_HANDOFF')

  return (
    <section className="rounded-xl border bg-card">
      <header className="flex items-center gap-2 border-b px-4 py-3.5">
        <Activity className="h-3.5 w-3.5 text-muted-foreground" />
        <h2 className="text-sm font-semibold">Investigation Timeline</h2>
        {steps.length > 0 && (
          <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
            {steps.length} events
          </span>
        )}
      </header>

      {steps.length === 0 ? (
        <p className="px-4 py-6 text-sm text-muted-foreground">No activity recorded yet.</p>
      ) : (
        <ol className="relative px-4 py-4">
          {/* Timeline line */}
          <div className="absolute left-[1.625rem] top-4 bottom-4 w-px bg-border" />
          <div className="space-y-3">
            {steps.map((event) => (
              <li key={event.event_id} className="relative flex items-start gap-3 text-sm">
                <span
                  className={`relative z-10 mt-1 h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-background ${eventDot[event.event_type] ?? 'bg-muted-foreground/40'}`}
                />
                <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
                  <span className="leading-relaxed">
                    {readable[event.event_type] ?? event.event_type.replace(/_/g, ' ').toLowerCase()}
                  </span>
                  <span className="shrink-0 font-mono text-[10px] text-muted-foreground/70">
                    {new Date(event.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
              </li>
            ))}
          </div>
        </ol>
      )}
    </section>
  )
}

export function AgentActivity({ events }: { events: EventRow[] }) {
  const handoffs = events.filter((event) => event.event_type === 'AGENT_HANDOFF')

  return (
    <section className="rounded-xl border bg-card">
      <header className="flex items-center gap-2 border-b px-4 py-3.5">
        <GitBranch className="h-3.5 w-3.5 text-muted-foreground" />
        <h2 className="text-sm font-semibold">Agent Activity</h2>
        {handoffs.length > 0 && (
          <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
            {handoffs.length} handoffs
          </span>
        )}
      </header>

      {handoffs.length === 0 ? (
        <p className="px-4 py-6 text-sm text-muted-foreground">No agent handoffs recorded yet.</p>
      ) : (
        <ol className="divide-y">
          {handoffs.map((event) => (
            <li key={event.event_id} className="px-4 py-3.5 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-muted px-2 py-0.5 font-medium text-xs">{String(event.payload.from ?? 'Unknown')}</span>
                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="rounded-md bg-primary/10 px-2 py-0.5 font-medium text-xs text-primary">{String(event.payload.to ?? 'Unknown')}</span>
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">{String(event.payload.message ?? '')}</p>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}

export function RoutingPanel({
  caseRow,
}: {
  caseRow: {
    primary_intent: string | null
    category: string | null
    urgency: string
    sentiment: string
    assigned_agent: string | null
  }
}) {
  const rows = [
    { label: 'Intent', value: caseRow.primary_intent?.replace(/_/g, ' ') },
    { label: 'Category', value: caseRow.category },
    { label: 'Priority', value: caseRow.urgency },
    { label: 'Tone', value: caseRow.sentiment },
    { label: 'Assigned to', value: caseRow.assigned_agent },
  ]

  const urgencyColor = caseRow.urgency === 'HIGH' ? 'text-red-500' :
    caseRow.urgency === 'MEDIUM' ? 'text-amber-500' : 'text-muted-foreground'

  return (
    <section className="rounded-xl border bg-card">
      <header className="flex items-center gap-2 border-b px-4 py-3.5">
        <Activity className="h-3.5 w-3.5 text-muted-foreground" />
        <h2 className="text-sm font-semibold">Routing</h2>
      </header>
      <dl className="divide-y">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-4 px-4 py-2.5 text-sm">
            <dt className="text-muted-foreground">{row.label}</dt>
            <dd className={`text-right font-medium ${row.label === 'Priority' ? urgencyColor : ''}`}>
              {row.value ?? <span className="text-muted-foreground/50 font-normal text-xs">Not determined yet</span>}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

export function CustomerReplyPanel({ response }: { response: string | null }) {
  return (
    <section className="rounded-xl border bg-card">
      <header className="flex items-center gap-2 border-b px-4 py-3.5">
        <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
        <h2 className="text-sm font-semibold">Reply to Customer</h2>
      </header>
      {!response ? (
        <p className="px-4 py-6 text-sm text-muted-foreground">No reply drafted yet.</p>
      ) : (
        <div className="px-4 py-4">
          <div className="rounded-lg border bg-muted/40 p-4 text-sm leading-relaxed">
            {response}
          </div>
        </div>
      )}
    </section>
  )
}

export function DecisionChecks({
  decision,
}: {
  decision:
    | {
        policy_id: string
        risk_score: number
        auth_state: string
        reason_codes?: string[]
        risk_factors?: {
          gaps?: string[]
        }
      }
    | undefined
}) {
  if (!decision) {
    return (
      <section className="rounded-xl border bg-card">
        <header className="flex items-center gap-2 border-b px-4 py-3.5">
          <Activity className="h-3.5 w-3.5 text-muted-foreground" />
          <h2 className="text-sm font-semibold">Decision</h2>
        </header>
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

  const riskColor = decision.risk_score >= 70 ? 'text-red-500' :
    decision.risk_score >= 40 ? 'text-amber-500' : 'text-emerald-500'

  return (
    <section className="rounded-xl border bg-card">
      <header className="flex items-center gap-2 border-b px-4 py-3.5">
        <Activity className="h-3.5 w-3.5 text-muted-foreground" />
        <h2 className="text-sm font-semibold">Decision</h2>
      </header>
      <dl className="divide-y">
        <div className="flex items-center justify-between gap-4 px-4 py-2.5 text-sm">
          <dt className="text-muted-foreground">Outcome</dt>
          <dd className="text-right font-medium">{outcome[decision.auth_state] ?? decision.auth_state}</dd>
        </div>
        <div className="flex items-center justify-between gap-4 px-4 py-2.5 text-sm">
          <dt className="text-muted-foreground">Policy applied</dt>
          <dd className="font-mono text-xs">{decision.policy_id}</dd>
        </div>
        <div className="flex items-center justify-between gap-4 px-4 py-2.5 text-sm">
          <dt className="text-muted-foreground">Risk score</dt>
          <dd className={`font-bold ${riskColor}`}>{decision.risk_score}</dd>
        </div>
        {Boolean(decision.reason_codes?.length) && (
          <div className="px-4 py-2.5 text-sm">
            <dt className="text-muted-foreground mb-1.5">Reasons</dt>
            <dd className="flex flex-wrap gap-1.5">
              {decision.reason_codes!.map((reason) => (
                <span key={reason} className="rounded-md bg-muted px-2 py-0.5 text-xs capitalize">
                  {reason.replace(/_/g, ' ').toLowerCase()}
                </span>
              ))}
            </dd>
          </div>
        )}
      </dl>
    </section>
  )
}