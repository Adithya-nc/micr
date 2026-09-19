import type { ReactNode } from 'react'
import { Link, useLocation, Navigate } from 'react-router-dom'
import {
  AlertTriangle, BookOpen, ChartLine, LayoutDashboard,
  Inbox, Settings, ShieldCheck, LogOut, ChevronRight
} from 'lucide-react'
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

export function AppShell({
  page, title, subtitle, actions, children
}: {
  page: string; title: string; subtitle?: string; actions?: ReactNode; children: ReactNode
}) {
  const { pathname } = useLocation()
  const { user, role, signOut } = useAuth()

  if (!user || !role) {
    return <Navigate to="/login" replace />
  }

  const navItem = navigation.find((n) => n.page === page)
  if (navItem && !navItem.roles.includes(role)) {
    return <Navigate to="/app" replace />
  }

  const initials = (user.email ?? 'U')
    .split('@')[0]
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="min-h-screen bg-background">
      <div className="grid min-h-screen lg:grid-cols-[15rem_minmax(0,1fr)]">
        {/* Sidebar */}
        <aside className="flex flex-col border-b bg-card lg:border-b-0 lg:border-r lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto">
          {/* Logo */}
          <div className="border-b px-4 py-4 shrink-0">
            <Link to="/app" className="flex items-center gap-2.5 group">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 transition-smooth group-hover:bg-primary/15">
                <ShieldCheck className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold leading-tight tracking-tight">
                  ResolveSphere
                </p>
                <p className="text-[10px] text-muted-foreground capitalize">{role?.replace('_', ' ')}</p>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav aria-label="Primary" className="flex gap-1 overflow-x-auto p-2.5 lg:flex-col lg:flex-1">
            {navigation.filter((item) => item.roles.includes(role)).map((item) => {
              const Icon = item.icon
              const active = pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-smooth
                    ${active
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                  {active && <ChevronRight className="ml-auto h-3.5 w-3.5 shrink-0 opacity-60" />}
                </Link>
              )
            })}
          </nav>

          {/* User info at bottom (desktop only) */}
          <div className="hidden lg:block shrink-0 border-t bg-card p-3 mt-auto">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium">{user.email}</p>
                <p className="text-[10px] text-muted-foreground capitalize">{role?.replace('_', ' ')}</p>
              </div>
              <button
                onClick={signOut}
                className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-smooth hover:bg-muted hover:text-foreground"
                title="Sign out"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex min-w-0 flex-col">
          {/* Top bar */}
          <header className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 border-b bg-card/95 px-5 py-3 backdrop-blur-sm">
            <div className="min-w-0">
              <h1 className="text-base font-semibold leading-tight">{title}</h1>
              {subtitle && (
                <p className="mt-0.5 truncate text-xs text-muted-foreground">{subtitle}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {actions}
              <ThemeToggle />
              {/* Sign out (mobile) */}
              <div className="flex items-center gap-1.5 lg:hidden">
                <span className="hidden text-xs text-muted-foreground sm:block">{user.email}</span>
                <button
                  onClick={signOut}
                  className="flex items-center gap-1 rounded-md px-2 py-1.5 text-xs text-muted-foreground transition-smooth hover:bg-muted hover:text-foreground"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sign out
                </button>
              </div>
            </div>
          </header>

          <main className="mx-auto w-full max-w-[1600px] flex-1 p-5 animate-fade-in">
            {children}
          </main>
          <FooterBar />
        </div>
      </div>
    </div>
  )
}
