import { Link } from 'react-router-dom'
import { StatusBadge } from '@/components/resolvesphere/StatusBadge'

export function DemoScenarioPanel({ name, description, to }: { name: string; description: string; to: string }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold">{name}</h3>
        <StatusBadge value="DEMO" tone="info" />
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      <Link to={to} className="mt-3 inline-block text-xs font-medium text-primary underline">View backend status</Link>
    </div>
  )
}
