import { AppShell } from '@/components/resolvesphere/AppShell'
import { BackendStatusPanel } from '@/components/resolvesphere/BackendStatusPanel'
import { useEventLog } from '@/lib/resolvesphereApi'

type EventRow = { event_id: string; case_id: string; event_type: string; created_at: string }

const Admin = () => {
  const { data, isLoading } = useEventLog()
  const events = (data?.events ?? []) as EventRow[]

  return (
    <AppShell page="testing" title="Admin Dashboard">
      <div className="space-y-4">
        <BackendStatusPanel />
        <section className="rounded-lg border bg-card p-5">
          <h2 className="text-sm font-semibold">Event log</h2>
          {isLoading ? (
            <p className="mt-2 text-sm text-muted-foreground">Loading case events...</p>
          ) : events.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">No case events recorded yet.</p>
          ) : (
            <ul className="mt-2 max-h-80 space-y-1 overflow-y-auto text-xs">
              {events.map((e) => (
                <li key={e.event_id} className="flex justify-between border-b py-1 last:border-0">
                  <span>{e.case_id} — {e.event_type}</span>
                  <span className="text-muted-foreground">{new Date(e.created_at).toLocaleTimeString()}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </AppShell>
  )
}

export default Admin
