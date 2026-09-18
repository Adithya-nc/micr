import { AppShell } from '@/components/resolvesphere/AppShell'
import { StatusBadge } from '@/components/resolvesphere/StatusBadge'
import { Skeleton } from '@/components/ui/skeleton'
import { useBackendStatus } from '@/lib/resolvesphereApi'

const Status = () => {
  const { data, isLoading, isError } = useBackendStatus()

  return (
    <AppShell page="status" title="Backend Status">
      <div className="space-y-4">
        {isLoading && (
          <section className="rounded-lg border bg-card p-5">
            <p className="mb-3 text-sm text-muted-foreground">Querying backend status...</p>
            <div className="space-y-2">
              {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
            </div>
          </section>
        )}
        {isError && (
          <section className="rounded-lg border border-destructive/40 bg-destructive/5 p-5 text-sm text-muted-foreground">
            resolvesphere-status is unreachable. Backend state cannot be confirmed right now.
          </section>
        )}
        {data && (
          <>
            <section className="rounded-lg border bg-card p-5">
              <div className="mb-3 flex items-center gap-2">
                <StatusBadge value={data.overall_connected ? 'overall_connected: true' : 'overall_connected: false'} tone={data.overall_connected ? 'success' : 'warning'} />
                <StatusBadge value={data.mock_mode ? 'mock_mode: true' : 'mock_mode: false'} tone={data.mock_mode ? 'warning' : 'success'} />
              </div>
              <table className="w-full text-left text-sm">
                <tbody>
                  {data.checks.map((row) => (
                    <tr key={row.component} className="border-b last:border-0">
                      <td className="py-2 font-mono text-xs">{row.component}</td>
                      <td className="py-2"><StatusBadge value={row.status} tone={row.status === 'CONNECTED' ? 'success' : 'warning'} /></td>
                      <td className="py-2 text-xs text-muted-foreground">{row.message}</td>
                      <td className="py-2 text-xs text-muted-foreground">{row.required_action}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-3 text-xs text-muted-foreground">Last checked {new Date(data.last_checked_at).toLocaleString()}</p>
            </section>
            <section className="rounded-lg border bg-card p-5">
              <h2 className="text-sm font-semibold">Deferred commands</h2>
              <p className="mt-2 text-sm text-muted-foreground">Exact frontend build/lint/test commands are documented in docs/verification-commands.md.</p>
            </section>
          </>
        )}
      </div>
    </AppShell>
  )
}

export default Status
