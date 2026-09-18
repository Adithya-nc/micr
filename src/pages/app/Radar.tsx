import { AppShell } from '@/components/resolvesphere/AppShell'
import { PlaceholderPanel } from '@/components/resolvesphere/PlaceholderPanel'

const Radar = () => (
  <AppShell page="radar" title="Root-Cause Radar">
    <PlaceholderPanel
      title="No systemic patterns detected in the available data"
      pendingText="Incident candidates separated into FACT, CORRELATION, HYPOTHESIS, and RECOMMENDATION bands will appear once historical case and system event data is seeded."
      backendDependency="historical_resolutions, system_events tables and fn_root_cause_radar"
      nextStep="Seed Scenario 4 historical cases and EVT-501, then deploy fn_root_cause_radar"
    />
  </AppShell>
)

export default Radar
