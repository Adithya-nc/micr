import { Link } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'

const LegalLayout = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="min-h-screen bg-background">
    <header className="border-b bg-card px-5 py-4">
      <Link to="/" className="mx-auto flex max-w-3xl items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-primary" />
        <span className="font-semibold">ResolveSphere AI</span>
      </Link>
    </header>
    <main className="mx-auto max-w-3xl px-5 py-10">
      <h1 className="text-xl font-semibold">{title}</h1>
      <div className="mt-4 space-y-3 text-sm text-muted-foreground">{children}</div>
      <Link to="/" className="mt-6 inline-block text-sm font-medium text-primary underline">Back to home</Link>
    </main>
  </div>
)

export default LegalLayout
