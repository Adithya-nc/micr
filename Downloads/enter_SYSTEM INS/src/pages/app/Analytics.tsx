import { AppShell } from '@/components/resolvesphere/AppShell'
import { Skeleton } from '@/components/ui/skeleton'
import { CustomerAvatar } from '@/components/resolvesphere/CustomerAvatar'
import { useCxAnalytics, useRadar } from '@/lib/resolvesphereApi'
import { TrendingUp, Users, RefreshCw, Activity, AlertCircle, Lightbulb } from 'lucide-react'

const Analytics = () => {
  const { data: cx, isLoading: cxLoading } = useCxAnalytics()
  const { data: radar, isLoading: radarLoading } = useRadar()
  const stats = cx?.result
  const pattern = radar?.result

  const statCards = [
    { label: 'Total Cases', value: stats?.total_cases, icon: Activity, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Escalated', value: stats?.escalated, icon: TrendingUp, color: 'text-red-500', bg: 'bg-red-500/10' },
    { label: 'Reopened', value: stats?.reopened, icon: RefreshCw, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { label: 'Historical Failures', value: stats?.historical_pattern_count, icon: AlertCircle, color: 'text-violet-500', bg: 'bg-violet-500/10' },
  ]

  return (
    <AppShell page="radar" title="Analytics" subtitle="Recurring issues, friction signals, and systemic patterns">
      <div className="space-y-5">
        {/* Stat cards */}
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {statCards.map((item) => {
            const Icon = item.icon
            return (
              <div key={item.label} className="card-elevated rounded-xl border bg-card p-4 transition-smooth hover:-translate-y-0.5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-muted-foreground">{item.label}</p>
                  <div className={`rounded-lg p-1.5 ${item.bg}`}>
                    <Icon className={`h-3.5 w-3.5 ${item.color}`} />
                  </div>
                </div>
                <p className="mt-2 text-2xl font-bold">
                  {cxLoading ? <Skeleton className="h-7 w-10 rounded-lg" /> : (item.value ?? 0)}
                </p>
              </div>
            )
          })}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {/* Recurring issues */}
          <section className="card-elevated rounded-xl border bg-card">
            <header className="border-b px-5 py-3.5">
              <h2 className="text-sm font-semibold">Recurring Issues</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">Most common complaint intents</p>
            </header>
            {!stats?.recurring_issues?.length ? (
              <div className="flex flex-col items-center py-10 text-center">
                <Activity className="mb-2 h-6 w-6 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">No recurring issues detected.</p>
              </div>
            ) : (
              <ul className="divide-y">
                {stats.recurring_issues.map((r, i) => (
                  <li key={r.intent} className="flex items-center justify-between px-5 py-3 text-sm">
                    <div className="flex items-center gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                        {i + 1}
                      </span>
                      <span className="font-medium capitalize">{r.intent.replace(/_/g, ' ')}</span>
                    </div>
                    <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                      {r.count}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Friction customers */}
          <section className="card-elevated rounded-xl border bg-card">
            <header className="border-b px-5 py-3.5">
              <h2 className="text-sm font-semibold">Friction Customers</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">Customers with repeated unresolved issues</p>
            </header>
            {!stats?.friction_customers?.length ? (
              <div className="flex flex-col items-center py-10 text-center">
                <Users className="mb-2 h-6 w-6 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">No repeated friction detected.</p>
              </div>
            ) : (
              <>
                <ul className="divide-y">
                  {stats.friction_customers.map((c) => (
                    <li key={c.customer_id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                      <span className="flex items-center gap-2.5">
                        <CustomerAvatar id={c.customer_id} name={c.name} size="sm" />
                        <span className="font-medium">{c.name ?? c.customer_id}</span>
                      </span>
                      <div className="flex items-center gap-2 text-right">
                        <span className="rounded-md bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-500">
                          {c.escalations}↑
                        </span>
                        <span className="rounded-md bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-500">
                          {c.reopens}↩
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
                <p className="border-t px-5 py-3 text-xs text-muted-foreground">
                  Risk signal: repeated unresolved friction detected for these customers.
                </p>
              </>
            )}
          </section>
        </div>

        {/* Systemic pattern */}
        <section className="card-elevated rounded-xl border bg-card">
          <header className="border-b px-5 py-3.5">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              <h2 className="text-sm font-semibold">Systemic Pattern</h2>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">Root-cause radar — correlated failure signals</p>
          </header>
          {radarLoading ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full rounded-lg" />)}
            </div>
          ) : !pattern?.incident_candidate ? (
            <div className="flex flex-col items-center py-10 text-center">
              <AlertCircle className="mb-2 h-6 w-6 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No systemic patterns detected in the available data.</p>
            </div>
          ) : (
            <dl className="divide-y">
              <div className="grid grid-cols-[120px_1fr] gap-3 px-5 py-4 text-sm">
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground pt-0.5">Fact</dt>
                <dd className="space-y-1">
                  {pattern.fact.map((f) => (
                    <p key={f.error_code}>
                      <span className="font-medium">{f.count} cases</span> of{' '}
                      <span className="text-muted-foreground">{f.problem_pattern.replace(/_/g, ' ')}</span>{' '}
                      <span className="font-mono text-xs text-muted-foreground/60">({f.error_code})</span>
                    </p>
                  ))}
                </dd>
              </div>
              <div className="grid grid-cols-[120px_1fr] gap-3 px-5 py-4 text-sm">
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground pt-0.5">Correlation</dt>
                <dd>Failures cluster around the order-service deployment event EVT-501.</dd>
              </div>
              <div className="grid grid-cols-[120px_1fr] gap-3 px-5 py-4 text-sm">
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground pt-0.5">Hypothesis</dt>
                <dd>{pattern.hypothesis?.statement}</dd>
              </div>
              <div className="grid grid-cols-[120px_1fr] gap-3 px-5 py-4 text-sm">
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground pt-0.5">Action</dt>
                <dd className="font-medium text-primary">{pattern.recommendation?.action}</dd>
              </div>
            </dl>
          )}
        </section>
      </div>
    </AppShell>
  )
}

export default Analytics
