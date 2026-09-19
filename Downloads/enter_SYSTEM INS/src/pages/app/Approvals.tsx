import { AppShell } from '@/components/resolvesphere/AppShell'
import { StatusBadge } from '@/components/resolvesphere/StatusBadge'
import { Skeleton } from '@/components/ui/skeleton'
import { useApprovals } from '@/lib/resolvesphereApi'

type ApprovalRow = { approval_id: string; contract_hash: string; action_type: string; target_id: string; amount: number; policy_version: string; risk_score: number; approval_status: string }

const Approvals = () => {
  const { data, isLoading, isError } = useApprovals()
  const approvals = (data?.approvals ?? []) as ApprovalRow[]

  return (
    <AppShell page="approvals" title="Approvals">
      <section className="rounded-lg border bg-card">
        {isLoading && <div className="space-y-2 p-4">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>}
        {isError && <p className="p-4 text-sm text-muted-foreground">Backend function is unreachable.</p>}
        {!isLoading && !isError && approvals.length === 0 && <p className="p-4 text-sm text-muted-foreground">No approvals pending in demo mode.</p>}
        <ul className="divide-y">
          {approvals.map((a) => (
            <li key={a.approval_id} className="grid gap-2 px-4 py-4 text-sm sm:grid-cols-3">
              <div><p className="text-xs text-muted-foreground">Action</p><p>{a.action_type} → {a.target_id}</p></div>
              <div><p className="text-xs text-muted-foreground">Amount / risk</p><p>{a.amount} (risk {a.risk_score})</p></div>
              <div><p className="text-xs text-muted-foreground">Contract hash</p><p className="truncate font-mono text-xs">{a.contract_hash}</p></div>
              <div className="sm:col-span-3"><StatusBadge value={a.approval_status} tone={a.approval_status === 'PENDING' ? 'warning' : a.approval_status === 'GRANTED' ? 'success' : 'danger'} /></div>
            </li>
          ))}
        </ul>
      </section>
    </AppShell>
  )
}

export default Approvals
