import { Link } from 'react-router-dom'
import { useAuth } from '@/lib/auth'

export function FooterBar() {
  const { role } = useAuth()
  return (
    <footer className="border-t bg-card px-5 py-3">
      <nav aria-label="Secondary" className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        <Link to="/terms" className="hover:text-foreground">Terms</Link>
        <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
        {role === 'admin' && <Link to="/admin" className="hover:text-foreground">Admin</Link>}
      </nav>
    </footer>
  )
}
