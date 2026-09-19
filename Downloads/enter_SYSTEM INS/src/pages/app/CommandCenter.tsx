import { Link } from 'react-router-dom';
import { AppShell } from '@/components/resolvesphere/AppShell';
import { StatusBadge } from '@/components/resolvesphere/StatusBadge';
import { CustomerAvatar } from '@/components/resolvesphere/CustomerAvatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useCaseList } from '@/lib/resolvesphereApi';
import { TrendingUp, Clock, AlertTriangle, CheckCircle2, Inbox } from 'lucide-react';

export type CaseRow = {
  case_id: string;
  customer_id: string;
  customer_name: string | null;
  customer_email?: string | null;
  status: string;
  urgency: string;
  sentiment: string;
  raw_complaint: string;
  escalation_reason: string | null;
  risk_level: string | null;
  assigned_agent: string | null;
  category: string | null;
  primary_intent: string | null;
  reference_id?: string | null;
  updated_at: string;
};

const counters: {
  label: string;
  icon: typeof Inbox;
  match: (s: string) => boolean;
  color: string;
  bg: string;
}[] = [
  { label: 'Open Cases', icon: Inbox, match: s => !['RESOLVED', 'FAILED'].includes(s), color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { label: 'Investigating', icon: TrendingUp, match: s => ['INVESTIGATING', 'CONTEXT_BUILT', 'ROUTED', 'EVIDENCE_READY', 'DECISION_READY'].includes(s), color: 'text-violet-500', bg: 'bg-violet-500/10' },
  { label: 'Awaiting Reply', icon: Clock, match: s => s === 'EVIDENCE_GAP', color: 'text-amber-500', bg: 'bg-amber-500/10' },
  { label: 'Needs Human', icon: AlertTriangle, match: s => ['ESCALATED', 'APPROVAL_REQUIRED'].includes(s), color: 'text-red-500', bg: 'bg-red-500/10' },
  { label: 'Resolved', icon: CheckCircle2, match: s => s === 'RESOLVED', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
];

export function CaseTable({
  cases,
  isLoading,
  isError
}: {
  cases: CaseRow[];
  isLoading: boolean;
  isError: boolean;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b bg-muted/40">
          <tr>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Customer</th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Case ID</th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Issue</th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Assigned to</th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Priority</th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</th>
          </tr>
        </thead>

        <tbody className="divide-y">
          {isLoading && Array.from({ length: 4 }).map((_, i) => (
            <tr key={i}>
              <td className="px-4 py-3" colSpan={6}>
                <Skeleton className="h-8 w-full rounded-lg" />
              </td>
            </tr>
          ))}

          {isError && (
            <tr>
              <td className="px-4 py-10 text-center text-muted-foreground" colSpan={6}>
                <AlertTriangle className="mx-auto mb-2 h-5 w-5 text-muted-foreground/50" />
                Cases could not be loaded. Try again shortly.
              </td>
            </tr>
          )}

          {!isLoading && !isError && cases.length === 0 && (
            <tr>
              <td className="px-4 py-10 text-center text-muted-foreground" colSpan={6}>
                <Inbox className="mx-auto mb-2 h-5 w-5 text-muted-foreground/40" />
                No cases found.
              </td>
            </tr>
          )}

          {cases.map(c => (
            <tr key={c.case_id} className="group transition-smooth hover:bg-muted/40">
              <td className="px-4 py-3">
                <span className="flex items-center gap-2.5">
                  <CustomerAvatar id={c.customer_id} name={c.customer_name} size="sm" />
                  <span>
                    <span className="block font-medium text-foreground">{c.customer_name ?? c.customer_id}</span>
                    <span className="block text-xs text-muted-foreground">{c.customer_id}</span>
                  </span>
                </span>
              </td>

              <td className="px-4 py-3">
                <Link
                  to={`/app/cases/${c.case_id}`}
                  className="font-mono text-xs font-semibold text-primary transition-smooth hover:underline"
                >
                  {c.case_id}
                </Link>
              </td>

              <td className="max-w-xs truncate px-4 py-3 text-sm text-muted-foreground" title={c.raw_complaint}>
                {c.raw_complaint}
              </td>

              <td className="px-4 py-3 text-sm text-muted-foreground">
                {c.assigned_agent ? (
                  <span className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    {c.assigned_agent}
                  </span>
                ) : (
                  <span className="text-muted-foreground/50">Unassigned</span>
                )}
              </td>

              <td className="px-4 py-3">
                <span className={`text-xs font-medium ${
                  c.urgency === 'HIGH' ? 'text-red-500' :
                  c.urgency === 'MEDIUM' ? 'text-amber-500' : 'text-muted-foreground'
                }`}>
                  {c.urgency}
                </span>
              </td>

              <td className="px-4 py-3">
                <StatusBadge value={c.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const CommandCenter = () => {
  const { data, isLoading, isError } = useCaseList();
  const cases = (data?.cases ?? []) as CaseRow[];

  return (
    <AppShell
      page="command-center"
      title="Dashboard"
      subtitle="Don't answer the ticket. Resolve the case."
    >
      <div className="space-y-5">
        {/* Stat cards */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {counters.map((counter) => {
            const Icon = counter.icon
            const count = cases.filter(c => counter.match(c.status)).length
            return (
              <div
                key={counter.label}
                className="card-elevated rounded-xl border bg-card p-4 transition-smooth hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-muted-foreground">{counter.label}</p>
                  <div className={`rounded-lg p-1.5 ${counter.bg}`}>
                    <Icon className={`h-3.5 w-3.5 ${counter.color}`} />
                  </div>
                </div>
                <div className="mt-2 text-2xl font-bold">
                  {isLoading ? <Skeleton className="h-7 w-10 rounded-lg" /> : count}
                </div>
              </div>
            )
          })}
        </div>

        {/* Case queue */}
        <section className="card-elevated rounded-xl border bg-card">
          <header className="flex items-center justify-between border-b px-5 py-3.5">
            <div>
              <h2 className="text-sm font-semibold">Case Queue</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {isLoading ? '…' : `${cases.length} total case${cases.length !== 1 ? 's' : ''}`}
              </p>
            </div>
            <Button asChild size="sm" variant="outline" className="rounded-lg text-xs">
              <Link to="/app/cases">View all</Link>
            </Button>
          </header>
          <CaseTable cases={cases} isLoading={isLoading} isError={isError} />
        </section>
      </div>
    </AppShell>
  );
};

export default CommandCenter;