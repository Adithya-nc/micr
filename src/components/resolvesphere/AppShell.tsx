import type { ReactNode } from 'react'
import {
  Link,
  useLocation,
  Navigate,
} from 'react-router-dom'

import {
  AlertTriangle,
  BookOpen,
  ChartLine,
  LayoutDashboard,
  Inbox,
  Settings,
  ShieldCheck,
  LogOut,
  ChevronRight,
  UserRound,
  Menu,
  X,
  CheckCircle2,
  Shield,
  ClipboardCheck,
} from 'lucide-react'

import { useState } from 'react'

import { FooterBar } from '@/components/resolvesphere/FooterBar'
import { ThemeToggle } from '@/components/resolvesphere/ThemeToggle'
import { useAuth } from '@/lib/auth'

const navigation = [
  {
    label: 'Command Center',
    icon: LayoutDashboard,
    path: '/app',
    page: 'command-center',
    roles: ['support_agent', 'manager', 'admin'],
  },
  {
    label: 'Active Cases',
    icon: Inbox,
    path: '/app/cases',
    page: 'active-case',
    roles: ['support_agent', 'manager', 'admin'],
  },
  {
    label: 'Escalations',
    icon: AlertTriangle,
    path: '/escalations',
    page: 'escalations',
    roles: ['support_agent', 'manager', 'admin'],
  },
  {
    label: 'Approvals',
    icon: ClipboardCheck,
    path: '/approvals',
    page: 'approvals',
    roles: ['manager', 'admin'],
  },
  {
    label: 'Knowledge Base',
    icon: BookOpen,
    path: '/knowledge',
    page: 'knowledge',
    roles: ['support_agent', 'manager', 'admin'],
  },
  {
    label: 'Analytics',
    icon: ChartLine,
    path: '/radar',
    page: 'radar',
    roles: ['manager', 'admin'],
  },
  {
    label: 'Settings',
    icon: Settings,
    path: '/settings',
    page: 'settings',
    roles: ['support_agent', 'manager', 'admin'],
  },
  {
    label: 'Admin',
    icon: Shield,
    path: '/admin',
    page: 'admin',
    roles: ['admin'],
  },
]

export function AppShell({
  page,
  title,
  subtitle,
  actions,
  children,
}: {
  page: string
  title: string
  subtitle?: string
  actions?: ReactNode
  children: ReactNode
}) {
  const { pathname } = useLocation()

  const {
    user,
    role,
    signOut,
  } = useAuth()

  const [mobileOpen, setMobileOpen] =
    useState(false)

  if (!user || !role) {
    return (
      <Navigate
        to="/login"
        replace
      />
    )
  }

  const currentNavigation =
    navigation.find(
      (item) => item.page === page
    )

  if (
    currentNavigation &&
    !currentNavigation.roles.includes(role)
  ) {
    return (
      <Navigate
        to="/app"
        replace
      />
    )
  }

  const visibleNavigation =
    navigation.filter((item) =>
      item.roles.includes(role)
    )

  const displayName =
    user.user_metadata?.name ||
    user.email?.split('@')[0] ||
    'User'

  const initials =
    displayName
      .split(' ')
      .map((part: string) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()

  const Sidebar = () => (
    <aside className="flex h-full min-h-screen flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <div className="flex h-20 items-center border-b border-slate-200 px-6 dark:border-slate-800">
        <Link
          to="/app"
          className="group flex items-center gap-3"
          onClick={() =>
            setMobileOpen(false)
          }
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-white shadow-lg shadow-slate-900/10 dark:bg-white dark:text-slate-950">
            <ShieldCheck className="h-5 w-5" />
          </div>

          <div>
            <div className="text-sm font-bold tracking-tight">
              ResolveSphere
            </div>

            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Intelligence Platform
            </div>
          </div>
        </Link>
      </div>

      <div className="px-4 pt-6">
        <p className="mb-3 px-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
          Workspace
        </p>

        <nav
          aria-label="Primary"
          className="space-y-1"
        >
          {visibleNavigation.map(
            (item) => {
              const Icon = item.icon

              const active =
                pathname === item.path ||
                pathname.startsWith(
                  `${item.path}/`
                )

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() =>
                    setMobileOpen(false)
                  }
                  className={[
                    'group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all',
                    active
                      ? 'bg-slate-950 text-white shadow-md shadow-slate-950/10 dark:bg-white dark:text-slate-950'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white',
                  ].join(' ')}
                >
                  <Icon className="h-[18px] w-[18px] shrink-0" />

                  <span className="flex-1">
                    {item.label}
                  </span>

                  {active && (
                    <ChevronRight className="h-4 w-4 opacity-60" />
                  )}
                </Link>
              )
            }
          )}
        </nav>
      </div>

      <div className="mt-auto p-4">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white dark:bg-white dark:text-slate-900">
              {initials}
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">
                {displayName}
              </p>

              <p className="truncate text-[11px] capitalize text-slate-500">
                {role.replace('_', ' ')}
              </p>
            </div>
          </div>

          <button
            onClick={signOut}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400 dark:hover:bg-red-950/30"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </button>
        </div>
      </div>
    </aside>
  )

  return (
    <div className="min-h-screen bg-[#f6f8fb] dark:bg-slate-950">
      <div className="hidden lg:grid lg:min-h-screen lg:grid-cols-[17rem_minmax(0,1fr)]">
        <Sidebar />

        <div className="flex min-w-0 flex-col">
          <Header
            title={title}
            subtitle={subtitle}
            actions={actions}
            displayName={displayName}
            role={role}
          />

          <main className="flex-1 px-5 py-6 lg:px-8 lg:py-8">
            <div className="mx-auto w-full max-w-[1700px]">
              {children}
            </div>
          </main>

          <FooterBar />
        </div>
      </div>

      <div className="flex min-h-screen flex-col lg:hidden">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
          <Link
            to="/app"
            className="flex items-center gap-2"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-950 text-white dark:bg-white dark:text-slate-950">
              <ShieldCheck className="h-4 w-4" />
            </div>

            <span className="text-sm font-bold">
              ResolveSphere
            </span>
          </Link>

          <button
            onClick={() =>
              setMobileOpen((value) => !value)
            }
            className="rounded-lg border border-slate-200 p-2 dark:border-slate-800"
          >
            {mobileOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </header>

        {mobileOpen && (
          <div className="fixed inset-0 top-16 z-50 bg-white dark:bg-slate-950">
            <Sidebar />
          </div>
        )}

        <div className="flex-1">
          <div className="border-b border-slate-200 bg-white px-4 py-5 dark:border-slate-800 dark:bg-slate-950">
            <Header
              title={title}
              subtitle={subtitle}
              actions={actions}
              displayName={displayName}
              role={role}
              mobile
            />
          </div>

          <main className="px-4 py-5">
            {children}
          </main>
        </div>

        <FooterBar />
      </div>
    </div>
  )
}

function Header({
  title,
  subtitle,
  actions,
  displayName,
  role,
  mobile = false,
}: {
  title: string
  subtitle?: string
  actions?: ReactNode
  displayName: string
  role: string
  mobile?: boolean
}) {
  const { signOut } = useAuth()

  return (
    <header
      className={[
        'border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950',
        mobile
          ? 'border-b-0 px-0'
          : 'px-8 py-5',
      ].join(' ')}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Operational workspace
          </div>

          <h1 className="truncate text-xl font-bold tracking-tight text-slate-950 dark:text-white">
            {title}
          </h1>

          {subtitle && (
            <p className="mt-1 max-w-2xl text-sm text-slate-500">
              {subtitle}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {actions}

          {!mobile && (
            <>
              <div className="hidden h-8 w-px bg-slate-200 sm:block dark:bg-slate-800" />

              <div className="hidden items-center gap-2 sm:flex">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-900">
                  <UserRound className="h-4 w-4 text-slate-500" />
                </div>

                <div className="max-w-[150px]">
                  <p className="truncate text-xs font-semibold">
                    {displayName}
                  </p>

                  <p className="truncate text-[10px] capitalize text-slate-400">
                    {role.replace('_', ' ')}
                  </p>
                </div>
              </div>

              <ThemeToggle />

              <button
                onClick={signOut}
                className="hidden rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 sm:block dark:border-slate-800"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}