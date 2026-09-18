import { Link } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import { DemoAuthRoleSwitcher } from '@/components/resolvesphere/DemoAuthRoleSwitcher'

const links = [
  { label: 'Overview', href: '#overview' },
  { label: 'Architecture', href: '#architecture' },
  { label: 'Demo Scenarios', href: '#scenarios' },
  { label: 'App', href: '/app' },
  { label: 'Status', href: '/status' },
]

export function LandingHeader() {
  return (
    <header className="border-b bg-card">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <span className="font-semibold">ResolveSphere AI</span>
        </div>
        <nav aria-label="Primary" className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          {links.map((link) =>
            link.href.startsWith('#') ? (
              <a key={link.href} href={link.href} className="hover:text-foreground">{link.label}</a>
            ) : (
              <Link key={link.href} to={link.href} className="hover:text-foreground">{link.label}</Link>
            )
          )}
        </nav>
        <DemoAuthRoleSwitcher compact />
      </div>
    </header>
  )
}

export function LandingSection({ id, eyebrow, title, children }: { id?: string; eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mx-auto max-w-6xl px-5 py-10">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{eyebrow}</p>
      <h2 className="mt-1 text-2xl font-semibold">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  )
}
