import { statusTone, type StatusTone } from '@/lib/resolvesphere'

export function StatusBadge({ value, tone }: { value: string; tone?: StatusTone }) {
  const color = tone ?? statusTone(value)
  const styles: Record<StatusTone, string> = {
    neutral: 'bg-muted text-muted-foreground',
    info: 'bg-accent text-accent-foreground',
    success: 'bg-[hsl(var(--success)/.12)] text-[hsl(var(--success))]',
    warning: 'bg-[hsl(var(--warning)/.12)] text-[hsl(var(--warning))]',
    danger: 'bg-destructive/10 text-destructive',
  }
  return <span className={`inline-flex items-center rounded-sm px-2 py-1 text-xs font-medium ${styles[color]}`}>{value}</span>
}
