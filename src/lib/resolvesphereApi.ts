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
  case: { case_id: string; status: string; urgency: string; sentiment: string; raw_complaint: string; escalation_reason: string | null; risk_level: string | null } | null
  events: { event_id: string; case_id: string; event_type: string; created_at: string; payload: Record<string, unknown> }[]
  evidence: { evidence_id: string; field_name: string; value: unknown; source_system: string; source_type: string; source_record_id: string; authority_level: string; freshness_status: string; retrieval_method: string; relevance: string; status: string; retrieved_at: string }[]
  decisions: { decision_id: string; policy_id: string; risk_score: number; auth_state: string; evidence_ids: string[]; risk_factors?: { gaps?: string[]; level?: string } }[]
  actions: { action_id: string; action_type: string; target_id: string; status: string; idempotency_key: string; retry_count: number; error_code: string | null; simulated: boolean }[]
  verifications: { verification_id: string; result: string; expected_postconditions: string[]; observed_state: Record<string, unknown>; predicate_results: Record<string, boolean>; verified_at: string; failure_reason: string | null }[]
  approvals: unknown[]
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
