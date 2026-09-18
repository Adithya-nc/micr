import type { ReactNode } from 'react'
import { Link, useLocation, Navigate } from 'react-router-dom'
import { AlertTriangle, BookOpen, ChartLine, LayoutDashboard, Inbox, Settings, ShieldCheck, LogOut } from 'lucide-react'
import { FooterBar } from '@/components/resolvesphere/FooterBar'
import { ThemeToggle } from '@/components/resolvesphere/ThemeToggle'
import { useAuth } from '@/lib/auth'

const navigation: { label: string; icon: typeof LayoutDashboard; path: string; page: string; roles: string[] }[] = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/app', page: 'command-center', roles: ['support_agent', 'manager'] },
  { label: 'Active Cases', icon: Inbox, path: '/app/cases', page: 'active-case', roles: ['support_agent', 'manager'] },
  { label: 'Escalations', icon: AlertTriangle, path: '/escalations', page: 'escalations', roles: ['support_agent', 'manager'] },
  { label: 'Knowledge Base', icon: BookOpen, path: '/knowledge', page: 'knowledge', roles: ['support_agent', 'manager'] },
  { label: 'Analytics', icon: ChartLine, path: '/radar', page: 'radar', roles: ['manager'] },
  { label: 'Settings', icon: Settings, path: '/settings', page: 'settings', roles: ['support_agent', 'manager'] },
]

export function AppShell({ page, title, subtitle, actions, children }: { page: string; title: string; subtitle?: string; actions?: ReactNode; children: ReactNode }) {
  const { pathname } = useLocation()
  const { user, role, signOut } = useAuth()

  if (!user || !role) {
    return <Navigate to="/login" replace />
  }

  const navItem = navigation.find((n) => n.page === page)
  if (navItem && !navItem.roles.includes(role)) {
    return <Navigate to="/app" replace />
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="grid min-h-screen lg:grid-cols-[15rem_minmax(0,1fr)]">
        <aside className="border-b bg-card lg:border-b-0 lg:border-r">
          <div className="border-b px-5 py-4">
            <Link to="/app" className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <span className="font-semibold">ResolveSphere</span>
            </Link>
          </div>
          <nav aria-label="Primary" className="flex gap-1 overflow-x-auto p-3 lg:flex-col">
            {navigation.filter((item) => item.roles.includes(role)).map((item) => {
              const Icon = item.icon
              const active = pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-left text-sm ${active ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </aside>

        <div className="flex min-w-0 flex-col">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b bg-card px-5 py-3">
            <div>
              <h1 className="text-base font-semibold">{title}</h1>
              {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
            </div>
            <div className="flex items-center gap-3">
              {actions}
              <span className="text-xs text-muted-foreground">{user.email}</span>
              <ThemeToggle />
              <button onClick={signOut} className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted">
                <LogOut className="h-3.5 w-3.5" />
                Sign out
              </button>
            </div>
          </header>
          <main className="mx-auto w-full max-w-[1600px] flex-1 p-5">
            {children}
          </main>
          <FooterBar />
        </div>
      </div>
    </div>
  )
}
