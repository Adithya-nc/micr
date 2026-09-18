import { AppShell } from '@/components/resolvesphere/AppShell'
import { PlaceholderPanel } from '@/components/resolvesphere/PlaceholderPanel'

const Approvals = () => (
  <AppShell page="approvals" title="Approvals">
    <PlaceholderPanel
      title="No approvals pending in demo mode"
      pendingText="Approval requests bound to a contract hash will appear here once the approval workflow is deployed."
      backendDependency="approvals table and fn_approval_request / fn_approval_decision"
      nextStep="Deploy the approval workflow and bind it to decisions"
    />
  </AppShell>
)

export default Approvals
