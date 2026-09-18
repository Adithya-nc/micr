import { useParams } from 'react-router-dom'
import { AppShell } from '@/components/resolvesphere/AppShell'
import { PlaceholderPanel } from '@/components/resolvesphere/PlaceholderPanel'

const ActiveCase = () => {
  const { caseId } = useParams()
  return (
    <AppShell page="active-case" title={`Case ${caseId ?? ''}`}>
      <PlaceholderPanel
        title="Case not available until backend is connected"
        pendingText="Evidence, timeline, Trust Layer results, actions, and verification cannot be shown until the case exists in Enter Cloud Postgres."
        backendDependency="cases, evidence_ledger, decisions, actions, verifications tables"
        nextStep="Apply schema, seed demo scenarios, then deploy fn_case_intake and fn_build_case_twin"
      />
    </AppShell>
  )
}

export default ActiveCase
