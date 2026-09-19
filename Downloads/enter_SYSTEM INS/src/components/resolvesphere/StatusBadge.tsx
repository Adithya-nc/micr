import { statusTone, type StatusTone } from '@/lib/resolvesphere'

const toneStyles: Record<StatusTone, string> = {
  neutral: 'bg-muted text-muted-foreground border-muted-foreground/20',
  info: 'bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400',
  success: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400',
  warning: 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400',
  danger: 'bg-red-500/10 text-red-600 border-red-500/20 dark:text-red-400',
}

const toneDot: Record<StatusTone, string> = {
  neutral: 'bg-muted-foreground/50',
  info: 'bg-blue-500',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-red-500',
}

export function StatusBadge({ value, tone }: { value: string; tone?: StatusTone }) {
  const color = tone ?? statusTone(value)
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium ${toneStyles[color]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${toneDot[color]}`} />
      {value}
    </span>
  )
}
