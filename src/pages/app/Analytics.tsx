import { AppShell } from '@/components/resolvesphere/AppShell'
import { Skeleton } from '@/components/ui/skeleton'
import { CustomerAvatar } from '@/components/resolvesphere/CustomerAvatar'
import { useCxAnalytics, useRadar } from '@/lib/resolvesphereApi'

const Analytics = () => {
  const { data: cx, isLoading: cxLoading } = useCxAnalytics()
  const { data: radar, isLoading: radarLoading } = useRadar()
  const stats = cx?.result
  const pattern = radar?.result

  return (
    <AppShell page="radar" title="Analytics" subtitle="Recurring issues, friction signals, and systemic patterns">
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Total cases', value: stats?.total_cases },
            { label: 'Escalated', value: stats?.escalated },
            { label: 'Reopened', value: stats?.reopened },
            { label: 'Historical failures', value: stats?.historical_pattern_count },
          ].map((item) => (
            <div key={item.label} className="rounded-lg border bg-card p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{item.label}</p>
              <p className="mt-1 text-2xl font-semibold">{cxLoading ? <Skeleton className="h-7 w-10" /> : item.value ?? 0}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-lg border bg-card">
            <header className="border-b px-4 py-3"><h2 className="text-sm font-semibold">Recurring issues</h2></header>
            {!stats?.recurring_issues?.length ? (
              <p className="px-4 py-6 text-sm text-muted-foreground">No recurring issues detected in the available data.</p>
            ) : (
              <ul className="divide-y">
                {stats.recurring_issues.map((r) => (
                  <li key={r.intent} className="flex items-center justify-between px-4 py-2 text-sm">
                    <span>{r.intent.replace(/_/g, ' ')}</span>
                    <span className="font-medium">{r.count}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-lg border bg-card">
            <header className="border-b px-4 py-3"><h2 className="text-sm font-semibold">Customers with repeated friction</h2></header>
            {!stats?.friction_customers?.length ? (
              <p className="px-4 py-6 text-sm text-muted-foreground">No repeated friction detected.</p>
            ) : (
              <ul className="divide-y">
                {stats.friction_customers.map((c) => (
                  <li key={c.customer_id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                    <span className="flex items-center gap-2">
                      <CustomerAvatar id={c.customer_id} name={c.name} size="sm" />
                      <span>{c.name ?? c.customer_id}</span>
                    </span>
                    <span className="text-xs text-muted-foreground">{c.escalations} escalated · {c.reopens} reopened</span>
                  </li>
                ))}
              </ul>
            )}
            {Boolean(stats?.friction_customers?.length) && (
              <p className="border-t px-4 py-3 text-xs text-muted-foreground">Potential risk signal detected based on repeated unresolved friction.</p>
            )}
          </section>
        </div>

        <section className="rounded-lg border bg-card">
          <header className="border-b px-4 py-3"><h2 className="text-sm font-semibold">Systemic pattern</h2></header>
          {radarLoading ? (
            <div className="space-y-2 p-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : !pattern?.incident_candidate ? (
            <p className="px-4 py-6 text-sm text-muted-foreground">No systemic patterns detected in the available data.</p>
          ) : (
            <dl className="divide-y">
              <div className="px-4 py-3">
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Fact</dt>
                {pattern.fact.map((f) => (
                  <dd key={f.error_code} className="mt-1 text-sm">{f.count} cases of {f.problem_pattern.replace(/_/g, ' ')} ({f.error_code})</dd>
                ))}
              </div>
              <div className="px-4 py-3">
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Correlation</dt>
                <dd className="mt-1 text-sm">Failures cluster around the order-service deployment event EVT-501.</dd>
              </div>
              <div className="px-4 py-3">
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Hypothesis</dt>
                <dd className="mt-1 text-sm">{pattern.hypothesis?.statement}</dd>
              </div>
              <div className="px-4 py-3">
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Recommendation</dt>
                <dd className="mt-1 text-sm">{pattern.recommendation?.action}</dd>
              </div>
            </dl>
          )}
        </section>
      </div>
    </AppShell>
  )
}

export default Analytics
