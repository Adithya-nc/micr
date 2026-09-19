import { AppShell } from '@/components/resolvesphere/AppShell'
import { CaseTable, type CaseRow } from '@/pages/app/CommandCenter'
import { useCaseList } from '@/lib/resolvesphereApi'

const CaseList = () => {
  const { data, isLoading, isError } = useCaseList()
  const cases = ((data?.cases ?? []) as CaseRow[]).filter((c) => c.status !== 'RESOLVED')

  return (
    <AppShell page="active-case" title="Active Cases" subtitle="Cases currently under investigation or awaiting action">
      <section className="rounded-lg border bg-card">
        <CaseTable cases={cases} isLoading={isLoading} isError={isError} />
      </section>
    </AppShell>
  )
}

export default CaseList
