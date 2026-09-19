import { AppShell } from '@/components/resolvesphere/AppShell'
import { Skeleton } from '@/components/ui/skeleton'
import { useKnowledge } from '@/lib/resolvesphereApi'
import { BookOpen, FileText } from 'lucide-react'

const KnowledgeBase = () => {
  const { data, isLoading, isError } = useKnowledge()
  const policies = data?.policies ?? []

  return (
    <AppShell page="escalations" title="Knowledge Base" subtitle="Policies applied during investigations">
      <section className="card-elevated rounded-xl border bg-card">
        <header className="flex items-center gap-2.5 border-b px-5 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
            <BookOpen className="h-4 w-4 text-blue-500" />
          </div>
          <div>
            <h2 className="text-sm font-semibold">Active Policies</h2>
            <p className="text-xs text-muted-foreground">
              {isLoading ? '…' : `${policies.length} policies loaded`}
            </p>
          </div>
        </header>

        {isLoading && (
          <div className="space-y-3 p-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        )}

        {isError && (
          <div className="flex flex-col items-center py-10 text-center">
            <FileText className="mb-2 h-6 w-6 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Knowledge records could not be loaded.</p>
          </div>
        )}

        {!isLoading && !isError && policies.length === 0 && (
          <div className="flex flex-col items-center py-16 text-center">
            <BookOpen className="mb-2 h-8 w-8 text-muted-foreground/30" />
            <p className="font-medium">No policies published</p>
            <p className="mt-1 text-sm text-muted-foreground">Policies will appear here once they are published.</p>
          </div>
        )}

        <ul className="divide-y">
          {policies.map((p) => (
            <li key={p.policy_id} className="px-5 py-4 transition-smooth hover:bg-muted/30">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="rounded-md border bg-muted px-2 py-0.5 font-mono text-xs font-medium text-muted-foreground">
                  {p.policy_id}
                </span>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                  v{p.version}
                </span>
              </div>
              <p className="text-sm leading-relaxed text-foreground">{p.rule_text}</p>
            </li>
          ))}
        </ul>
      </section>
    </AppShell>
  )
}

export default KnowledgeBase
