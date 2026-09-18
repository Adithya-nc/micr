import { Link } from 'react-router-dom'
import { AppShell } from '@/components/resolvesphere/AppShell'
import { StatusBadge } from '@/components/resolvesphere/StatusBadge'
import { CustomerAvatar } from '@/components/resolvesphere/CustomerAvatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { useCaseList } from '@/lib/resolvesphereApi'

export type CaseRow = {
  case_id: string
  customer_id: string
  customer_name: string | null
  customer_email?: string | null
  status: string
  urgency: string
  sentiment: string
  raw_complaint: string
  escalation_reason: string | null
  risk_level: string | null
  assigned_agent: string | null
  category: string | null
  primary_intent: string | null
  reference_id?: string | null
  updated_at: string
}

const counters: { label: string; match: (s: string) => boolean }[] = [
  { label: 'Open cases', match: (s) => !['RESOLVED', 'FAILED'].includes(s) },
  { label: 'Investigating', match: (s) => ['INVESTIGATING', 'CONTEXT_BUILT', 'ROUTED', 'EVIDENCE_READY', 'DECISION_READY'].includes(s) },
  { label: 'Waiting on customer', match: (s) => s === 'EVIDENCE_GAP' },
  { label: 'Needs a human', match: (s) => ['ESCALATED', 'APPROVAL_REQUIRED'].includes(s) },
  { label: 'Resolved', match: (s) => s === 'RESOLVED' },
]

export function CaseTable({ cases, isLoading, isError }: { cases: CaseRow[]; isLoading: boolean; isError: boolean }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-2">Customer</th>
            <th className="px-4 py-2">Case</th>
            <th className="px-4 py-2">Issue</th>
            <th className="px-4 py-2">Assigned to</th>
            <th className="px-4 py-2">Priority</th>
            <th className="px-4 py-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {isLoading && Array.from({ length: 3 }).map((_, i) => (
            <tr key={i}><td className="px-4 py-3" colSpan={6}><Skeleton className="h-6 w-full" /></td></tr>
          ))}
          {isError && <tr><td className="px-4 py-8 text-center text-muted-foreground" colSpan={6}>Cases could not be loaded. Try again shortly.</td></tr>}
          {!isLoading && !isError && cases.length === 0 && <tr><td className="px-4 py-8 text-center text-muted-foreground" colSpan={6}>No cases found.</td></tr>}
          {cases.map((c) => (
            <tr key={c.case_id} className="border-b last:border-0 hover:bg-muted/40">
              <td className="px-4 py-3">
                <span className="flex items-center gap-2">
                  <CustomerAvatar id={c.customer_id} name={c.customer_name} size="sm" />
                  <span>
                    <span className="block font-medium">{c.customer_name ?? c.customer_id}</span>
                    <span className="block text-xs text-muted-foreground">{c.customer_id}</span>
                  </span>
                </span>
              </td>
              <td className="px-4 py-3"><Link to={`/app/cases/${c.case_id}`} className="font-medium text-primary underline">{c.case_id}</Link></td>
              <td className="px-4 py-3 max-w-xs truncate text-muted-foreground">{c.raw_complaint}</td>
              <td className="px-4 py-3 text-muted-foreground">{c.assigned_agent ?? 'Unassigned'}</td>
              <td className="px-4 py-3">{c.urgency}</td>
              <td className="px-4 py-3"><StatusBadge value={c.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const CommandCenter = () => {
  const { data, isLoading, isError } = useCaseList()
  const cases = (data?.cases ?? []) as CaseRow[]

  return (
    <AppShell
      page="command-center"
      title="Dashboard"
      subtitle="Don't answer the ticket. Resolve the case."
      actions={<Button asChild size="sm"><Link to="/submit">New request</Link></Button>}
    >
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {counters.map((counter) => (
            <div key={counter.label} className="rounded-lg border bg-card p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{counter.label}</p>
              <p className="mt-1 text-2xl font-semibold">{isLoading ? <Skeleton className="h-7 w-10" /> : cases.filter((c) => counter.match(c.status)).length}</p>
            </div>
          ))}
        </div>
        <section className="rounded-lg border bg-card">
          <header className="border-b px-4 py-3"><h2 className="text-sm font-semibold">Case queue</h2></header>
          <CaseTable cases={cases} isLoading={isLoading} isError={isError} />
        </section>
      </div>
    </AppShell>
  )
}

export default CommandCenter
