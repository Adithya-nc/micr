from datetime import datetime, timezone
from hashlib import sha256
from decimal import Decimal
from backend.models.contracts import ResolutionContract, EvidenceLedgerEntry, Freshness, Authority

def contract_hash(contract: ResolutionContract) -> str:
    return sha256(contract.model_dump_json().encode()).hexdigest()

def freshness(entry: EvidenceLedgerEntry, now: datetime | None = None) -> Freshness:
    now = now or datetime.now(timezone.utc)
    if entry.source_type.value == 'POLICY': return Freshness.FRESH
    seconds = (now - entry.observed_at).total_seconds()
    return Freshness.FRESH if seconds <= 300 else Freshness.STALE if seconds <= 600 else Freshness.EXPIRED

def sufficiency(contract: ResolutionContract, evidence: list[EvidenceLedgerEntry]) -> tuple[str,list[str]]:
    active={e.field_name:e for e in evidence if e.status.value=='ACTIVE'}; gaps=[]
    payment=active.get('payment_status'); order=active.get('order_status')
    if not payment: gaps.append('MISSING_PAYMENT_STATE')
    elif payment.value != 'SUCCESS': gaps.append('MISSING_PAYMENT_STATE')
    elif freshness(payment) != Freshness.FRESH: gaps.append('STALE_PAYMENT_STATE')
    if not order: gaps.append('MISSING_ORDER_STATE')
    elif order.value not in {'FAILED','MISSING'}: gaps.append('MISSING_ORDER_STATE')
    if any(e.status.value=='CONTRADICTED' for e in evidence): gaps.append('CONTRADICTION_DETECTED')
    if not any(e.authority_level==Authority.AUTHORITATIVE for e in evidence): gaps.append('MISSING_AUTHORITATIVE_EVIDENCE')
    return ('SUFFICIENT' if not gaps else 'BLOCKED' if 'CONTRADICTION_DETECTED' in gaps else 'INSUFFICIENT',gaps)

def risk(amount: Decimal, gaps: list[str], urgency: str, retries: int) -> tuple[int,str]:
    score=(40 if amount>5000 else 0)+(100 if 'CONTRADICTION_DETECTED' in gaps else 0)+(20 if any(x.startswith('STALE') for x in gaps) else 0)+(30 if 'MISSING_AUTHORITATIVE_EVIDENCE' in gaps else 0)+(20 if retries else 0)+(10 if urgency=='HIGH' else 0)
    return score, 'HIGH' if score>70 else 'MEDIUM' if score>=30 else 'LOW'

def authorize(policy: str, score: int, sufficient: str) -> str:
    if sufficient=='BLOCKED' or score>70 or policy in {'POL-003','POL-004'}: return 'ESCALATE'
    if sufficient!='SUFFICIENT': return 'ASK_CUSTOMER'
    if score>=30 or policy=='POL-002': return 'HUMAN_APPROVAL_REQUIRED'
    return 'AUTO_ALLOWED'

def idempotency_key(case_id: str, action_type: str, target_id: str, fingerprint: str) -> str:
    return f'{case_id}:{action_type}:{target_id}:{fingerprint}'
