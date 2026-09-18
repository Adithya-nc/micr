import { getBackendStatus } from '@/lib/backendStatus'
import { StatusBadge } from '@/components/resolvesphere/StatusBadge'

const rows: { key: keyof ReturnType<typeof getBackendStatus>; label: string }[] = [
  { key: 'backend_connected', label: 'Backend integration' },
  { key: 'database_connected', label: 'Database' },
  { key: 'auth_connected', label: 'Auth' },
  { key: 'functions_connected', label: 'Backend functions' },
  { key: 'workflows_connected', label: 'Workflows' },
  { key: 'verification_connected', label: 'Verification engine' },
  { key: 'seed_loaded', label: 'Demo seed data' },
]

export function BackendStatusPanel() {
  const status = getBackendStatus()
  return (
    <div className="rounded-lg border bg-card p-5">
      <ul className="divide-y">
        {rows.map((row) => {
          const value = status[row.key] as boolean
          return (
            <li key={row.key} className="flex items-center justify-between py-2 text-sm">
              <span>{row.label}</span>
              <StatusBadge value={value ? 'Connected' : 'Pending'} tone={value ? 'success' : 'warning'} />
            </li>
          )
        })}
      </ul>
      <p className="mt-4 text-xs text-muted-foreground">
        Demo UI may use mock data only. No verified resolution exists until database, functions, workflows, and verification are all connected.
      </p>
      <p className="mt-1 text-xs text-muted-foreground">Last checked {new Date(status.updated_at).toLocaleString()}</p>
    </div>
  )
}
