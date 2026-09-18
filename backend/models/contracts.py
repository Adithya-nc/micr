from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import Any
from pydantic import BaseModel, ConfigDict, Field

class StrictModel(BaseModel):
    model_config = ConfigDict(extra='forbid')

class Urgency(str, Enum): LOW='LOW'; MEDIUM='MEDIUM'; HIGH='HIGH'; SLA_CRITICAL='SLA_CRITICAL'
class Authority(str, Enum): AUTHORITATIVE='AUTHORITATIVE'; SECONDARY='SECONDARY'; HISTORICAL='HISTORICAL'; CUSTOMER_STATEMENT='CUSTOMER_STATEMENT'
class Freshness(str, Enum): FRESH='FRESH'; STALE='STALE'; EXPIRED='EXPIRED'; UNKNOWN='UNKNOWN'
class EvidenceType(str, Enum): TRANSACTIONAL='TRANSACTIONAL'; SUPPORT='SUPPORT'; POLICY='POLICY'; HISTORICAL='HISTORICAL'; CUSTOMER_STATEMENT='CUSTOMER_STATEMENT'; SYSTEM_EVENT='SYSTEM_EVENT'
class EvidenceStatus(str, Enum): ACTIVE='ACTIVE'; CONTRADICTED='CONTRADICTED'; SUPERSEDED='SUPERSEDED'; RETRACTED='RETRACTED'
class ActionType(str, Enum): REFUND_PAYMENT='REFUND_PAYMENT'; REQUEST_CUSTOMER_INFO='REQUEST_CUSTOMER_INFO'; ESCALATE_CASE='ESCALATE_CASE'
class VerificationResult(str, Enum): VERIFIED='VERIFIED'; FAILED='FAILED'; TIMEOUT='TIMEOUT'; UNKNOWN='UNKNOWN'

class CaseContext(StrictModel):
    relevant_orders: list[dict[str, Any]] = []
    relevant_payments: list[dict[str, Any]] = []
    relevant_refunds: list[dict[str, Any]] = []
    relevant_tickets: list[dict[str, Any]] = []
    timeline: list[dict[str, Any]] = []

class CaseTwin(StrictModel):
    case_id: str
    customer_ref: str
    primary_intent: str
    domain: list[str] = Field(min_length=1)
    urgency: Urgency
    sla_state: str
    context: CaseContext
    evidence_ids: list[str]
    missing_evidence: list[str]
    contradictions: list[str]
    state: str
    secondary_intent: str | None = None
    sentiment: str | None = None
    policy_refs: list[str] = []
    risk_level: str | None = None
    authorization_state: str | None = None

class EvidenceLedgerEntry(StrictModel):
    evidence_id: str
    case_id: str
    source_system: str
    source_record_id: str
    source_type: EvidenceType
    field_name: str
    value: Any
    authority_level: Authority
    observed_at: datetime
    retrieved_at: datetime
    freshness_status: Freshness
    retrieval_method: str
    relevance: str
    status: EvidenceStatus

class ProposedAction(StrictModel):
    type: ActionType
    target_id: str
    amount: Decimal = Field(ge=0)
    currency: str = Field(pattern='^[A-Z]{3}$')

class ExpectedState(StrictModel):
    entity: str
    target_id: str
    status: str

class ResolutionContract(StrictModel):
    case_id: str
    problem: str
    evidence_ids: list[str] = Field(min_length=1)
    proposed_action: ProposedAction
    policy_reference: str
    risk_level: str
    authorization_required: bool
    expected_state: ExpectedState
    verification_target: str
    escalation_required: bool
    customer_message_intent: str

class VerificationReceipt(StrictModel):
    verification_id: str
    action_id: str
    case_id: str
    authoritative_source: str
    evidence_ids: list[str]
    expected_postconditions: list[str]
    observed_state: dict[str, Any]
    predicate_results: dict[str, bool]
    result: VerificationResult
    verified_at: datetime
    failure_reason: str | None = None
