import { useAuth } from '@/lib/auth'

const roleLabels: Record<string, string> = {
  customer: 'Customer',
  support_agent: 'Support Agent',
  manager: 'Manager',
  admin: 'Admin',
}

export function AccessRestrictedPanel({ page }: { page: string }) {
  const { role } = useAuth()
  return (
    <section className="rounded-lg border border-destructive/40 bg-destructive/5 p-5">
      <h1 className="text-lg font-semibold text-destructive">Access Restricted</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        The {role ? roleLabels[role] : 'current'} role does not have permission to view the {page.replace('-', ' ')} page.
      </p>
    </section>
  )
}
