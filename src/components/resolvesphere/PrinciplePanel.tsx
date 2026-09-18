const principles = [
  { title: 'Autonomous when safe', body: 'Approved actions execute only when evidence, policy, and risk conditions are satisfied.' },
  { title: 'Evidence-driven always', body: 'Every claim of enterprise state must reference an authoritative evidence record.' },
  { title: 'Human when necessary', body: 'Contradictions, high risk, and evidence gaps route to a human with full context.' },
]

export function PrinciplePanel() {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {principles.map((item) => (
        <div key={item.title} className="rounded-lg border bg-card p-4">
          <h3 className="text-sm font-semibold">{item.title}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{item.body}</p>
        </div>
      ))}
    </div>
  )
}
