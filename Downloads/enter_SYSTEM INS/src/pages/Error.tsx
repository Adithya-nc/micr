import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ShieldCheck, AlertTriangle, RefreshCw } from 'lucide-react'

const ErrorPage = ({ onRetry }: { onRetry?: () => void } = {}) => (
  <div className="flex min-h-screen flex-col items-center justify-center bg-background p-5">
    <div className="absolute inset-0 bg-grid-pattern opacity-40 pointer-events-none" />
    <div className="relative w-full max-w-md text-center animate-slide-up">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10">
        <AlertTriangle className="h-8 w-8 text-destructive" />
      </div>
      <h1 className="text-xl font-semibold">Something went wrong</h1>
      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
        This page could not be displayed. No backend action was executed as a result of this error.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button
          variant="outline"
          className="gap-2 rounded-xl"
          onClick={onRetry ?? (() => window.location.reload())}
        >
          <RefreshCw className="h-4 w-4" />
          Retry
        </Button>
        <Button asChild variant="outline" className="gap-2 rounded-xl">
          <Link to="/admin/backend">
            <ShieldCheck className="h-4 w-4" />
            Backend Status
          </Link>
        </Button>
        <Button asChild className="gap-2 rounded-xl">
          <Link to="/">Home</Link>
        </Button>
      </div>
    </div>
  </div>
)

export default ErrorPage
