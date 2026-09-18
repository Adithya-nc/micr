import { AppShell } from '@/components/resolvesphere/AppShell'
import { PlaceholderPanel } from '@/components/resolvesphere/PlaceholderPanel'

const CommandCenter = () => (
  <AppShell page="command-center" title="Command Center">
    <PlaceholderPanel
      title="Command Center pending"
      pendingText="Backend integration has not been completed yet. Case counts, the case queue, and incident candidates will appear once the database and functions are connected."
      backendDependency="ResolveSphere database schema and deployed backend functions"
      nextStep="Apply backend/schema/resolvesphere.sql through the approved migration flow"
    />
  </AppShell>
)

export default CommandCenter
