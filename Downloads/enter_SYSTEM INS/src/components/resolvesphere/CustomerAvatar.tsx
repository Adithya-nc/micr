const palette = [
  'bg-violet-500/15 text-violet-600 dark:text-violet-400',
  'bg-blue-500/15 text-blue-600 dark:text-blue-400',
  'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  'bg-rose-500/15 text-rose-600 dark:text-rose-400',
  'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400',
  'bg-orange-500/15 text-orange-600 dark:text-orange-400',
  'bg-pink-500/15 text-pink-600 dark:text-pink-400',
]

function getColor(id: string) {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash)
  }
  return palette[Math.abs(hash) % palette.length]
}

export function CustomerAvatar({
  name, id, size = 'md'
}: {
  name?: string | null; id: string; size?: 'sm' | 'md' | 'lg'
}) {
  const label = (name ?? id).trim()
  const initials = label.includes(' ')
    ? label.split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase()
    : label.replace(/[^A-Za-z0-9]/g, '').slice(0, 2).toUpperCase()

  const sizeClasses = {
    sm: 'h-7 w-7 text-[10px]',
    md: 'h-9 w-9 text-xs',
    lg: 'h-11 w-11 text-sm',
  }

  return (
    <span
      className={`inline-flex ${sizeClasses[size]} shrink-0 items-center justify-center rounded-full font-semibold ring-2 ring-background ${getColor(id)}`}
      aria-hidden="true"
      title={label}
    >
      {initials}
    </span>
  )
}
