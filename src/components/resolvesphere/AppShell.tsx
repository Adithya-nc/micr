import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { AlertTriangle, ClipboardCheck, FileSearch, LayoutDashboard, Radar, ShieldCheck, SlidersHorizontal, Activity, ShieldAlert } from 'lucide-react'
import { StatusBadge } from '@/components/resolvesphere/StatusBadge'
import { FooterBar } from '@/components/resolvesphere/FooterBar'
import { AccessRestrictedPanel } from '@/components/resolvesphere/AccessRestrictedPanel'
import { ThemeToggle } from '@/components/resolvesphere/ThemeToggle'
import { DemoAuthRoleSwitcher } from '@/components/resolvesphere/DemoAuthRoleSwitcher'
import { canAccess, useDemoAuth, type PageKey } from '@/lib/demoAuth'
import { useBackendStatus } from '@/lib/resolvesphereApi'

const navigation: { label: string; icon: typeof LayoutDashboard; path: string; page: PageKey }[] = [
  { label: 'Command Center', icon: LayoutDashboard, path: '/app', page: 'command-center' },
  { label: 'Active Cases', icon: FileSearch, path: '/app/cases', page: 'active-case' },
  { label: 'Escalations', icon: AlertTriangle, path: '/escalations', page: 'escalations' },
  { label: 'Approvals', icon: ClipboardCheck, path: '/approvals', page: 'approvals' },
  { label: 'Root-Cause Radar', icon: Radar, path: '/radar', page: 'radar' },
  { label: 'Testing / Admin', icon: SlidersHorizontal, path: '/testing', page: 'testing' },
  { label: 'Admin', icon: ShieldAlert, path: '/admin', page: 'testing' },
  { label: 'Backend Status', icon: Activity, path: '/status', page: 'status' },
]

export function AppShell({ page, title, children }: { page: PageKey; title: string; children: ReactNode }) {
  const { pathname } = useLocation()
  const { role } = useDemoAuth()
  const { data: status } = useBackendStatus()
  const allowed = canAccess(role, page)
  return (
    <div className="min-h-screen bg-background">
      <div className="grid min-h-screen lg:grid-cols-[15rem_minmax(0,1fr)]">
        <aside className="border-b bg-card lg:border-b-0 lg:border-r">
          <div className="border-b px-5 py-5">
            <Link to="/" className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <span className="font-semibold">ResolveSphere</span>
            </Link>
            <p className="mt-1 text-xs text-muted-foreground">Evidence-driven resolution</p>
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
          <div className="hidden border-t p-4 text-xs text-muted-foreground lg:block">[DEMO ENVIRONMENT]<br />Synthetic enterprise data only</div>
        </aside>
        <div className="flex min-w-0 flex-col">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b bg-card px-5 py-3">
            <div className="flex items-center gap-2 text-sm">
              <Activity className="h-4 w-4 text-primary" />
              <span>Control Plane</span>
              <StatusBadge value={status?.overall_connected ? 'Backend connected' : 'Backend pending'} tone={status?.overall_connected ? 'success' : 'warning'} />
            </div>
            <div className="flex items-center gap-3">
              <DemoAuthRoleSwitcher compact />
              <ThemeToggle />
            </div>
          </header>
          <main className="mx-auto w-full max-w-[1600px] flex-1 p-5">
            {allowed ? (
              <>
                <h1 className="mb-4 text-xl font-semibold">{title}</h1>
                {children}
              </>
            ) : (
              <AccessRestrictedPanel role={role} page={page} />
            )}
          </main>
          <FooterBar />
        </div>
      </div>
    </div>
  )
}
