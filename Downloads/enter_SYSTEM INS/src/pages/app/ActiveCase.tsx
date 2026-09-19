import { useParams, Link } from 'react-router-dom'
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
import { AlertTriangle, ArrowLeft, CheckCircle2, Clock, ShieldAlert } from 'lucide-react'

const ActiveCase = () => {
  const { caseId = '' } = useParams()
  const { data, isLoading, isError } = useCaseDetail(caseId)
  const approve = useApproveAction()
  const reject = useRejectAction()

  if (isLoading) {
    return (
      <AppShell page="active-case" title={caseId}>
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      </AppShell>
    )
  }

  if (isError || !data?.case) {
    return (
      <AppShell page="active-case" title={caseId}>
        <div className="flex flex-col items-center justify-center rounded-xl border bg-card py-16 text-center">
          <AlertTriangle className="mb-3 h-8 w-8 text-muted-foreground/40" />
          <p className="font-medium">Case not found</p>
          <p className="mt-1 text-sm text-muted-foreground">This case could not be found or you don't have access.</p>
          <Button asChild variant="outline" size="sm" className="mt-4 gap-2 rounded-lg">
            <Link to="/app/cases"><ArrowLeft className="h-3.5 w-3.5" />Back to cases</Link>
          </Button>
        </div>
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
      if (reason) reject.mutate({ approval_id: pendingApproval.approval_id, reason })
    }
  }

  return (
    <AppShell
      page="active-case"
      title={caseRow.case_id}
      subtitle={caseRow.primary_intent?.replace(/_/g, ' ') ?? undefined}
      actions={<StatusBadge value={caseRow.status} />}
    >
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <main className="space-y-4">
          {/* Customer complaint card */}
          <div className="card-elevated rounded-xl border bg-card p-5">
            <div className="flex items-start gap-3.5">
              <CustomerAvatar id={caseRow.customer_id} name={caseRow.customer_name} size="lg" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold">{caseRow.customer_name ?? caseRow.customer_id}</p>
                  <StatusBadge value={caseRow.status} />
                </div>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{caseRow.raw_complaint}</p>
              </div>
            </div>
          </div>

          {contradicted.length >= 2 && (
            <ContradictionPanel sources={contradicted.slice(0, 2).map((e) => ({ system: e.source_system, value: `${e.field_name}: ${String(e.value)}` }))} />
          )}
          {caseRow.status === 'EVIDENCE_GAP' && question && <EvidenceGapPanel question={question} />}

          {pendingApproval && (
            <section className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-5">
              <div className="flex items-center gap-2 mb-3">
                <ShieldAlert className="h-4 w-4 text-amber-500" />
                <h2 className="text-sm font-semibold text-amber-600 dark:text-amber-400">Approval Required</h2>
              </div>
              <div className="grid gap-2 text-sm sm:grid-cols-3">
                <div className="rounded-lg bg-background/50 px-3 py-2">
                  <p className="text-xs text-muted-foreground">Action</p>
                  <p className="font-medium">{pendingApproval.action_type}</p>
                </div>
                <div className="rounded-lg bg-background/50 px-3 py-2">
                  <p className="text-xs text-muted-foreground">Target</p>
                  <p className="font-medium">{pendingApproval.target_id}</p>
                </div>
                <div className="rounded-lg bg-background/50 px-3 py-2">
                  <p className="text-xs text-muted-foreground">Risk score</p>
                  <p className="font-medium">{pendingApproval.risk_score}</p>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Button size="sm" onClick={handleApprove} disabled={approve.isPending} className="gap-1.5 rounded-lg">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {approve.isPending ? 'Approving...' : 'Approve'}
                </Button>
                <Button size="sm" variant="outline" onClick={handleReject} disabled={reject.isPending} className="gap-1.5 rounded-lg">
                  <Clock className="h-3.5 w-3.5" />
                  {reject.isPending ? 'Rejecting...' : 'Reject'}
                </Button>
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
