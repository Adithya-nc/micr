import { Link } from 'react-router-dom'

import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileCheck2,
  MessageSquare,
  Radar,
  ShieldCheck,
  Sparkles,
  Workflow,
  Zap,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/resolvesphere/ThemeToggle'

const scenarios = [
  {
    icon: Workflow,
    number: '01',
    title: 'Investigate',
    description:
      'The system gathers order, payment, customer and policy evidence before making a decision.',
  },
  {
    icon: ShieldCheck,
    number: '02',
    title: 'Policy-gate',
    description:
      'Deterministic controls validate evidence quality, risk, freshness and contradictions.',
  },
  {
    icon: Zap,
    number: '03',
    title: 'Act safely',
    description:
      'Approved actions are executed with traceability, idempotency and controlled escalation.',
  },
  {
    icon: FileCheck2,
    number: '04',
    title: 'Verify',
    description:
      'The system checks the authoritative post-action state before declaring resolution.',
  },
]

const metrics = [
  ['01', 'Evidence-first decisions'],
  ['02', 'Policy-controlled actions'],
  ['03', 'Human escalation when needed'],
  ['04', 'Verified outcomes'],
]

export default function Index() {
  return (
    <div className="min-h-screen overflow-hidden bg-[#f8fafc] text-slate-950 dark:bg-slate-950 dark:text-white">

      {/* NAVIGATION */}
      <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/85 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/85">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8">
          <Link
            to="/"
            className="flex items-center gap-3"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-white shadow-lg dark:bg-white dark:text-slate-950">
              <ShieldCheck className="h-5 w-5" />
            </div>

            <div>
              <div className="text-sm font-bold tracking-tight">
                ResolveSphere
              </div>
              <div className="hidden text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-400 sm:block">
                Autonomous Resolution
              </div>
            </div>
          </Link>

          <nav className="hidden items-center gap-7 md:flex">
            <a
              href="#how"
              className="text-sm font-medium text-slate-500 transition hover:text-slate-950 dark:hover:text-white"
            >
              How it works
            </a>

            <a
              href="#capabilities"
              className="text-sm font-medium text-slate-500 transition hover:text-slate-950 dark:hover:text-white"
            >
              Capabilities
            </a>

            <Link
              to="/chat"
              className="text-sm font-medium text-slate-500 transition hover:text-slate-950 dark:hover:text-white"
            >
              Customer portal
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />

            <Link
              to="/login"
              className="hidden rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 sm:block dark:text-slate-300 dark:hover:bg-slate-900"
            >
              Sign in
            </Link>

            <Button
              asChild
              className="rounded-lg bg-slate-950 px-4 shadow-lg shadow-slate-950/10 hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
            >
              <Link to="/login">
                Open workspace
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* HERO */}
      <main>
        <section className="relative">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.12),transparent_38%)]" />

          <div className="mx-auto grid max-w-7xl gap-14 px-5 pb-20 pt-16 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:px-8 lg:pb-28 lg:pt-24">

            <div>
              <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300">
                <Sparkles className="h-3.5 w-3.5" />
                AI-powered case resolution
              </div>

              <h1 className="max-w-4xl text-5xl font-black leading-[0.98] tracking-[-0.045em] sm:text-6xl lg:text-7xl">
                Don't answer
                <br />
                the ticket.
                <br />
                <span className="text-blue-600 dark:text-blue-400">
                  Resolve the case.
                </span>
              </h1>

              <p className="mt-7 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg dark:text-slate-400">
                ResolveSphere turns customer support from a
                reply-generation workflow into an evidence-driven
                resolution system that investigates, decides, acts,
                verifies and escalates.
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Button
                  asChild
                  size="lg"
                  className="h-12 rounded-xl bg-slate-950 px-6 text-sm font-bold shadow-xl shadow-slate-950/15 hover:bg-slate-800 dark:bg-white dark:text-slate-950"
                >
                  <Link to="/login">
                    Enter support workspace
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="h-12 rounded-xl px-6 text-sm font-bold"
                >
                  <Link to="/chat">
                    Try customer experience
                  </Link>
                </Button>
              </div>

              <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3">
                {[
                  'Evidence-first',
                  'Policy-controlled',
                  'Human-in-the-loop',
                  'Verified outcomes',
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-2 text-xs font-semibold text-slate-500"
                  >
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            {/* PRODUCT PREVIEW */}
            <div className="relative">
              <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-blue-500/10 blur-3xl" />

              <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-[0_30px_80px_-30px_rgba(15,23,42,.35)] dark:border-slate-800 dark:bg-slate-900">
                <div className="flex h-12 items-center justify-between border-b border-slate-200 px-4 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="text-xs font-bold">
                      Command Center
                    </span>
                  </div>

                  <span className="text-[10px] font-semibold text-slate-400">
                    LIVE OPERATIONS
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 p-4">
                  {[
                    ['Open cases', '24'],
                    ['Investigating', '08'],
                    ['Needs human', '03'],
                    ['Resolved', '71'],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950"
                    >
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                        {label}
                      </p>

                      <p className="mt-2 text-2xl font-black">
                        {value}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mx-4 mb-4 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="grid grid-cols-[1.4fr_.8fr_.8fr] border-b border-slate-200 bg-slate-50 px-4 py-3 text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:border-slate-800 dark:bg-slate-950">
                    <span>Case</span>
                    <span>Status</span>
                    <span>Risk</span>
                  </div>

                  {[
                    ['PAY-7821', 'Resolved', 'Low'],
                    ['ORD-4310', 'Investigating', 'Medium'],
                    ['REF-1190', 'Escalated', 'High'],
                    ['PAY-7814', 'Verified', 'Low'],
                  ].map(([id, status, risk]) => (
                    <div
                      key={id}
                      className="grid grid-cols-[1.4fr_.8fr_.8fr] border-b border-slate-100 px-4 py-3 text-xs last:border-0 dark:border-slate-800"
                    >
                      <span className="font-bold">
                        {id}
                      </span>

                      <span className="text-slate-500">
                        {status}
                      </span>

                      <span className="text-slate-500">
                        {risk}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mx-4 mb-4 rounded-xl bg-slate-950 p-4 text-white dark:bg-white dark:text-slate-950">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-wider opacity-60">
                        Resolution confidence
                      </p>
                      <p className="mt-1 text-2xl font-black">
                        94.8%
                      </p>
                    </div>

                    <Radar className="h-8 w-8 opacity-70" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PROOF BAR */}
        <section className="border-y border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-slate-200 sm:grid-cols-4 dark:divide-slate-800">
            {metrics.map(([number, label]) => (
              <div
                key={number}
                className="flex items-center gap-3 px-5 py-5 lg:px-8"
              >
                <span className="text-xs font-black text-blue-600 dark:text-blue-400">
                  {number}
                </span>

                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section
          id="how"
          className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28"
        >
          <div className="max-w-2xl">
            <p className="section-label">
              Resolution architecture
            </p>

            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
              From complaint to verified outcome.
            </h2>

            <p className="mt-4 text-slate-500">
              Every case moves through a controlled resolution
              lifecycle instead of generating an unsupported answer.
            </p>
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {scenarios.map((item) => {
              const Icon = item.icon

              return (
                <div
                  key={item.number}
                  className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-950 text-white dark:bg-white dark:text-slate-950">
                      <Icon className="h-5 w-5" />
                    </div>

                    <span className="text-xs font-black text-slate-300 dark:text-slate-700">
                      {item.number}
                    </span>
                  </div>

                  <h3 className="mt-7 text-lg font-bold">
                    {item.title}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {item.description}
                  </p>

                  <div className="mt-6 flex items-center gap-1 text-xs font-bold text-blue-600 opacity-0 transition group-hover:opacity-100 dark:text-blue-400">
                    Resolution step
                    <ChevronRight className="h-3.5 w-3.5" />
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* CAPABILITIES */}
        <section
          id="capabilities"
          className="border-y border-slate-200 bg-slate-950 text-white dark:border-slate-800"
        >
          <div className="mx-auto grid max-w-7xl gap-12 px-5 py-20 lg:grid-cols-2 lg:px-8 lg:py-28">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-400">
                Why it matters
              </p>

              <h2 className="mt-4 max-w-xl text-3xl font-black tracking-tight sm:text-4xl">
                AI that is accountable for the outcome.
              </h2>

              <p className="mt-5 max-w-xl leading-7 text-slate-400">
                ResolveSphere doesn't stop at generating a response.
                It connects evidence, policy, execution and
                verification into one operational loop.
              </p>

              <Button
                asChild
                className="mt-8 rounded-xl bg-white text-slate-950 hover:bg-slate-200"
              >
                <Link to="/login">
                  Explore the workspace
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {[
                {
                  icon: FileCheck2,
                  title: 'Evidence graph',
                  text: 'Trace every decision back to authoritative records.',
                },
                {
                  icon: ShieldCheck,
                  title: 'Policy gate',
                  text: 'Prevent unsafe or unsupported actions.',
                },
                {
                  icon: Clock3,
                  title: 'Fast resolution',
                  text: 'Reduce repetitive support work through automation.',
                },
                {
                  icon: MessageSquare,
                  title: 'Customer loop',
                  text: 'Ask targeted questions only when evidence is missing.',
                },
              ].map((item) => {
                const Icon = item.icon

                return (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 transition hover:bg-white/[0.07]"
                  >
                    <Icon className="h-5 w-5 text-blue-400" />

                    <h3 className="mt-5 font-bold">
                      {item.title}
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-slate-400">
                      {item.text}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28">
          <div className="relative overflow-hidden rounded-[2rem] bg-blue-600 px-7 py-12 text-white shadow-2xl shadow-blue-600/20 sm:px-12">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-2xl" />

            <div className="relative max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-100">
                Ready for the demo?
              </p>

              <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
                Show the judges the full resolution loop.
              </h2>

              <p className="mt-4 max-w-2xl text-sm leading-6 text-blue-100">
                Investigate a case, inspect the evidence, execute a
                controlled action and verify the final state from one
                workspace.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button
                  asChild
                  className="rounded-xl bg-white text-blue-700 hover:bg-blue-50"
                >
                  <Link to="/login">
                    Launch workspace
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  className="rounded-xl border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
                >
                  <Link to="/chat">
                    Customer experience
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-8 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            <span className="text-sm font-bold">
              ResolveSphere
            </span>
          </div>

          <div className="flex gap-5 text-xs text-slate-500">
            <Link
              to="/terms"
              className="hover:text-slate-950 dark:hover:text-white"
            >
              Terms
            </Link>

            <Link
              to="/privacy"
              className="hover:text-slate-950 dark:hover:text-white"
            >
              Privacy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}