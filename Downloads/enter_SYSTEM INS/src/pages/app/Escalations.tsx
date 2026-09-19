import { Link } from 'react-router-dom'
import { AppShell } from '@/components/resolvesphere/AppShell'
import { CustomerAvatar } from '@/components/resolvesphere/CustomerAvatar'
import { Skeleton } from '@/components/ui/skeleton'
import { useCaseList } from '@/lib/resolvesphereApi'
import type { CaseRow } from '@/pages/app/CommandCenter'
import { AlertTriangle, ExternalLink } from 'lucide-react'

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
      <section className="card-elevated rounded-xl border bg-card">
        {isLoading && (
          <div className="space-y-3 p-5">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
          </div>
        )}
        {isError && (
          <div className="flex flex-col items-center py-10 text-center">
            <AlertTriangle className="mb-2 h-6 w-6 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Escalations could not be loaded. Try again shortly.</p>
          </div>
        )}
        {!isLoading && !isError && escalated.length === 0 && (
          <div className="flex flex-col items-center py-16 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10">
              <AlertTriangle className="h-6 w-6 text-emerald-500" />
            </div>
            <p className="font-medium">No escalations pending</p>
            <p className="mt-1 text-sm text-muted-foreground">All cases are within automated handling capacity.</p>
          </div>
        )}
        {escalated.length > 0 && (
          <ul className="divide-y">
            {escalated.map((c) => (
              <li key={c.case_id} className="px-5 py-5 transition-smooth hover:bg-muted/30">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="flex items-center gap-3">
                    <CustomerAvatar id={c.customer_id} name={c.customer_name} size="md" />
                    <div>
                      <div className="flex items-center gap-2">
                        <Link to={`/app/cases/${c.case_id}`} className="font-mono text-xs font-semibold text-primary hover:underline">
                          {c.case_id}
                        </Link>
                        <span className="text-sm font-medium">{c.customer_name ?? c.customer_id}</span>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">{c.assigned_agent ?? 'Unassigned'}</p>
                    </div>
                  </span>
                </div>

                <div className="mt-3 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2.5">
                  <p className="text-sm font-medium text-red-600 dark:text-red-400">
                    {reasons[c.escalation_reason ?? ''] ?? c.escalation_reason}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{c.raw_complaint}</p>
                </div>

                <Link
                  to={`/app/cases/${c.case_id}`}
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                >
                  <ExternalLink className="h-3 w-3" />
                  Review case brief before acting
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AppShell>
  )
}

export default Escalations
