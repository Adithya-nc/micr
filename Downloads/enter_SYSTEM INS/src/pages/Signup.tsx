import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShieldCheck, Eye, EyeOff, Loader2, ArrowRight, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/lib/auth'

const passwordRules = [
  { test: (p: string) => p.length >= 8, label: 'At least 8 characters' },
  { test: (p: string) => /[a-zA-Z]/.test(p), label: 'Contains a letter' },
  { test: (p: string) => /[0-9]/.test(p), label: 'Contains a number' },
]

const Signup = () => {
  const navigate = useNavigate()
  const { signUp } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const validatePassword = (pwd: string): string | null => {
    if (pwd.length < 8) return 'Password must be at least 8 characters'
    if (!/[a-zA-Z]/.test(pwd)) return 'Password must contain at least one letter'
    if (!/[0-9]/.test(pwd)) return 'Password must contain at least one number'
    return null
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const pwdError = validatePassword(password)
    if (pwdError) { setError(pwdError); return }

    setLoading(true)
    const { error } = await signUp(email, password, 'customer')
    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      navigate('/chat')
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="absolute inset-0 bg-grid-pattern opacity-40 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-primary/4 to-transparent pointer-events-none" />

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
          <div className="card-elevated rounded-2xl border bg-card p-7 shadow-xl">
            <div className="mb-6">
              <h1 className="text-2xl font-bold tracking-tight">Create account</h1>
              <p className="mt-1 text-sm text-muted-foreground">Start a customer support conversation</p>
            </div>

            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-sm font-medium">Full name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Doe"
                  required
                  className="h-10 rounded-lg transition-smooth"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-medium">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="h-10 rounded-lg transition-smooth"
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
                    placeholder="At least 8 characters"
                    required
                    className="h-10 rounded-lg pr-10 transition-smooth"
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

                {/* Password strength indicators */}
                {password && (
                  <div className="mt-2 grid grid-cols-3 gap-1.5">
                    {passwordRules.map((rule) => {
                      const passed = rule.test(password)
                      return (
                        <div key={rule.label} className="flex items-center gap-1 text-[10px]">
                          <CheckCircle2 className={`h-3 w-3 ${passed ? 'text-success' : 'text-muted-foreground/40'}`} />
                          <span className={passed ? 'text-success' : 'text-muted-foreground/60'}>{rule.label}</span>
                        </div>
                      )
                    })}
                  </div>
                )}
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
                  <><Loader2 className="h-4 w-4 animate-spin" /> Creating account...</>
                ) : (
                  <>Create account <ArrowRight className="h-4 w-4" /></>
                )}
              </Button>
            </form>

            <div className="mt-5 border-t pt-4 text-center text-sm">
              <span className="text-muted-foreground">Already have an account? </span>
              <Link to="/login" className="font-medium text-primary transition-smooth hover:underline">Sign in</Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Signup
