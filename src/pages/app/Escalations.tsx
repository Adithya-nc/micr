import { AppShell } from '@/components/resolvesphere/AppShell'
import { PlaceholderPanel } from '@/components/resolvesphere/PlaceholderPanel'

const Escalations = () => (
  <AppShell page="escalations" title="Escalations">
    <PlaceholderPanel
      title="No escalated cases available in demo mode"
      pendingText="Case Briefs will appear here once the escalation workflow and backend functions are deployed."
      backendDependency="fn_escalate_case and the decisions/evidence ledgers"
      nextStep="Deploy fn_escalate_case and the escalation workflow"
    />
  </AppShell>
)

export default Escalations
