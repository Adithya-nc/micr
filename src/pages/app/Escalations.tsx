import { Link } from 'react-router-dom'
import { AppShell } from '@/components/resolvesphere/AppShell'
import { CustomerAvatar } from '@/components/resolvesphere/CustomerAvatar'
import { Skeleton } from '@/components/ui/skeleton'
import { useCaseList } from '@/lib/resolvesphereApi'
import type { CaseRow } from '@/pages/app/CommandCenter'

const reasons: Record<string, string> = {
  MATERIAL_CONTRADICTION: 'Order and billing systems disagree on the refund state',
  CUSTOMER_STATEMENT_INSUFFICIENT: 'Policy requires a system record, not only the customer statement',
  MANUAL_REVIEW_REQUIRED: 'Records do not authorise an automatic resolution',
}

const Escalations = () => {
  const { data, isLoading, isError } = useCaseList()
  const escalated = ((data?.cases ?? []) as CaseRow[]).filter((c) => c.status === 'ESCALATED')

  return (
    <AppShell page="escalations" title="Escalations" subtitle="Cases that need a human decision">
      <section className="rounded-lg border bg-card">
        {isLoading && <div className="space-y-2 p-4">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>}
        {isError && <p className="p-4 text-sm text-muted-foreground">Escalations could not be loaded. Try again shortly.</p>}
        {!isLoading && !isError && escalated.length === 0 && <p className="p-4 text-sm text-muted-foreground">No escalations pending.</p>}
        <ul className="divide-y">
          {escalated.map((c) => (
            <li key={c.case_id} className="px-4 py-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  <CustomerAvatar id={c.customer_id} name={c.customer_name} size="sm" />
                  <Link to={`/app/cases/${c.case_id}`} className="text-sm font-medium text-primary underline">{c.case_id}</Link>
                  <span className="text-sm text-muted-foreground">{c.customer_name ?? c.customer_id}</span>
                </span>
                <span className="text-xs text-muted-foreground">{c.assigned_agent}</span>
              </div>
              <p className="mt-2 text-sm">{reasons[c.escalation_reason ?? ''] ?? c.escalation_reason}</p>
              <p className="mt-1 text-xs text-muted-foreground">{c.raw_complaint}</p>
              <Link to={`/app/cases/${c.case_id}`} className="mt-2 inline-block text-xs font-medium text-primary underline">Review case brief before acting</Link>
            </li>
          ))}
        </ul>
      </section>
    </AppShell>
  )
}

export default Escalations
