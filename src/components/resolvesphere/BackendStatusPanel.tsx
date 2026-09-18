import { useBackendStatus } from '@/lib/resolvesphereApi'
import { StatusBadge } from '@/components/resolvesphere/StatusBadge'
import { Skeleton } from '@/components/ui/skeleton'

const labels: Record<string, string> = {
  database_connected: 'Database',
  auth_connected: 'Auth',
  backend_functions_connected: 'Backend functions',
  workflows_connected: 'Workflows',
  agent_connected: 'Agent',
  skills_connected: 'Skills',
  knowledge_connected: 'Knowledge',
  qwen_connected: 'Qwen runtime model',
  seed_loaded: 'Demo seed data',
  verification_connected: 'Verification engine',
  realtime_or_polling_connected: 'Realtime / polling',
}

export function BackendStatusPanel() {
  const { data, isLoading, isError } = useBackendStatus()

  if (isLoading) {
    return (
      <div className="rounded-lg border bg-card p-5">
        <p className="mb-3 text-sm text-muted-foreground">Checking backend status...</p>
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
        </div>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-5 text-sm text-muted-foreground">
        Backend status function is unreachable. Case data cannot be verified right now.
      </div>
    )
  }

  return (
    <div className="rounded-lg border bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <StatusBadge value={data.overall_connected ? 'Backend integration connected' : 'Backend integration pending'} tone={data.overall_connected ? 'success' : 'warning'} />
        <StatusBadge value={data.mock_mode ? 'Mock mode enabled' : 'Live backend data'} tone={data.mock_mode ? 'warning' : 'success'} />
      </div>
      <ul className="divide-y">
        {Object.entries(labels).map(([key, label]) => {
          const value = data[key as keyof typeof data] as boolean
          return (
            <li key={key} className="flex items-center justify-between py-2 text-sm">
              <span>{label}</span>
              <StatusBadge value={value ? 'Connected' : 'Pending'} tone={value ? 'success' : 'warning'} />
            </li>
          )
        })}
      </ul>
      <p className="mt-4 text-xs text-muted-foreground">
        Demo UI may use mock data only when mock mode is enabled. No verified resolution is claimed unless the verification engine reports a VERIFIED receipt.
      </p>
      <p className="mt-1 text-xs text-muted-foreground">Last checked {new Date(data.last_checked_at).toLocaleString()}</p>
    </div>
  )
}
