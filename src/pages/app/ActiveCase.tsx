import { useParams } from 'react-router-dom'
import { AppShell } from '@/components/resolvesphere/AppShell'
import { StatusBadge } from '@/components/resolvesphere/StatusBadge'
import { CustomerAvatar } from '@/components/resolvesphere/CustomerAvatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { useCaseDetail, useApproveAction, useRejectAction } from '@/lib/resolvesphereApi'
import { EvidenceLedgerPanel } from '@/components/resolvesphere/case/EvidencePanel'
import { AgentActivity, CustomerReplyPanel, DecisionChecks, InvestigationTimeline, RoutingPanel } from '@/components/resolvesphere/case/InvestigationTimeline'
import { ActionExecutionPanel, VerificationPanel } from '@/components/resolvesphere/case/ExecutionPanels'
import { CaseBriefPanel, CaseTwinPanel, ContradictionPanel, CustomerPanel, EvidenceGapPanel, ResolutionPassportPanel } from '@/components/resolvesphere/case/CaseNarrativePanels'

const ActiveCase = () => {
  const { caseId = '' } = useParams()
  const { data, isLoading, isError } = useCaseDetail(caseId)
  const approve = useApproveAction()
  const reject = useRejectAction()

  if (isLoading) {
    return (
      <AppShell page="active-case" title={caseId}>
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}</div>
      </AppShell>
    )
  }

  if (isError || !data?.case) {
    return (
      <AppShell page="active-case" title={caseId}>
        <section className="rounded-lg border bg-card p-5 text-sm text-muted-foreground">This case could not be found.</section>
      </AppShell>
    )
  }

  const caseRow = data.case
  const events = data.events ?? []
  const evidence = data.evidence ?? []
  const decisions = data.decisions ?? []
  const approvals = data.approvals ?? []
  const latestDecision = decisions[decisions.length - 1]
  const pendingApproval = approvals.find((a: { approval_status: string }) => a.approval_status === 'PENDING')
  const isEscalated = caseRow.status === 'ESCALATED'
  const contradicted = evidence.filter((e) => e.status === 'CONTRADICTED')
  const question = (events.find((e) => e.event_type === 'QUESTION_ASKED')?.payload.question as string) ?? ''

  const handleApprove = () => {
    if (pendingApproval && confirm('Approve this action?')) {
      approve.mutate(pendingApproval.approval_id)
    }
  }

  const handleReject = () => {
    if (pendingApproval) {
      const reason = prompt('Reason for rejection:')
      if (reason) {
        reject.mutate({ approval_id: pendingApproval.approval_id, reason })
      }
    }
  }

  return (
    <AppShell
      page="active-case"
      title={caseRow.case_id}
      subtitle={caseRow.primary_intent?.replace(/_/g, ' ') ?? undefined}
      actions={<StatusBadge value={caseRow.status} />}
    >
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <main className="space-y-4">
          <header className="rounded-lg border bg-card p-4">
            <div className="flex items-start gap-3">
              <CustomerAvatar id={caseRow.customer_id} name={caseRow.customer_name} />
              <div className="min-w-0">
                <p className="font-medium">{caseRow.customer_name ?? caseRow.customer_id}</p>
                <p className="mt-1 text-sm text-muted-foreground">{caseRow.raw_complaint}</p>
              </div>
            </div>
          </header>

          {contradicted.length >= 2 && (
            <ContradictionPanel sources={contradicted.slice(0, 2).map((e) => ({ system: e.source_system, value: `${e.field_name}: ${String(e.value)}` }))} />
          )}
          {caseRow.status === 'EVIDENCE_GAP' && question && <EvidenceGapPanel question={question} />}

          {pendingApproval && (
            <section className="rounded-lg border border-primary/50 bg-primary/5 p-4">
              <h2 className="text-sm font-semibold text-primary">Approval required</h2>
              <p className="mt-2 text-sm">Action: {pendingApproval.action_type} → {pendingApproval.target_id}</p>
              <p className="text-sm">Amount: {pendingApproval.amount} {caseRow.category === 'Billing' ? 'INR' : ''}</p>
              <p className="text-sm">Risk score: {pendingApproval.risk_score}</p>
              <div className="mt-3 flex gap-2">
                <Button size="sm" onClick={handleApprove} disabled={approve.isPending}>{approve.isPending ? 'Approving...' : 'Approve'}</Button>
                <Button size="sm" variant="outline" onClick={handleReject} disabled={reject.isPending}>{reject.isPending ? 'Rejecting...' : 'Reject'}</Button>
              </div>
              {approve.isError && <p className="mt-2 text-sm text-destructive">Approval failed. Try again.</p>}
              {reject.isError && <p className="mt-2 text-sm text-destructive">Rejection failed. Try again.</p>}
            </section>
          )}

          <AgentActivity events={events} />
          <InvestigationTimeline events={events} />
          <EvidenceLedgerPanel evidence={evidence} />
          <DecisionChecks decision={latestDecision} />
          <div className="grid gap-4 md:grid-cols-2">
            <ActionExecutionPanel actions={data.actions ?? []} />
            <VerificationPanel verifications={data.verifications ?? []} />
          </div>
          {isEscalated && <CaseBriefPanel caseRow={caseRow} evidenceCount={evidence.length} decision={latestDecision} />}
          <CustomerReplyPanel response={caseRow.customer_response} />
          {caseRow.status === 'RESOLVED' && <ResolutionPassportPanel passport={data.passport ?? null} />}
        </main>

        <aside className="space-y-4">
          <CustomerPanel caseRow={caseRow} />
          <RoutingPanel caseRow={caseRow} />
          <CaseTwinPanel twin={data.twin?.twin ?? null} />
        </aside>
      </div>
    </AppShell>
  )
}

export default ActiveCase
