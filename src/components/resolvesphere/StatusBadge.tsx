import { statusTone, type StatusTone } from '@/lib/resolvesphere'

export function StatusBadge({ value, tone }: { value: string; tone?: StatusTone }) {
  const color = tone ?? statusTone(value)
  const styles: Record<StatusTone, string> = {
    neutral: 'bg-muted text-muted-foreground',
    info: 'bg-accent text-accent-foreground',
    success: 'bg-success/15 text-success',
    warning: 'bg-warning/15 text-warning',
    danger: 'bg-destructive/15 text-destructive',
  }
  return <span className={`inline-flex items-center gap-1 rounded-sm px-2 py-1 text-xs font-medium ${styles[color]}`}>{value}</span>
}
