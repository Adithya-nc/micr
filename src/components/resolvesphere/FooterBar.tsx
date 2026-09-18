import { Link } from 'react-router-dom'

export function FooterBar() {
  return (
    <footer className="border-t bg-card px-5 py-4 text-xs text-muted-foreground">
      <p className="font-medium text-foreground">ResolveSphere AI</p>
      <p className="mt-1">Hackathon demo environment. Synthetic data only. Simulated actions where applicable. No real payment execution.</p>
      <nav aria-label="Legal and status" className="mt-2 flex flex-wrap gap-3">
        <Link to="/terms" className="underline hover:text-foreground">Terms</Link>
        <Link to="/privacy" className="underline hover:text-foreground">Privacy</Link>
        <Link to="/status" className="underline hover:text-foreground">Status</Link>
        <Link to="/admin" className="underline hover:text-foreground">Admin</Link>
      </nav>
    </footer>
  )
}
