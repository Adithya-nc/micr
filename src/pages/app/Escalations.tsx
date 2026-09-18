import { Link } from 'react-router-dom'
import { AppShell } from '@/components/resolvesphere/AppShell'
import { StatusBadge } from '@/components/resolvesphere/StatusBadge'
import { Skeleton } from '@/components/ui/skeleton'
import { useCaseList } from '@/lib/resolvesphereApi'

const Escalations = () => {
  const { data, isLoading, isError } = useCaseList()
  const escalated = ((data?.cases ?? []) as { case_id: string; status: string; escalation_reason: string | null; raw_complaint: string }[]).filter((c) => c.status === 'ESCALATED')

  return (
    <AppShell page="escalations" title="Escalations">
      <section className="rounded-lg border bg-card">
        {isLoading && <div className="space-y-2 p-4">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>}
        {isError && <p className="p-4 text-sm text-muted-foreground">Backend function is unreachable.</p>}
        {!isLoading && !isError && escalated.length === 0 && <p className="p-4 text-sm text-muted-foreground">No escalated cases available in demo mode.</p>}
        <ul className="divide-y">
          {escalated.map((c) => (
            <li key={c.case_id} className="px-4 py-4">
              <div className="flex items-center justify-between">
                <Link to={`/app/cases/${c.case_id}`} className="text-sm font-medium text-primary underline">{c.case_id}</Link>
                <StatusBadge value={c.escalation_reason ?? 'ESCALATED'} tone="danger" />
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{c.raw_complaint}</p>
              <Link to={`/app/cases/${c.case_id}`} className="mt-2 inline-block text-xs font-medium text-primary underline">Open Case Brief</Link>
            </li>
          ))}
        </ul>
      </section>
    </AppShell>
  )
}

export default Escalations
