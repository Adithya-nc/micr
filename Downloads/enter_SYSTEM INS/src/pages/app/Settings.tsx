import { Link } from 'react-router-dom'
import { AppShell } from '@/components/resolvesphere/AppShell'
import { useAuth } from '@/lib/auth'
import { User, Shield, ExternalLink, ChevronRight } from 'lucide-react'

const Settings = () => {
  const { role, user } = useAuth()
  return (
    <AppShell page="command-center" title="Settings" subtitle="Account and workspace preferences">
      <div className="max-w-2xl space-y-4">
        {/* Account section */}
        <section className="card-elevated rounded-xl border bg-card">
          <header className="flex items-center gap-2.5 border-b px-5 py-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <User className="h-4 w-4 text-primary" />
            </div>
            <h2 className="text-sm font-semibold">Account</h2>
          </header>
          <div className="divide-y">
            <div className="flex items-center justify-between px-5 py-3.5 text-sm">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium">{user?.email}</span>
            </div>
            <div className="flex items-center justify-between px-5 py-3.5 text-sm">
              <span className="text-muted-foreground">Role</span>
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium capitalize text-primary">
                {role?.replace('_', ' ')}
              </span>
            </div>
          </div>
        </section>

        {/* Admin section */}
        {role === 'admin' && (
          <section className="card-elevated rounded-xl border bg-card">
            <header className="flex items-center gap-2.5 border-b px-5 py-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10">
                <Shield className="h-4 w-4 text-amber-500" />
              </div>
              <h2 className="text-sm font-semibold">Administration</h2>
            </header>
            <ul className="divide-y">
              {[
                { to: '/admin', label: 'Admin console', desc: 'Manage users and system settings' },
                { to: '/admin/backend', label: 'System health', desc: 'View backend service status' },
                { to: '/admin/testing', label: 'Scenario runner', desc: 'Run test cases and simulations' },
              ].map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className="flex items-center justify-between px-5 py-3.5 transition-smooth hover:bg-muted/40"
                  >
                    <div>
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Links */}
        <section className="card-elevated rounded-xl border bg-card">
          <ul className="divide-y">
            {[
              { to: '/terms', label: 'Terms of Service' },
              { to: '/privacy', label: 'Privacy Policy' },
            ].map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className="flex items-center justify-between px-5 py-3.5 text-sm transition-smooth hover:bg-muted/40"
                >
                  <span>{item.label}</span>
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </AppShell>
  )
}

export default Settings
