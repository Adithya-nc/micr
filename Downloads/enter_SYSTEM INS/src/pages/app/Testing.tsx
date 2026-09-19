import { AppShell } from '@/components/resolvesphere/AppShell'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/resolvesphere/StatusBadge'
import { useBackendStatus, useCaseList, useEngineAction, useRadar } from '@/lib/resolvesphereApi'

const goldenTests = [
  { id: 'GC-01', label: 'Autonomous refund resolves with a VERIFIED receipt', run: 'run_autonomous', caseId: 'CASE-1001' },
  { id: 'GC-02', label: 'Evidence gap asks one targeted question and resumes', run: 'run_evidence_gap', caseId: 'CASE-1002' },
  { id: 'GC-03', label: 'Contradiction blocks action and escalates', run: 'run_contradiction', caseId: 'CASE-1003' },
  { id: 'GC-06', label: 'Recurring pattern produces an incident candidate', run: 'run_radar' },
]

const Testing = () => {
  const { data: status } = useBackendStatus()
  const { data: cases } = useCaseList()
  const { data: radar, refetch: refetchRadar } = useRadar()
  const reset = useEngineAction('reset_demo')
  const autonomous = useEngineAction('run_autonomous')
  const evidenceGap = useEngineAction('run_evidence_gap')
  const contradiction = useEngineAction('run_contradiction')

  const runners: Record<string, ReturnType<typeof useEngineAction>> = {
    run_autonomous: autonomous,
    run_evidence_gap: evidenceGap,
    run_contradiction: contradiction,
  }

  const findCase = (id: string) => (cases?.cases as { case_id: string; status: string }[] | undefined)?.find((c) => c.case_id === id)

  return (
    <AppShell page="testing" title="Testing / Admin">
      <div className="space-y-4">
        <section className="rounded-lg border bg-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold">Demo reset</h2>
              <p className="mt-1 text-sm text-muted-foreground">Clears case-scoped ledgers and events for CASE-1001..1003 and reseeds their NEW state. Synthetic base data and policies are preserved.</p>
            </div>
            <Button variant="outline" onClick={() => reset.mutate(undefined)} disabled={reset.isPending}>
              {reset.isPending ? 'Resetting...' : 'Reset demo data'}
            </Button>
          </div>
          {reset.isError && <p className="mt-2 text-sm text-destructive">{(reset.error as Error).message}</p>}
        </section>

        <section className="rounded-lg border bg-card p-5">
          <h2 className="text-sm font-semibold">Golden test runner</h2>
          <p className="mt-1 text-sm text-muted-foreground">Runs the deterministic engine against real Enter Cloud Postgres data. Qwen is called only inside GC-01.</p>
          <table className="mt-3 w-full text-left text-sm">
            <tbody>
              {goldenTests.map((test) => {
                const runner = test.run === 'run_radar' ? null : runners[test.run]
                const currentCase = test.caseId ? findCase(test.caseId) : undefined
                return (
                  <tr key={test.id} className="border-b last:border-0">
                    <td className="py-2 font-mono text-xs">{test.id}</td>
                    <td className="py-2 text-sm">{test.label}</td>
                    <td className="py-2"><StatusBadge value={currentCase?.status ?? (test.run === 'run_radar' ? (radar?.result?.incident_candidate ? 'INCIDENT_CANDIDATE' : 'NO_PATTERN') : 'NOT RUN')} /></td>
                    <td className="py-2">
                      <Button size="sm" variant="outline" onClick={() => (test.run === 'run_radar' ? refetchRadar() : runner?.mutate(test.caseId))} disabled={runner?.isPending}>
                        Run
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </section>

        <section className="rounded-lg border bg-card p-5">
          <h2 className="text-sm font-semibold">Component status</h2>
          <p className="mt-2 text-sm text-muted-foreground">Mock mode: {status?.mock_mode ? 'enabled' : 'disabled'}. Qwen model: alibaba/qwen-3.8-max ({status?.qwen_connected ? 'configured' : 'pending'}).</p>
        </section>

        <section className="rounded-lg border bg-card p-5">
          <h2 className="text-sm font-semibold">Recorded results</h2>
          <p className="mt-2 text-sm text-muted-foreground">Actual golden and adversarial results, including the real Scenario 1-4 run, are in docs/test-results.md.</p>
        </section>
      </div>
    </AppShell>
  )
}

export default Testing
