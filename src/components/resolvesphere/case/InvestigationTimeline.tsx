type EventRow = { event_id: string; event_type: string; created_at: string; payload: Record<string, unknown> }

const writeEvents = new Set(['ACTION_STARTED', 'ACTION_COMPLETED', 'APPROVAL_GRANTED', 'APPROVAL_REJECTED'])

export function InvestigationTimeline({ events }: { events: EventRow[] }) {
  return (
    <section className="rounded-lg border bg-card">
      <header className="border-b px-4 py-3"><h2 className="text-sm font-semibold">Investigation Timeline</h2></header>
      {events.length === 0 ? (
        <p className="px-4 py-6 text-sm text-muted-foreground">Loading case events...</p>
      ) : (
        <ol className="space-y-3 px-4 py-4">
          {events.map((event) => (
            <li key={event.event_id} className="flex items-start gap-3 text-sm">
              <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${writeEvents.has(event.event_type) ? 'bg-destructive' : 'bg-primary'}`} />
              <div>
                <p className="font-medium">{event.event_type}</p>
                <p className="text-xs text-muted-foreground">{new Date(event.created_at).toLocaleString()}</p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
