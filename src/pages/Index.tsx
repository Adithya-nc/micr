import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/resolvesphere/ThemeToggle'
import { ShieldCheck } from 'lucide-react'

const Index = () => (
  <div className="flex min-h-screen flex-col bg-background">
    <header className="border-b bg-card">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
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

    <main className="mx-auto flex w-full max-w-5xl flex-1 items-center px-5 py-16">
      <div className="w-full">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">DON'T ANSWER THE TICKET. RESOLVE THE CASE.</h1>
        <p className="mt-4 max-w-2xl text-sm text-muted-foreground">
          Autonomous customer support that investigates evidence, applies policy, takes safe action, verifies the result, and escalates when needed.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild><Link to="/chat">Start customer chat</Link></Button>
          <Button asChild variant="outline"><Link to="/app">Open support workspace</Link></Button>
        </div>
      </div>
    </main>

    <footer className="border-t bg-card px-5 py-4">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
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
