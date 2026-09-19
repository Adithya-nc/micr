import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShieldCheck, Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth, demoAccounts } from '@/lib/auth'

const Login = () => {
  const navigate = useNavigate()
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await signIn(email, password)
    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      navigate('/app')
    }
  }

  const fillDemo = (demoEmail: string) => {
    setEmail(demoEmail)
    setPassword(demoAccounts[demoEmail].password)
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Subtle background */}
      <div className="absolute inset-0 bg-grid-pattern opacity-40 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-primary/4 to-transparent pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 border-b bg-card/80 backdrop-blur-sm px-5 py-3.5">
        <Link to="/" className="mx-auto flex max-w-md items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
            <ShieldCheck className="h-4 w-4 text-primary" />
          </div>
          <span className="font-semibold tracking-tight">
            ResolveSphere <span className="gradient-text">AI</span>
          </span>
        </Link>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-md flex-1 items-center px-5 py-10">
        <div className="w-full animate-slide-up">
          {/* Card */}
          <div className="card-elevated rounded-2xl border bg-card p-7 shadow-xl">
            <div className="mb-6">
              <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
              <p className="mt-1 text-sm text-muted-foreground">Sign in to your support workspace</p>
            </div>

            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-medium">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="h-10 rounded-lg transition-smooth focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="h-10 rounded-lg pr-10 transition-smooth focus:ring-2 focus:ring-primary/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-smooth hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/8 px-3 py-2.5 text-sm text-destructive">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="h-10 w-full rounded-lg gap-2 shadow-sm shadow-primary/20 transition-smooth hover:shadow-md hover:shadow-primary/25"
                disabled={loading}
              >
                {loading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Signing in...</>
                ) : (
                  <>Sign in <ArrowRight className="h-4 w-4" /></>
                )}
              </Button>
            </form>

            {/* Demo accounts */}
            <div className="mt-5 rounded-xl border bg-muted/50 p-4">
              <p className="mb-2.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Demo accounts</p>
              <div className="space-y-1">
                {Object.entries(demoAccounts).map(([email, info]) => (
                  <button
                    key={email}
                    onClick={() => fillDemo(email)}
                    className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs text-muted-foreground transition-smooth hover:bg-background hover:text-foreground"
                  >
                    <span className="font-mono">{email}</span>
                    <span className="rounded-md bg-background border px-2 py-0.5 capitalize text-[10px] font-medium">
                      {info.role.replace('_', ' ')}
                    </span>
                  </button>
                ))}
              </div>
              <p className="mt-2 text-[10px] text-muted-foreground">All demo accounts use password: <span className="font-mono font-semibold">demo1234</span></p>
            </div>

            <div className="mt-5 border-t pt-4 text-center text-sm">
              <span className="text-muted-foreground">No account? </span>
              <Link to="/signup" className="font-medium text-primary transition-smooth hover:underline">Create one</Link>
              <span className="mx-2 text-muted-foreground">·</span>
              <Link to="/chat" className="font-medium text-primary transition-smooth hover:underline">Customer chat →</Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Login
