import { AppShell } from '@/components/resolvesphere/AppShell'
import { StatusBadge } from '@/components/resolvesphere/StatusBadge'
import { Skeleton } from '@/components/ui/skeleton'
import { useRadar } from '@/lib/resolvesphereApi'

type Fact = { problem_pattern: string; error_code: string; count: number; label: string }

const Radar = () => {
  const { data, isLoading, isError } = useRadar()
  const result = data?.result as { fact: Fact[]; correlation: unknown; hypothesis: { statement: string } | null; recommendation: { action: string } | null; incident_candidate: boolean } | undefined

  return (
    <AppShell page="radar" title="Root-Cause Radar">
      <div className="space-y-4">
        {isLoading && <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}</div>}
        {isError && <p className="text-sm text-muted-foreground">Backend function is unreachable.</p>}
        {result && !result.incident_candidate && (
          <p className="text-sm text-muted-foreground">No systemic patterns detected in the available data.</p>
        )}
        {result && result.incident_candidate && (
          <>
            <section className="rounded-lg border bg-card p-4">
              <div className="mb-2 flex items-center gap-2"><StatusBadge value="FACT" tone="info" /><StatusBadge value="[DEMO DATA]" tone="warning" /></div>
              {result.fact.map((f) => (
                <p key={`${f.problem_pattern}-${f.error_code}`} className="text-sm">{f.count} historical cases — {f.problem_pattern} / {f.error_code}</p>
              ))}
            </section>
            <section className="rounded-lg border bg-card p-4">
              <StatusBadge value="CORRELATION" tone="info" />
              <p className="mt-2 text-sm text-muted-foreground">Pattern count correlates with system event EVT-501 (order-service deployment).</p>
            </section>
            <section className="rounded-lg border bg-card p-4">
              <StatusBadge value="HYPOTHESIS" tone="warning" />
              <p className="mt-2 text-sm">{result.hypothesis?.statement}</p>
            </section>
            <section className="rounded-lg border bg-card p-4">
              <StatusBadge value="RECOMMENDATION" />
              <p className="mt-2 text-sm">{result.recommendation?.action}</p>
            </section>
          </>
        )}
      </div>
    </AppShell>
  )
}

export default Radar
