export type StatusTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger'
export type CaseEvent = { event_id: string; event_type: string; created_at: string; payload: Record<string, unknown> }
export type Evidence = { evidence_id: string; field_name: string; source_system: string; source_type: string; authority_level: string; freshness_status: string; retrieved_at: string; status: string; relevance: string; source_record_id: string; retrieval_method: string }
export type CaseRecord = { case_id: string; status: string; urgency?: string; sentiment?: string; raw_complaint?: string; sla_state?: string }
export const statusTone = (value?: string): StatusTone => value === 'RESOLVED' || value === 'VERIFIED' || value === 'PASSED' ? 'success' : value === 'ESCALATED' || value === 'FAILED' || value === 'BLOCKED' || value === 'CONTRADICTION' ? 'danger' : value === 'VERIFYING' || value === 'APPROVAL_REQUIRED' || value === 'EVIDENCE_GAP' ? 'warning' : value ? 'info' : 'neutral'
