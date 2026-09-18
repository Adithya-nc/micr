import { AppShell } from '@/components/resolvesphere/AppShell'
import { Skeleton } from '@/components/ui/skeleton'
import { useKnowledge } from '@/lib/resolvesphereApi'

const KnowledgeBase = () => {
  const { data, isLoading, isError } = useKnowledge()
  const policies = data?.policies ?? []

  return (
    <AppShell page="escalations" title="Knowledge Base" subtitle="Policies applied during investigations">
      <section className="rounded-lg border bg-card">
        {isLoading && <div className="space-y-2 p-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>}
        {isError && <p className="p-4 text-sm text-muted-foreground">Knowledge records could not be loaded. Try again shortly.</p>}
        {!isLoading && !isError && policies.length === 0 && <p className="p-4 text-sm text-muted-foreground">No policies published yet.</p>}
        <ul className="divide-y">
          {policies.map((p) => (
            <li key={p.policy_id} className="px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-muted-foreground">{p.policy_id}</span>
                <span className="text-xs text-muted-foreground">v{p.version}</span>
              </div>
              <p className="mt-1 text-sm">{p.rule_text}</p>
            </li>
          ))}
        </ul>
      </section>
    </AppShell>
  )
}

export default KnowledgeBase
