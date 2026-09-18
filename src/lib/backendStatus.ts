export type BackendStatus = {
  backend_connected: boolean
  database_connected: boolean
  auth_connected: boolean
  functions_connected: boolean
  workflows_connected: boolean
  verification_connected: boolean
  seed_loaded: boolean
  mock_mode: boolean
  updated_at: string
}

export function getBackendStatus(): BackendStatus {
  return {
    backend_connected: true,
    database_connected: false,
    auth_connected: false,
    functions_connected: false,
    workflows_connected: false,
    verification_connected: false,
    seed_loaded: false,
    mock_mode: true,
    updated_at: new Date().toISOString(),
  }
}

export const missingComponents = [
  'ResolveSphere database schema (cases, ledgers, synthetic tables)',
  'Enter Cloud Postgres migration and RLS policies',
  'Deployed backend functions (intake, control plane, execution)',
  'Refund, approval, escalation, and verification workflows',
  'Enter Cloud Auth role integration',
  'Demo scenario seed data',
  'Closed-loop verification engine',
  'Golden and adversarial test execution',
]
