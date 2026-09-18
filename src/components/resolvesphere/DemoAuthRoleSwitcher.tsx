import { Link } from 'react-router-dom'
import { roleLabels, useDemoAuth, type DemoRole } from '@/lib/demoAuth'

const roles: DemoRole[] = ['customer', 'support_agent', 'manager', 'admin']

export function DemoAuthRoleSwitcher({ compact = false }: { compact?: boolean }) {
  const { role, setRole } = useDemoAuth()
  return (
    <div className={compact ? 'flex items-center gap-2' : 'rounded-md border bg-card p-3'}>
      {!compact && (
        <p className="mb-2 text-xs font-medium text-warning">
          [DEMO AUTH FALLBACK] Real authentication is pending.
        </p>
      )}
      <label className="flex items-center gap-2 text-xs text-muted-foreground">
        Role
        <select
          className="rounded-md border bg-background px-2 py-1 text-sm text-foreground"
          value={role}
          onChange={(event) => setRole(event.target.value as DemoRole)}
        >
          {roles.map((value) => (
            <option key={value} value={value}>{roleLabels[value]}</option>
          ))}
        </select>
      </label>
      {!compact && (
        <p className="mt-2 text-xs text-muted-foreground">
          <Link to="/status" className="underline">View backend status</Link>
        </p>
      )}
    </div>
  )
}
