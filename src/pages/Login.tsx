import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  useAuth,
  demoAccounts,
} from '@/lib/auth'

export default function Login() {
  const navigate = useNavigate()

  const { signIn } = useAuth()

  const [email, setEmail] =
    useState('')

  const [password, setPassword] =
    useState('')

  const [error, setError] =
    useState('')

  const [loading, setLoading] =
    useState(false)

  const handleSignIn = async (
    event: React.FormEvent
  ) => {
    event.preventDefault()

    setError('')
    setLoading(true)

    const result =
      await signIn(email, password)

    setLoading(false)

    if (result.error) {
      setError(result.error.message)
      return
    }

    navigate('/app')
  }

  const fillDemo = (
    demoEmail: string
  ) => {
    const account =
      demoAccounts[demoEmail]

    if (!account) return

    setEmail(demoEmail)
    setPassword(account.password)
    setError('')
  }

  return (
    <div className="min-h-screen bg-[#f7f9fc] dark:bg-slate-950">
      <div className="grid min-h-screen lg:grid-cols-[1fr_0.85fr]">

        {/* BRAND PANEL */}
        <div className="relative hidden overflow-hidden bg-slate-950 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(37,99,235,.28),transparent_35%)]" />

          <div className="relative p-10">
            <Link
              to="/"
              className="inline-flex items-center gap-3"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-950">
                <ShieldCheck className="h-5 w-5" />
              </div>

              <span className="text-sm font-bold">
                ResolveSphere
              </span>
            </Link>
          </div>

          <div className="relative max-w-xl px-10 pb-16">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-blue-200">
              <Sparkles className="h-3.5 w-3.5" />
              AI Resolution Platform
            </div>

            <h1 className="text-5xl font-black leading-tight tracking-tight">
              Resolve customer
              <br />
              problems with
              <span className="text-blue-400">
                evidence.
              </span>
            </h1>

            <p className="mt-6 leading-7 text-slate-400">
              Investigate. Decide. Act. Verify.
              A controlled workflow for modern
              customer operations.
            </p>

            <div className="mt-8 space-y-3">
              {[
                'Evidence-driven investigation',
                'Policy-gated actions',
                'Human escalation',
                'Verified resolution',
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-2 text-sm text-slate-300"
                >
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="relative border-t border-white/10 px-10 py-5 text-xs text-slate-500">
            ResolveSphere AI · Operational Intelligence
          </div>
        </div>

        {/* FORM */}
        <div className="flex min-h-screen flex-col">
          <header className="flex items-center justify-between px-5 py-5 sm:px-8">
            <Link
              to="/"
              className="flex items-center gap-2 text-sm font-bold lg:hidden"
            >
              <ShieldCheck className="h-5 w-5" />
              ResolveSphere
            </Link>

            <Link
              to="/"
              className="ml-auto flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-950 dark:hover:text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to home
            </Link>
          </header>

          <main className="flex flex-1 items-center justify-center px-5 py-10">
            <div className="w-full max-w-md">

              <div className="mb-8">
                <p className="section-label">
                  Secure workspace
                </p>

                <h2 className="mt-3 text-3xl font-black tracking-tight">
                  Welcome back
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  Sign in to continue to your resolution workspace.
                </p>
              </div>

              <form
                onSubmit={handleSignIn}
                className="space-y-5"
              >
                <div className="space-y-2">
                  <Label htmlFor="email">
                    Email address
                  </Label>

                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) =>
                      setEmail(event.target.value)
                    }
                    placeholder="you@example.com"
                    className="h-11 rounded-xl"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">
                      Password
                    </Label>

                    <span className="text-[10px] font-medium text-slate-400">
                      Secure authentication
                    </span>
                  </div>

                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(event) =>
                      setPassword(event.target.value)
                    }
                    placeholder="Enter your password"
                    className="h-11 rounded-xl"
                    required
                  />
                </div>

                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="h-11 w-full rounded-xl bg-slate-950 font-bold hover:bg-slate-800 dark:bg-white dark:text-slate-950"
                >
                  {loading
                    ? 'Signing in...'
                    : 'Sign in'}

                  {!loading && (
                    <ArrowRight className="ml-2 h-4 w-4" />
                  )}
                </Button>
              </form>

              <div className="my-8 flex items-center gap-3">
                <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Demo access
                </span>
                <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
              </div>

              <div className="space-y-2">
                {Object.entries(
                  demoAccounts
                ).map(([demoEmail, info]) => (
                  <button
                    key={demoEmail}
                    type="button"
                    onClick={() =>
                      fillDemo(demoEmail)
                    }
                    className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-left transition hover:border-blue-300 hover:bg-blue-50/50 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-800"
                  >
                    <div>
                      <p className="text-xs font-bold">
                        {demoEmail}
                      </p>

                      <p className="mt-0.5 text-[10px] capitalize text-slate-400">
                        {info.role.replace(
                          '_',
                          ' '
                        )}
                      </p>
                    </div>

                    <ArrowRight className="h-4 w-4 text-slate-400" />
                  </button>
                ))}
              </div>

              <p className="mt-4 text-center text-[10px] text-slate-400">
                Demo password: demo1234
              </p>

              <p className="mt-8 text-center text-sm text-slate-500">
                Don't have an account?{' '}
                <Link
                  to="/signup"
                  className="font-bold text-blue-600 hover:underline"
                >
                  Create account
                </Link>
              </p>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}