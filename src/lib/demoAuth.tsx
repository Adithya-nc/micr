import { type ReactNode } from 'react'
import { useAuth } from './auth'

export type DemoRole = 'customer' | 'support_agent' | 'manager' | 'admin'

export type PageKey =
  | 'command-center'
  | 'active-case'
  | 'escalations'
  | 'approvals'
  | 'radar'
  | 'testing'
  | 'status'

export const roleLabels: Record<DemoRole, string> = {
  customer: 'Customer',
  support_agent: 'Support Agent',
  manager: 'Manager',
  admin: 'Admin',
}

const pageAccess: Record<PageKey, DemoRole[]> = {
  'command-center': ['support_agent', 'manager', 'admin'],
  'active-case': ['support_agent', 'manager', 'admin'],
  escalations: ['support_agent', 'manager', 'admin'],
  approvals: ['support_agent', 'manager', 'admin'],
  radar: ['manager', 'admin'],
  testing: ['admin'],
  status: ['admin'],
}

export function canAccess(role: DemoRole, page: PageKey): boolean {
  return pageAccess[page].includes(role)
}

export function DemoAuthProvider({ children }: { children: ReactNode }) {
  return <>{children}</>
}

export function useDemoAuth() {
  const { role, user } = useAuth()

  const resolvedRole: DemoRole =
    role === 'support_agent'
      ? 'support_agent'
      : role === 'manager'
        ? 'manager'
        : role === 'customer'
          ? 'customer'
          : 'customer'

  return {
    role: resolvedRole,
    setRole: (_role: DemoRole) => {},
    user,
  }
}