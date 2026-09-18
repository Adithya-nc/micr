import { useParams } from 'react-router-dom'
import { AppShell } from '@/components/resolvesphere/AppShell'
import { StatusBadge } from '@/components/resolvesphere/StatusBadge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { useCaseDetail, useEngineAction } from '@/lib/resolvesphereApi'
import { EvidenceLedgerPanel } from '@/components/resolvesphere/case/EvidencePanel'
import { InvestigationTimeline } from '@/components/resolvesphere/case/InvestigationTimeline'
import { TrustLayerRail } from '@/components/resolvesphere/case/TrustLayerRail'
import { ActionExecutionPanel, VerificationPanel } from '@/components/resolvesphere/case/ExecutionPanels'
import { CaseBriefPanel, CaseTwinPanel, ContradictionPanel, EvidenceGapPanel, ResolutionJourney, ResolutionPassportPanel, ResolutionProposalPanel } from '@/components/resolvesphere/case/CaseNarrativePanels'

const runnerByCase: Record<string, string> = { 'CASE-1001': 'run_autonomous', 'CASE-1002': 'run_evidence_gap', 'CASE-1003': 'run_contradiction' }

const ActiveCase = () => {
  const { caseId = '' } = useParams()
  const { data, isLoading, isError } = useCaseDetail(caseId)
  const runner = useEngineAction(runnerByCase[caseId] ?? 'run_autonomous')

  if (isLoading) {
    return (
      <AppShell page="active-case" title={`Case ${caseId}`}>
        <p className="mb-3 text-sm text-muted-foreground">Loading case events...</p>
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}</div>
      </AppShell>
    )
  }

  if (isError || !data?.case) {
    return (
      <AppShell page="active-case" title={`Case ${caseId}`}>
        <section className="rounded-lg border bg-card p-5">
          <p className="text-sm text-muted-foreground">Case not available. It may not exist yet in Enter Cloud Postgres.</p>
          {runnerByCase[caseId] && (
            <Button className="mt-3" onClick={() => runner.mutate(caseId)} disabled={runner.isPending}>
              {runner.isPending ? 'Running...' : 'Run this demo scenario'}
            </Button>
          )}
        </section>
      </AppShell>
    )
  }

  const caseRow = data.case
  const events = data.events ?? []
  const evidence = data.evidence ?? []
  const decisions = data.decisions ?? []
  const actions = data.actions ?? []
  const verifications = data.verifications ?? []
  const passport = data.passport ?? null
  const twin = data.twin?.twin ?? null
  const latestDecision = decisions[decisions.length - 1]
  const isEscalated = caseRow.status === 'ESCALATED'
  const isContradiction = Boolean(events.find((e) => e.event_type === 'CONTRADICTION_DETECTED'))
  const hasGap = Boolean(events.find((e) => e.event_type === 'EVIDENCE_GAP_FOUND'))
  const question = (events.find((e) => e.event_type === 'QUESTION_ASKED')?.payload.question as string) ?? ''

  return (
    <AppShell page="active-case" title={`Case ${caseRow.case_id}`}>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <main className="space-y-4">
          <header className="rounded-lg border bg-card px-4 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Case Investigation</p>
                <h1 className="mt-1 text-xl font-semibold">{caseRow.raw_complaint}</h1>
              </div>
              <StatusBadge value={caseRow.status} />
            </div>
            <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span>Urgency: {caseRow.urgency}</span>
              <span>Sentiment: {caseRow.sentiment}</span>
              <StatusBadge value="SYNTHETIC" tone="info" />
            </div>
            {runnerByCase[caseRow.case_id] && !['RESOLVED', 'ESCALATED', 'REOPENED'].includes(caseRow.status) && (
              <Button size="sm" className="mt-3" onClick={() => runner.mutate(caseRow.case_id)} disabled={runner.isPending}>
                {runner.isPending ? 'Investigating...' : caseRow.status === 'NEW' ? 'Run demo scenario' : 'Resume investigation'}
              </Button>
            )}
          </header>

          <ResolutionJourney escalated={isEscalated} />
          <InvestigationTimeline events={events} />
          <EvidenceLedgerPanel evidence={evidence} />
          {isContradiction && <ContradictionPanel decision={latestDecision} />}
          {hasGap && <EvidenceGapPanel question={question} />}
          <ResolutionProposalPanel decision={latestDecision} />
          <TrustLayerRail decision={latestDecision} status={caseRow.status} />
          <div className="grid gap-4 md:grid-cols-2">
            <ActionExecutionPanel actions={actions} />
            <VerificationPanel verifications={verifications} />
          </div>
          {caseRow.status === 'RESOLVED' && <ResolutionPassportPanel passport={passport} />}
          {isEscalated && <CaseBriefPanel caseRow={caseRow} />}
        </main>
        <aside className="space-y-4">
          <CaseTwinPanel twin={twin} />
        </aside>
      </div>
    </AppShell>
  )
}

export default ActiveCase
