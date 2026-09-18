const steps = ['Qwen reasons.', 'EnterPro orchestrates.', 'Evidence validates.', 'Policy authorizes.', 'Verification confirms.']
const guarantees = [
  'Qwen has no direct write authority.',
  'Actions execute only after Trust Layer authorization.',
  'Cases are resolved only after backend verification.',
]

export function ArchitectureBoundaryPanel() {
  return (
    <div className="rounded-lg border bg-card p-5">
      <div className="flex flex-wrap items-center gap-2 text-sm font-medium">
        {steps.map((step, index) => (
          <span key={step} className="flex items-center gap-2">
            {step}
            {index < steps.length - 1 && <span className="text-muted-foreground">→</span>}
          </span>
        ))}
      </div>
      <ul className="mt-4 space-y-1 text-sm text-muted-foreground">
        {guarantees.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </div>
  )
}
