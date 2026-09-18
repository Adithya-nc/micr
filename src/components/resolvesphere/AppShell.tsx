import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { AlertTriangle, BookOpen, ChartLine, LayoutDashboard, Inbox, Settings, ShieldCheck } from 'lucide-react'
import { FooterBar } from '@/components/resolvesphere/FooterBar'
import { AccessRestrictedPanel } from '@/components/resolvesphere/AccessRestrictedPanel'
import { ThemeToggle } from '@/components/resolvesphere/ThemeToggle'
import { DemoAuthRoleSwitcher } from '@/components/resolvesphere/DemoAuthRoleSwitcher'
import { canAccess, useDemoAuth, type PageKey } from '@/lib/demoAuth'

const navigation: { label: string; icon: typeof LayoutDashboard; path: string; page: PageKey }[] = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/app', page: 'command-center' },
  { label: 'Active Cases', icon: Inbox, path: '/app/cases', page: 'active-case' },
  { label: 'Escalations', icon: AlertTriangle, path: '/escalations', page: 'escalations' },
  { label: 'Knowledge Base', icon: BookOpen, path: '/knowledge', page: 'escalations' },
  { label: 'Analytics', icon: ChartLine, path: '/radar', page: 'radar' },
  { label: 'Settings', icon: Settings, path: '/settings', page: 'command-center' },
]

export function AppShell({ page, title, subtitle, actions, children }: { page: PageKey; title: string; subtitle?: string; actions?: ReactNode; children: ReactNode }) {
  const { pathname } = useLocation()
  const { role } = useDemoAuth()
  const allowed = canAccess(role, page)

  return (
    <div className="min-h-screen bg-background">
      <div className="grid min-h-screen lg:grid-cols-[15rem_minmax(0,1fr)]">
        <aside className="border-b bg-card lg:border-b-0 lg:border-r">
          <div className="border-b px-5 py-4">
            <Link to="/" className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <span className="font-semibold">ResolveSphere</span>
            </Link>
          </div>
          <nav aria-label="Primary" className="flex gap-1 overflow-x-auto p-3 lg:flex-col">
            {navigation.map((item) => {
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
              <DemoAuthRoleSwitcher compact />
              <ThemeToggle />
            </div>
          </header>
          <main className="mx-auto w-full max-w-[1600px] flex-1 p-5">
            {allowed ? children : <AccessRestrictedPanel role={role} page={page} />}
          </main>
          <FooterBar />
        </div>
      </div>
    </div>
  )
}
