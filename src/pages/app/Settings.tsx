import { Link } from 'react-router-dom'
import { AppShell } from '@/components/resolvesphere/AppShell'
import { useAuth } from '@/lib/auth'

const Settings = () => {
  const { role, user } = useAuth()
  return (
    <AppShell page="command-center" title="Settings">
      <div className="space-y-4">
        <section className="rounded-lg border bg-card p-5">
          <h2 className="text-sm font-semibold">Account</h2>
          <p className="mt-1 text-sm text-muted-foreground">Signed in as {user?.email}</p>
          <p className="mt-1 text-sm text-muted-foreground">Role: {role}</p>
        </section>
        {role === 'admin' && (
          <section className="rounded-lg border bg-card p-5">
            <h2 className="text-sm font-semibold">Administration</h2>
            <ul className="mt-2 space-y-1 text-sm">
              <li><Link to="/admin" className="text-primary underline">Admin console</Link></li>
              <li><Link to="/admin/backend" className="text-primary underline">System health</Link></li>
              <li><Link to="/admin/testing" className="text-primary underline">Scenario runner</Link></li>
            </ul>
          </section>
        )}
      </div>
    </AppShell>
  )
}

export default Settings
