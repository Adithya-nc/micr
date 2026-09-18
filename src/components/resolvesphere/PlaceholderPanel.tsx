export function PlaceholderPanel({
  title,
  pendingText,
  backendDependency,
  nextStep,
}: {
  title: string
  pendingText: string
  backendDependency: string
  nextStep: string
}) {
  return (
    <section className="rounded-lg border bg-card p-5">
      <h1 className="text-lg font-semibold">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{pendingText}</p>
      <dl className="mt-4 space-y-2 text-xs text-muted-foreground">
        <div>
          <dt className="font-medium text-foreground">Backend dependency</dt>
          <dd>{backendDependency}</dd>
        </div>
        <div>
          <dt className="font-medium text-foreground">Next required backend component</dt>
          <dd>{nextStep}</dd>
        </div>
      </dl>
    </section>
  )
}
