import { Link } from 'react-router-dom'
import { AppShell } from '@/components/resolvesphere/AppShell'
import { StatusBadge } from '@/components/resolvesphere/StatusBadge'
import { Skeleton } from '@/components/ui/skeleton'
import { useCaseList } from '@/lib/resolvesphereApi'

type CaseRow = { case_id: string; status: string; urgency: string; sentiment: string; raw_complaint: string; escalation_reason: string | null; risk_level: string | null }

const counters: { label: string; match: (s: string) => boolean }[] = [
  { label: 'Active cases', match: (s) => !['RESOLVED', 'ESCALATED', 'FAILED'].includes(s) },
  { label: 'Investigating', match: (s) => s === 'INVESTIGATING' },
  { label: 'Awaiting human', match: (s) => ['APPROVAL_REQUIRED', 'EVIDENCE_GAP'].includes(s) },
  { label: 'Verifying', match: (s) => s === 'VERIFYING' },
  { label: 'Resolved', match: (s) => s === 'RESOLVED' },
  { label: 'Reopened', match: (s) => s === 'REOPENED' },
  { label: 'Escalated', match: (s) => s === 'ESCALATED' },
]

const CommandCenter = () => {
  const { data, isLoading, isError } = useCaseList()
  const cases = (data?.cases ?? []) as CaseRow[]

  return (
    <AppShell page="command-center" title="Command Center">
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {counters.map((counter) => (
            <div key={counter.label} className="rounded-lg border bg-card p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{counter.label}</p>
              <p className="mt-1 text-2xl font-semibold">{isLoading ? <Skeleton className="h-7 w-10" /> : cases.filter((c) => counter.match(c.status)).length}</p>
            </div>
          ))}
        </div>
        <section className="rounded-lg border bg-card">
          <header className="flex items-center justify-between border-b px-4 py-3">
            <h2 className="text-sm font-semibold">Case queue</h2>
            <StatusBadge value="SYNTHETIC data only" tone="info" />
          </header>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b text-xs uppercase tracking-wide text-muted-foreground">
                <tr><th className="px-4 py-2">Case</th><th className="px-4 py-2">Status</th><th className="px-4 py-2">Urgency</th><th className="px-4 py-2">Sentiment</th><th className="px-4 py-2">Complaint</th></tr>
              </thead>
              <tbody>
                {isLoading && Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}><td className="px-4 py-3" colSpan={5}><Skeleton className="h-5 w-full" /></td></tr>
                ))}
                {isError && (
                  <tr><td className="px-4 py-6 text-center text-muted-foreground" colSpan={5}>Backend function is unreachable. Case data cannot be loaded.</td></tr>
                )}
                {!isLoading && !isError && cases.length === 0 && (
                  <tr><td className="px-4 py-6 text-center text-muted-foreground" colSpan={5}>No cases returned by the backend.</td></tr>
                )}
                {cases.map((c) => (
                  <tr key={c.case_id} className="border-b last:border-0">
                    <td className="px-4 py-3"><Link to={`/app/cases/${c.case_id}`} className="font-medium text-primary underline">{c.case_id}</Link></td>
                    <td className="px-4 py-3"><StatusBadge value={c.status} /></td>
                    <td className="px-4 py-3">{c.urgency}</td>
                    <td className="px-4 py-3">{c.sentiment}</td>
                    <td className="px-4 py-3 max-w-sm truncate text-muted-foreground">{c.raw_complaint}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AppShell>
  )
}

export default CommandCenter
