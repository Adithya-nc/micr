import { roleLabels, type DemoRole, type PageKey } from '@/lib/demoAuth'
import { DemoAuthRoleSwitcher } from '@/components/resolvesphere/DemoAuthRoleSwitcher'

export function AccessRestrictedPanel({ role, page }: { role: DemoRole; page: PageKey }) {
  return (
    <section className="rounded-lg border border-destructive/40 bg-destructive/5 p-5">
      <h1 className="text-lg font-semibold text-destructive">Access Restricted</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        The {roleLabels[role]} role does not have permission to view the {page.replace('-', ' ')} page in this demo environment.
      </p>
      <div className="mt-4">
        <DemoAuthRoleSwitcher compact />
      </div>
    </section>
  )
}
