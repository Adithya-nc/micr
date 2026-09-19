import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/lib/auth'

export default function Signup() {
  const navigate = useNavigate()
  const { signUp } = useAuth()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] =
    useState('')

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault()

    setError('')
    setSuccess('')

    if (!name.trim()) {
      setError('Please enter your name.')
      return
    }

    if (!email.trim()) {
      setError('Please enter your email address.')
      return
    }

    if (password.length < 6) {
      setError(
        'Password must contain at least 6 characters.'
      )
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)

    try {
      const result = await signUp(
        email,
        password,
        'customer',
        name
      )

      if (result.error) {
        setError(result.error.message)
        return
      }

      setSuccess(
        'Account created successfully. You can now continue to the workspace.'
      )

      setTimeout(() => {
        navigate('/login')
      }, 1200)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to create your account.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f7f9fc] dark:bg-slate-950">
      <div className="grid min-h-screen lg:grid-cols-[0.9fr_1.1fr]">

        {/* BRAND PANEL */}
        <section className="relative hidden overflow-hidden bg-slate-950 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(37,99,235,.30),transparent_38%)]" />

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
            <div className="mb-6 text-xs font-bold uppercase tracking-[0.2em] text-blue-300">
              Customer Resolution Platform
            </div>

            <h1 className="text-5xl font-black leading-[1.02] tracking-tight">
              Create your
              <br />
              resolution
              <br />
              workspace.
            </h1>

            <p className="mt-6 max-w-lg leading-7 text-slate-400">
              ResolveSphere connects evidence, policy,
              actions and verification into one controlled
              customer-resolution workflow.
            </p>

            <div className="mt-8 space-y-3">
              {[
                'Evidence-driven case investigation',
                'Policy-controlled actions',
                'Human escalation when required',
                'Verified resolution outcomes',
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
        </section>

        {/* SIGNUP PANEL */}
        <section className="flex min-h-screen flex-col">
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
              className="ml-auto flex items-center gap-1 text-xs font-semibold text-slate-500 transition hover:text-slate-950 dark:hover:text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to home
            </Link>
          </header>

          <main className="flex flex-1 items-center justify-center px-5 py-8">
            <div className="w-full max-w-md">

              <div className="mb-8">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                  New workspace
                </p>

                <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 dark:text-white">
                  Create account
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  Set up your ResolveSphere customer account.
                </p>
              </div>

              <form
                onSubmit={handleSubmit}
                className="space-y-5"
              >
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Full name
                  </Label>

                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(event) =>
                      setName(event.target.value)
                    }
                    placeholder="Enter your name"
                    className="h-11 rounded-xl"
                    autoComplete="name"
                    required
                  />
                </div>

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
                    autoComplete="email"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">
                    Password
                  </Label>

                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(event) =>
                      setPassword(event.target.value)
                    }
                    placeholder="Minimum 6 characters"
                    className="h-11 rounded-xl"
                    autoComplete="new-password"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">
                    Confirm password
                  </Label>

                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(event) =>
                      setConfirmPassword(
                        event.target.value
                      )
                    }
                    placeholder="Re-enter your password"
                    className="h-11 rounded-xl"
                    autoComplete="new-password"
                    required
                  />
                </div>

                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm leading-5 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm leading-5 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">
                    {success}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="h-11 w-full rounded-xl bg-slate-950 font-bold hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                >
                  {loading
                    ? 'Creating account...'
                    : 'Create account'}

                  {!loading && (
                    <ArrowRight className="ml-2 h-4 w-4" />
                  )}
                </Button>
              </form>

              <div className="mt-7 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />

                  <p className="text-xs leading-5 text-slate-500">
                    Your account is created using the existing
                    authentication system. Your name and customer
                    role are stored with your account.
                  </p>
                </div>
              </div>

              <p className="mt-7 text-center text-sm text-slate-500">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="font-bold text-blue-600 hover:underline"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </main>
        </section>
      </div>
    </div>
  )
}