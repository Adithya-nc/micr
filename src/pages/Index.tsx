import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/resolvesphere/ThemeToggle'
import { ShieldCheck, MessageSquare, LayoutDashboard, CheckCircle2, AlertTriangle, Zap } from 'lucide-react'

const scenarios = [
  { icon: CheckCircle2, title: 'Autonomous Resolution', desc: 'Payment verified, order missing, refund issued and confirmed.' },
  { icon: MessageSquare, title: 'Evidence Gap', desc: 'Missing confirmation triggers one targeted customer question.' },
  { icon: AlertTriangle, title: 'Contradiction Detected', desc: 'Conflicting records block action and escalate to human.' },
  { icon: Zap, title: 'Root-Cause Radar', desc: 'Recurring failures correlate with deployment events.' },
]

const Index = () => (
  <div className="flex min-h-screen flex-col bg-background">
    <header className="border-b bg-card">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <span className="font-semibold">ResolveSphere AI</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/chat" className="text-sm text-muted-foreground hover:text-foreground">Customer chat</Link>
          <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground">Sign in</Link>
          <ThemeToggle />
        </div>
      </div>
    </header>

    <main className="flex-1">
      <section className="mx-auto max-w-6xl px-5 py-20">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">DON'T ANSWER THE TICKET. RESOLVE THE CASE.</h1>
          <p className="mt-5 text-lg text-muted-foreground">
            Autonomous customer support that investigates evidence, applies policy, takes safe action, verifies the result, and escalates when needed.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg"><Link to="/chat">Start customer chat</Link></Button>
            <Button asChild variant="outline" size="lg"><Link to="/login">Open support workspace</Link></Button>
          </div>
        </div>
      </section>

      <section className="border-t bg-card">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <h2 className="text-2xl font-semibold">Four evaluated case paths</h2>
          <p className="mt-2 text-sm text-muted-foreground">Each scenario demonstrates a different resolution outcome.</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {scenarios.map((s) => {
              const Icon = s.icon
              return (
                <div key={s.title} className="rounded-lg border bg-background p-5">
                  <div className="flex items-start gap-3">
                    <Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <div>
                      <h3 className="font-medium">{s.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <h3 className="font-semibold">Evidence-driven</h3>
            <p className="mt-2 text-sm text-muted-foreground">Every claim references an authoritative record from payment, order, or refund systems.</p>
          </div>
          <div>
            <h3 className="font-semibold">Policy-gated</h3>
            <p className="mt-2 text-sm text-muted-foreground">Deterministic controls validate sufficiency, freshness, contradictions, and risk before any action.</p>
          </div>
          <div>
            <h3 className="font-semibold">Verified resolution</h3>
            <p className="mt-2 text-sm text-muted-foreground">Cases resolve only after authoritative post-action verification confirms the expected state.</p>
          </div>
        </div>
      </section>
    </main>

    <footer className="border-t bg-card px-5 py-4">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
        <span>ResolveSphere AI</span>
        <nav className="flex flex-wrap gap-4">
          <Link to="/terms" className="hover:text-foreground">Terms</Link>
          <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
        </nav>
      </div>
    </footer>
  </div>
)

export default Index
