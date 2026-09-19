import { StatusBadge } from '@/components/resolvesphere/StatusBadge'
import { Zap, ShieldCheck, CheckCircle2, XCircle, Clock } from 'lucide-react'

type ActionRow = {
  action_id: string
  action_type: string
  target_id: string
  status: string
  idempotency_key: string
  retry_count: number
  error_code: string | null
  simulated: boolean
}

type VerificationRow = {
  verification_id: string
  result: string
  expected_postconditions: string[]
  observed_state: Record<string, unknown>
  predicate_results: Record<string, boolean>
  verified_at: string
  failure_reason: string | null
}

export function ActionExecutionPanel({ actions }: { actions: ActionRow[] }) {
  return (
    <section className="rounded-xl border bg-card">
      <header className="flex items-center gap-2 border-b px-4 py-3.5">
        <Zap className="h-3.5 w-3.5 text-muted-foreground" />
        <h2 className="text-sm font-semibold">Action Execution</h2>
        {actions.length > 0 && (
          <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
            {actions.length}
          </span>
        )}
      </header>

      {actions.length === 0 ? (
        <p className="px-4 py-6 text-sm text-muted-foreground">No authorized action yet.</p>
      ) : (
        <ul className="divide-y">
          {actions.map((action) => (
            <li key={action.action_id} className="space-y-2 px-4 py-4 text-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-xs font-medium">{action.action_type}</span>
                  <span className="text-xs text-muted-foreground">→</span>
                  <span className="font-mono text-xs font-medium text-primary">{action.target_id}</span>
                </div>
                <StatusBadge
                  value={action.status}
                  tone={action.status === 'COMPLETED' ? 'success' : action.status === 'FAILED' ? 'danger' : 'warning'}
                />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div>
                  <span className="font-medium">Idempotency key</span>
                  <p className="font-mono truncate">{action.idempotency_key}</p>
                </div>
                <div>
                  <span className="font-medium">Retry count</span>
                  <p>{action.retry_count}{action.error_code ? ` — ${action.error_code}` : ''}</p>
                </div>
              </div>

              {action.simulated && <StatusBadge value="SIMULATED" tone="warning" />}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export function VerificationPanel({ verifications }: { verifications: VerificationRow[] }) {
  const latest = verifications[verifications.length - 1]

  const resultConfig = {
    VERIFIED: { label: 'Verification Success', tone: 'success' as const, Icon: CheckCircle2, color: 'text-emerald-500' },
    FAILED: { label: 'Verification Failed', tone: 'danger' as const, Icon: XCircle, color: 'text-red-500' },
    TIMEOUT: { label: 'Verification Timeout', tone: 'warning' as const, Icon: Clock, color: 'text-amber-500' },
  }

  const config = latest ? (resultConfig[latest.result as keyof typeof resultConfig] ?? { label: 'Verification Pending', tone: 'neutral' as const, Icon: Clock, color: 'text-muted-foreground' }) : null

  return (
    <section className="rounded-xl border bg-card">
      <header className="flex items-center gap-2 border-b px-4 py-3.5">
        <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground" />
        <h2 className="text-sm font-semibold">Verification</h2>
      </header>

      {!latest ? (
        <p className="px-4 py-6 text-sm text-muted-foreground">Waiting for backend verification...</p>
      ) : (
        <div className="space-y-4 px-4 py-4 text-sm">
          {config && (
            <div className="flex items-center gap-2">
              <config.Icon className={`h-4 w-4 ${config.color}`} />
              <StatusBadge value={config.label} tone={config.tone} />
            </div>
          )}

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Expected Postconditions</p>
            <ul className="space-y-1">
              {latest.expected_postconditions.map((condition) => (
                <li key={condition} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />
                  {condition}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Predicate Checklist</p>
            <ul className="space-y-1.5">
              {Object.entries(latest.predicate_results).map(([key, value]) => (
                <li key={key} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{key}</span>
                  {value
                    ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    : <XCircle className="h-3.5 w-3.5 text-red-500" />
                  }
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-lg bg-muted/40 px-3 py-2.5">
            <p className="text-xs font-medium">
              {latest.result === 'VERIFIED'
                ? '✓ Backend state verified.'
                : latest.failure_reason
                  ? latest.failure_reason
                  : 'Execution completed is not the same as backend verified.'}
            </p>
            <p className="mt-0.5 text-[10px] text-muted-foreground">
              Verified at {new Date(latest.verified_at).toLocaleString()}
            </p>
          </div>
        </div>
      )}
    </section>
  )
}