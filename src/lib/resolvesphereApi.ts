import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

export type BackendCheck = { component: string; status: string; message: string; required_action: string }
export type BackendStatus = {
  overall_connected: boolean
  database_connected: boolean
  auth_connected: boolean
  backend_functions_connected: boolean
  workflows_connected: boolean
  agent_connected: boolean
  skills_connected: boolean
  knowledge_connected: boolean
  qwen_connected: boolean
  seed_loaded: boolean
  verification_connected: boolean
  realtime_or_polling_connected: boolean
  mock_mode: boolean
  checks: BackendCheck[]
  last_checked_at: string
}

export type CaseDetail = {
  ok: boolean
  case: { case_id: string; customer_id: string; customer_name: string | null; customer_email: string | null; status: string; urgency: string; sentiment: string; raw_complaint: string; escalation_reason: string | null; risk_level: string | null; assigned_agent: string | null; category: string | null; primary_intent: string | null; reference_id: string | null; root_cause: string | null; customer_response: string | null } | null
  events: { event_id: string; case_id: string; event_type: string; created_at: string; payload: Record<string, unknown> }[]
  evidence: { evidence_id: string; field_name: string; value: unknown; source_system: string; source_type: string; source_record_id: string; authority_level: string; freshness_status: string; retrieval_method: string; relevance: string; status: string; retrieved_at: string }[]
  decisions: { decision_id: string; policy_id: string; risk_score: number; auth_state: string; evidence_ids: string[]; reason_codes?: string[]; risk_factors?: { gaps?: string[]; level?: string } }[]
  actions: { action_id: string; action_type: string; target_id: string; status: string; idempotency_key: string; retry_count: number; error_code: string | null; simulated: boolean }[]
  verifications: { verification_id: string; result: string; expected_postconditions: string[]; observed_state: Record<string, unknown>; predicate_results: Record<string, boolean>; verified_at: string; failure_reason: string | null }[]
  approvals: { approval_id: string; case_id: string; contract_hash: string; action_type: string; target_id: string; amount: number; policy_version: string; risk_score: number; approval_status: string; requested_at: string; expires_at: string | null; approved_by: string | null; approved_at: string | null }[]
  passport: Record<string, unknown> | null
  twin: { twin: Record<string, unknown> } | null
}

async function invokeEngine<T>(action: string, params: Record<string, unknown> = {}): Promise<T> {
  const { data, error } = await supabase.functions.invoke('resolvesphere-engine', { body: { action, ...params } })
  if (error) throw error
  if (data?.ok === false) throw new Error(data.error ?? 'Engine call failed')
  return data
}

export function useBackendStatus() {
  return useQuery({
    queryKey: ['backend-status'],
    queryFn: async (): Promise<BackendStatus> => {
      const { data, error } = await supabase.functions.invoke('resolvesphere-status')
      if (error) throw error
      return data as BackendStatus
    },
    refetchInterval: 3000,
  })
}

export function useCaseList() {
  return useQuery({
    queryKey: ['cases'],
    queryFn: () => invokeEngine<{ ok: boolean; cases: unknown[] }>('list_cases'),
    refetchInterval: 3000,
  })
}

export function useCaseDetail(caseId: string | undefined) {
  return useQuery({
    queryKey: ['case', caseId],
    queryFn: () => invokeEngine<CaseDetail>('get_case', { case_id: caseId }),
    enabled: Boolean(caseId),
    refetchInterval: 3000,
  })
}

export type RadarResult = {
  ok: boolean
  result: {
    fact: { problem_pattern: string; error_code: string; count: number; label: string }[]
    correlation: unknown
    hypothesis: { statement: string; confidence_label: string } | null
    recommendation: { action: string; confidence_label: string } | null
    incident_candidate: boolean
  }
}

export function useRadar() {
  return useQuery({
    queryKey: ['radar'],
    queryFn: () => invokeEngine<RadarResult>('run_radar'),
  })
}

export function useApprovals() {
  return useQuery({
    queryKey: ['approvals'],
    queryFn: () => invokeEngine<{ ok: boolean; approvals: unknown[] }>('list_approvals'),
    refetchInterval: 3000,
  })
}

export function useEventLog() {
  return useQuery({
    queryKey: ['event-log'],
    queryFn: () => invokeEngine<{ ok: boolean; events: unknown[] }>('list_events'),
    refetchInterval: 3000,
  })
}

export type CustomerRow = { customer_id: string; name: string | null; email: string | null }

export function useCustomers() {
  return useQuery({
    queryKey: ['customers'],
    queryFn: () => invokeEngine<{ ok: boolean; customers: CustomerRow[] }>('list_customers'),
    refetchInterval: 5000,
  })
}

export function useKnowledge() {
  return useQuery({
    queryKey: ['knowledge'],
    queryFn: () => invokeEngine<{ ok: boolean; policies: { policy_id: string; version: string; rule_text: string }[] }>('list_knowledge'),
    refetchInterval: 5000,
  })
}

export function useCxAnalytics() {
  return useQuery({
    queryKey: ['cx-analytics'],
    queryFn: () => invokeEngine<{ ok: boolean; result: { total_cases: number; escalated: number; reopened: number; recurring_issues: { intent: string; count: number }[]; friction_customers: { customer_id: string; name: string | null; escalations: number; reopens: number; cases: number }[]; historical_pattern_count: number } }>('cx_analytics'),
    refetchInterval: 5000,
  })
}

export type SubmitInput = { customer_id: string; customer_name?: string; customer_email?: string; complaint: string; reference_id?: string; category?: string }

export function useSubmitCase() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (input: SubmitInput) => invokeEngine<{ ok: boolean; result: { case_id: string; status: string; specialist: string; next: string } }>('submit_case', input),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['cases'] })
      client.invalidateQueries({ queryKey: ['cx-analytics'] })
    },
  })
}

export function useEngineAction(action: string) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (caseId?: string) => invokeEngine(action, caseId ? { case_id: caseId } : {}),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['cases'] })
      client.invalidateQueries({ queryKey: ['case'] })
      client.invalidateQueries({ queryKey: ['backend-status'] })
      client.invalidateQueries({ queryKey: ['radar'] })
    },
  })
}

export function useCustomerCases(customerId: string | undefined) {
  return useQuery({
    queryKey: ['customer-cases', customerId],
    queryFn: () => invokeEngine<{ ok: boolean; cases: { case_id: string; status: string; primary_intent: string; raw_complaint: string; customer_response: string | null; updated_at: string }[] }>('get_customer_cases', { customer_id: customerId }),
    enabled: Boolean(customerId),
    refetchInterval: 3000,
  })
}

export function useAnswerQuestion() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (input: { customer_id: string; answer: string }) => invokeEngine('answer_question', input),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['customer-cases'] })
      client.invalidateQueries({ queryKey: ['cases'] })
    },
  })
}

export function useApproveAction() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (approvalId: string) => invokeEngine('approve_action', { approval_id: approvalId }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['approvals'] })
      client.invalidateQueries({ queryKey: ['case'] })
    },
  })
}

export function useRejectAction() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (input: { approval_id: string; reason: string }) => invokeEngine('reject_action', input),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['approvals'] })
      client.invalidateQueries({ queryKey: ['case'] })
      client.invalidateQueries({ queryKey: ['cases'] })
    },
  })
}

export function useGetOrCreateCustomer() {
  return useMutation({
    mutationFn: (input: { auth_user_id: string; email: string; name?: string }) =>
      invokeEngine<{ ok: boolean; customer_id: string }>('get_or_create_customer', input),
  })
}
