import { AppShell } from '@/components/resolvesphere/AppShell'
import { getBackendStatus } from '@/lib/backendStatus'
import { StatusBadge } from '@/components/resolvesphere/StatusBadge'

const Testing = () => {
  const status = getBackendStatus()
  return (
    <AppShell page="testing" title="Testing / Admin">
      <div className="space-y-4">
        <section className="rounded-lg border bg-card p-5">
          <h2 className="text-sm font-semibold">Backend status</h2>
          <p className="mt-2 text-sm text-muted-foreground">Mock mode: {status.mock_mode ? 'enabled' : 'disabled'}</p>
          <p className="mt-1 text-sm text-muted-foreground">Seed loaded: <StatusBadge value={status.seed_loaded ? 'Yes' : 'No'} tone={status.seed_loaded ? 'success' : 'warning'} /></p>
        </section>
        <section className="rounded-lg border bg-card p-5">
          <h2 className="text-sm font-semibold">Pending verification commands</h2>
          <p className="mt-2 text-sm text-muted-foreground">See docs/verification-commands.md for the exact commands to run for schema, seed, and deployment.</p>
        </section>
        <section className="rounded-lg border bg-card p-5">
          <h2 className="text-sm font-semibold">Golden and adversarial tests</h2>
          <p className="mt-2 text-sm text-muted-foreground">No test results recorded. See docs/test-results.md.</p>
        </section>
      </div>
    </AppShell>
  )
}

export default Testing
