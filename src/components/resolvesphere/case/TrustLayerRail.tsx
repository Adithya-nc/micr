import { StatusBadge } from '@/components/resolvesphere/StatusBadge'

const steps = ['Schema Validation', 'Evidence Validation', 'Evidence Sufficiency', 'Evidence Freshness', 'Contradiction Check', 'Policy Guard', 'Risk Engine', 'Authorization']

type Decision = { auth_state: string; risk_factors?: { gaps?: string[] } }

export function TrustLayerRail({ decision, status }: { decision: Decision | undefined; status: string }) {
  const started = Boolean(decision)
  const gaps = decision?.risk_factors?.gaps ?? []
  const blocked = gaps.includes('CONTRADICTION_DETECTED')
  const stepState = (index: number): 'Pending' | 'Passed' | 'Blocked' => {
    if (!started) return 'Pending'
    if (index === 4 && blocked) return 'Blocked'
    if (index >= 4 && blocked) return 'Blocked'
    return 'Passed'
  }
  return (
    <section className="rounded-lg border bg-card">
      <header className="border-b px-4 py-3"><h2 className="text-sm font-semibold">Trust Layer</h2></header>
      <div className="grid gap-2 p-4 sm:grid-cols-2">
        {steps.map((step, index) => {
          const state = stepState(index)
          return (
            <div key={step} className="flex items-center justify-between border px-3 py-2 text-sm">
              <span>{step}</span>
              <StatusBadge value={state} tone={state === 'Passed' ? 'success' : state === 'Blocked' ? 'danger' : 'neutral'} />
            </div>
          )
        })}
      </div>
      {started && (
        <p className="border-t px-4 py-3 text-xs text-muted-foreground">Authorization result: {decision?.auth_state}. Case status: {status}.</p>
      )}
    </section>
  )
}
