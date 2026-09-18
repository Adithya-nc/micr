import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

const ErrorPage = ({ onRetry }: { onRetry?: () => void } = {}) => (
  <div className="flex min-h-screen items-center justify-center bg-background p-5">
    <div className="w-full max-w-md rounded-lg border bg-card p-6 text-center">
      <h1 className="text-lg font-semibold">Something went wrong</h1>
      <p className="mt-2 text-sm text-muted-foreground">This page could not be displayed. No backend action was executed as a result of this error.</p>
      <div className="mt-5 flex justify-center gap-3">
        <Button variant="outline" onClick={onRetry ?? (() => window.location.reload())}>Retry</Button>
        <Button asChild variant="outline"><Link to="/status">Backend Status</Link></Button>
        <Button asChild><Link to="/">Home</Link></Button>
      </div>
    </div>
  </div>
)

export default ErrorPage
