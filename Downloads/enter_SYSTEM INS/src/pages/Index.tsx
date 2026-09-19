import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/resolvesphere/ThemeToggle'
import {
  ShieldCheck, MessageSquare, LayoutDashboard, CheckCircle2,
  AlertTriangle, Zap, ArrowRight, Bot, Brain, Search, Lock
} from 'lucide-react'

const scenarios = [
  {
    icon: CheckCircle2,
    title: 'Autonomous Resolution',
    desc: 'Payment verified, order missing, refund issued and confirmed — zero human touch.',
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10 border-emerald-500/20',
  },
  {
    icon: MessageSquare,
    title: 'Evidence Gap',
    desc: 'Missing confirmation triggers one targeted customer question before acting.',
    color: 'text-blue-500',
    bg: 'bg-blue-500/10 border-blue-500/20',
  },
  {
    icon: AlertTriangle,
    title: 'Contradiction Detected',
    desc: 'Conflicting records block automatic action and escalate to a human specialist.',
    color: 'text-amber-500',
    bg: 'bg-amber-500/10 border-amber-500/20',
  },
  {
    icon: Zap,
    title: 'Root-Cause Radar',
    desc: 'Recurring failures correlate with deployment events for systemic prevention.',
    color: 'text-purple-500',
    bg: 'bg-purple-500/10 border-purple-500/20',
  },
]

const pillars = [
  {
    icon: Search,
    title: 'Evidence-Driven',
    desc: 'Every claim references an authoritative record from payment, order, or refund systems before any action.',
  },
  {
    icon: Lock,
    title: 'Policy-Gated',
    desc: 'Deterministic controls validate sufficiency, freshness, contradictions, and risk score before execution.',
  },
  {
    icon: CheckCircle2,
    title: 'Verified Resolution',
    desc: 'Cases resolve only after authoritative post-action verification confirms the expected backend state.',
  },
]

const Index = () => (
  <div className="flex min-h-screen flex-col bg-background">
    {/* Header */}
    <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <ShieldCheck className="h-4.5 w-4.5 text-primary" />
          </div>
          <span className="font-semibold tracking-tight">ResolveSphere <span className="gradient-text">AI</span></span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/chat"
            className="hidden rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-smooth hover:bg-muted hover:text-foreground sm:block"
          >
            Customer chat
          </Link>
          <Link
            to="/login"
            className="hidden rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-smooth hover:bg-muted hover:text-foreground sm:block"
          >
            Sign in
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </header>

    <main className="flex-1">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-50" />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-6xl px-5 py-24 sm:py-32">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border bg-card/80 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur-sm">
            <span className="dot-pulse" />
            Autonomous · Evidence-Driven · Verified
          </div>
          <h1 className="max-w-3xl text-5xl font-extrabold leading-tight tracking-tight sm:text-6xl lg:text-7xl">
            Don't Answer the{' '}
            <span className="gradient-text">Ticket.</span>
            <br />
            <span className="gradient-text">Resolve</span> the Case.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Autonomous customer support that investigates evidence, applies policy,
            takes safe action, verifies the result, and escalates intelligently when needed.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Button asChild size="lg" className="group gap-2 rounded-xl px-6 shadow-md shadow-primary/20 transition-smooth hover:shadow-lg hover:shadow-primary/30">
              <Link to="/chat">
                <Bot className="h-4 w-4" />
                Start customer chat
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-xl px-6 transition-smooth hover:bg-muted">
              <Link to="/login">
                <LayoutDashboard className="h-4 w-4" />
                Open support workspace
              </Link>
            </Button>
          </div>

          {/* Stats row */}
          <div className="mt-14 flex flex-wrap gap-8">
            {[
              { value: '4 paths', label: 'resolution outcomes' },
              { value: '< 2s', label: 'avg investigation time' },
              { value: '0 guesses', label: 'evidence-backed only' },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-2xl font-bold gradient-text">{stat.value}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Scenarios */}
      <section className="border-t bg-muted/40">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <div className="mb-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary">
            <Brain className="h-3.5 w-3.5" />
            Four evaluated case paths
          </div>
          <h2 className="text-3xl font-bold tracking-tight">
            Every case follows a deterministic path
          </h2>
          <p className="mt-2 text-muted-foreground">
            Each scenario demonstrates a distinct, auditable resolution outcome.
          </p>
          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            {scenarios.map((s, i) => {
              const Icon = s.icon
              return (
                <div
                  key={s.title}
                  className={`card-elevated rounded-xl border p-6 transition-smooth hover:-translate-y-0.5 hover:shadow-lg animate-slide-up`}
                  style={{ animationDelay: `${i * 80}ms`, animationFillMode: 'both' }}
                >
                  <div className={`mb-4 inline-flex rounded-lg border p-2.5 ${s.bg}`}>
                    <Icon className={`h-5 w-5 ${s.color}`} />
                  </div>
                  <h3 className="font-semibold">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Pillars */}
      <section className="border-t">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <div className="grid gap-8 md:grid-cols-3">
            {pillars.map((p) => {
              const Icon = p.icon
              return (
                <div key={p.title} className="group">
                  <div className="mb-4 inline-flex rounded-xl bg-primary/10 p-3 transition-smooth group-hover:bg-primary/15">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold">{p.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t bg-gradient-to-br from-primary/8 via-primary/4 to-transparent">
        <div className="mx-auto max-w-6xl px-5 py-16 text-center">
          <h2 className="text-2xl font-bold tracking-tight">Ready to see it in action?</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Submit a support scenario and watch the AI investigate and resolve it in real time.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="rounded-xl gap-2 shadow-md shadow-primary/20 transition-smooth hover:shadow-lg hover:shadow-primary/30">
              <Link to="/chat">
                <Bot className="h-4 w-4" /> Try customer chat
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-xl gap-2">
              <Link to="/login">Sign in to workspace</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>

    {/* Footer */}
    <footer className="border-t bg-card px-5 py-5">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">ResolveSphere AI</span>
        </div>
        <nav className="flex flex-wrap gap-5 text-xs text-muted-foreground">
          <Link to="/chat" className="transition-smooth hover:text-foreground">Customer Chat</Link>
          <Link to="/submit" className="transition-smooth hover:text-foreground">Submit Case</Link>
          <Link to="/terms" className="transition-smooth hover:text-foreground">Terms</Link>
          <Link to="/privacy" className="transition-smooth hover:text-foreground">Privacy</Link>
        </nav>
      </div>
    </footer>
  </div>
)

export default Index
