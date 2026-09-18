import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth, demoAccounts } from '@/lib/auth'

const Login = () => {
  const navigate = useNavigate()
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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
      <header className="border-b bg-card px-5 py-4">
        <Link to="/" className="mx-auto flex max-w-md items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <span className="font-semibold">ResolveSphere AI</span>
        </Link>
      </header>

      <main className="mx-auto flex w-full max-w-md flex-1 items-center px-5 py-10">
        <div className="w-full space-y-6 rounded-lg border bg-card p-6">
          <div>
            <h1 className="text-xl font-semibold">Sign in</h1>
            <p className="mt-1 text-sm text-muted-foreground">Access your support workspace</p>
          </div>

          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>

          <div className="space-y-2 border-t pt-4">
            <p className="text-xs font-medium text-muted-foreground">Demo accounts</p>
            <div className="space-y-1">
              {Object.entries(demoAccounts).map(([email, info]) => (
                <button
                  key={email}
                  onClick={() => fillDemo(email)}
                  className="flex w-full items-center justify-between rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted"
                >
                  <span>{email}</span>
                  <span className="capitalize">{info.role.replace('_', ' ')}</span>
                </button>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground">Password: demo1234</p>
          </div>

          <div className="border-t pt-4 text-center">
            <Link to="/chat" className="text-sm text-primary hover:underline">
              Customer support chat →
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Login
