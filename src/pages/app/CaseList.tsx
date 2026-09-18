import { Link } from 'react-router-dom'
import { AppShell } from '@/components/resolvesphere/AppShell'
import { StatusBadge } from '@/components/resolvesphere/StatusBadge'
import { Skeleton } from '@/components/ui/skeleton'
import { useCaseList } from '@/lib/resolvesphereApi'

const CaseList = () => {
  const { data, isLoading, isError } = useCaseList()
  const cases = (data?.cases ?? []) as { case_id: string; status: string; urgency: string }[]

  return (
    <AppShell page="active-case" title="Active Cases">
      <section className="rounded-lg border bg-card p-2">
        {isLoading && <div className="space-y-2 p-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>}
        {isError && <p className="p-4 text-sm text-muted-foreground">Backend function is unreachable.</p>}
        {!isLoading && !isError && cases.length === 0 && <p className="p-4 text-sm text-muted-foreground">No cases available.</p>}
        <ul className="divide-y">
          {cases.map((c) => (
            <li key={c.case_id} className="flex items-center justify-between px-3 py-3">
              <Link to={`/app/cases/${c.case_id}`} className="text-sm font-medium text-primary underline">{c.case_id}</Link>
              <StatusBadge value={c.status} />
            </li>
          ))}
        </ul>
      </section>
    </AppShell>
  )
}

export default CaseList
