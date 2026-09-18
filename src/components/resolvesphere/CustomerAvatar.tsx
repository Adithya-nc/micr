export function CustomerAvatar({ name, id, size = 'md' }: { name?: string | null; id: string; size?: 'sm' | 'md' }) {
  const label = (name ?? id).trim()
  const initials = label.includes(' ')
    ? label.split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase()
    : label.replace(/[^A-Za-z0-9]/g, '').slice(0, 2).toUpperCase()
  const dimensions = size === 'sm' ? 'h-7 w-7 text-[11px]' : 'h-9 w-9 text-xs'
  return (
    <span className={`inline-flex ${dimensions} shrink-0 items-center justify-center rounded-full bg-secondary font-medium text-secondary-foreground`} aria-hidden="true">
      {initials}
    </span>
  )
}
