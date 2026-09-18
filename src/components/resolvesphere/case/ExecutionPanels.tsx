import { StatusBadge } from '@/components/resolvesphere/StatusBadge'

type ActionRow = { action_id: string; action_type: string; target_id: string; status: string; idempotency_key: string; retry_count: number; error_code: string | null; simulated: boolean }
type VerificationRow = { verification_id: string; result: string; expected_postconditions: string[]; observed_state: Record<string, unknown>; predicate_results: Record<string, boolean>; verified_at: string; failure_reason: string | null }

export function ActionExecutionPanel({ actions }: { actions: ActionRow[] }) {
  return (
    <section className="rounded-lg border bg-card">
      <header className="border-b px-4 py-3"><h2 className="text-sm font-semibold">Action Execution</h2></header>
      {actions.length === 0 ? (
        <p className="px-4 py-6 text-sm text-muted-foreground">No authorized action.</p>
      ) : (
        <ul className="divide-y">
          {actions.map((a) => (
            <li key={a.action_id} className="space-y-1 px-4 py-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium">{a.action_type} → {a.target_id}</span>
                <StatusBadge value={a.status} tone={a.status === 'COMPLETED' ? 'success' : a.status === 'FAILED' ? 'danger' : 'warning'} />
              </div>
              <p className="text-xs text-muted-foreground">Idempotency key: {a.idempotency_key}</p>
              <p className="text-xs text-muted-foreground">Retry count: {a.retry_count}{a.error_code ? ` — Error: ${a.error_code}` : ''}</p>
              {a.simulated && <StatusBadge value="SIMULATED" tone="warning" />}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export function VerificationPanel({ verifications }: { verifications: VerificationRow[] }) {
  const latest = verifications[verifications.length - 1]
  return (
    <section className="rounded-lg border bg-card">
      <header className="border-b px-4 py-3"><h2 className="text-sm font-semibold">Verification</h2></header>
      {!latest ? (
        <p className="px-4 py-6 text-sm text-muted-foreground">Waiting for backend verification...</p>
      ) : (
        <div className="space-y-3 px-4 py-4 text-sm">
          <StatusBadge value={`Verification ${latest.result === 'VERIFIED' ? 'Success' : latest.result === 'FAILED' ? 'Failed' : latest.result === 'TIMEOUT' ? 'Timeout' : 'Pending'}`} tone={latest.result === 'VERIFIED' ? 'success' : latest.result === 'FAILED' ? 'danger' : 'warning'} />
          <div>
            <p className="text-xs font-medium text-muted-foreground">Expected postconditions</p>
            <ul className="mt-1 list-disc pl-5 text-xs text-muted-foreground">
              {latest.expected_postconditions.map((p) => <li key={p}>{p}</li>)}
            </ul>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Predicate checklist</p>
            <ul className="mt-1 space-y-1">
              {Object.entries(latest.predicate_results).map(([key, value]) => (
                <li key={key} className="flex items-center justify-between text-xs"><span>{key}</span><StatusBadge value={value ? 'true' : 'false'} tone={value ? 'success' : 'danger'} /></li>
              ))}
            </ul>
          </div>
          <p className="text-xs text-muted-foreground">Verified at {new Date(latest.verified_at).toLocaleString()}</p>
          <p className="text-xs font-medium">{latest.result === 'VERIFIED' ? 'Backend state verified.' : 'Execution completed is not the same as backend verified.'}</p>
        </div>
      )}
    </section>
  )
}
