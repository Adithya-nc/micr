import { AppShell } from '@/components/resolvesphere/AppShell'
import { getBackendStatus, missingComponents } from '@/lib/backendStatus'
import { StatusBadge } from '@/components/resolvesphere/StatusBadge'

const rows: { key: keyof ReturnType<typeof getBackendStatus>; label: string }[] = [
  { key: 'backend_connected', label: 'backend_connected' },
  { key: 'database_connected', label: 'database_connected' },
  { key: 'auth_connected', label: 'auth_connected' },
  { key: 'functions_connected', label: 'functions_connected' },
  { key: 'workflows_connected', label: 'workflows_connected' },
  { key: 'verification_connected', label: 'verification_connected' },
  { key: 'seed_loaded', label: 'seed_loaded' },
  { key: 'mock_mode', label: 'mock_mode' },
]

const Status = () => {
  const status = getBackendStatus()
  return (
    <AppShell page="status" title="Backend Status">
      <div className="space-y-4">
        <section className="rounded-lg border bg-card p-5">
          <table className="w-full text-left text-sm">
            <tbody>
              {rows.map((row) => (
                <tr key={row.key} className="border-b last:border-0">
                  <td className="py-2 font-mono text-xs">{row.label}</td>
                  <td className="py-2"><StatusBadge value={String(status[row.key])} tone={status[row.key] ? 'success' : 'warning'} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        <section className="rounded-lg border bg-card p-5">
          <h2 className="text-sm font-semibold">Missing components</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            {missingComponents.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </section>
        <section className="rounded-lg border bg-card p-5">
          <h2 className="text-sm font-semibold">Deferred commands</h2>
          <p className="mt-2 text-sm text-muted-foreground">Exact commands are documented in docs/verification-commands.md and were not executed.</p>
        </section>
      </div>
    </AppShell>
  )
}

export default Status
