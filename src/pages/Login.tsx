import { Link, useNavigate } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DemoAuthRoleSwitcher } from '@/components/resolvesphere/DemoAuthRoleSwitcher'
import { FooterBar } from '@/components/resolvesphere/FooterBar'

const Login = () => {
  const navigate = useNavigate()
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b bg-card px-5 py-4">
        <Link to="/" className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <span className="font-semibold">ResolveSphere AI</span>
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center p-5">
        <div className="w-full max-w-md rounded-lg border bg-card p-6">
          <h1 className="text-lg font-semibold">Sign in</h1>
          <p className="mt-1 text-sm text-muted-foreground">Enter Cloud Auth is not connected yet. Select a demo role to continue.</p>
          <div className="mt-4">
            <DemoAuthRoleSwitcher />
          </div>
          <Button className="mt-4 w-full" onClick={() => navigate('/app')}>Continue to workspace</Button>
        </div>
      </main>
      <FooterBar />
    </div>
  )
}

export default Login
