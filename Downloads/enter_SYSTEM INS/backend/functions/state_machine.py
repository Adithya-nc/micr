from enum import Enum

class State(str, Enum):
    NEW='NEW'; ROUTED='ROUTED'; CONTEXT_BUILT='CONTEXT_BUILT'; INVESTIGATING='INVESTIGATING'; EVIDENCE_GAP='EVIDENCE_GAP'; CONTRADICTION='CONTRADICTION'; EVIDENCE_READY='EVIDENCE_READY'; DECISION_READY='DECISION_READY'; APPROVAL_REQUIRED='APPROVAL_REQUIRED'; ACTION_EXECUTING='ACTION_EXECUTING'; VERIFYING='VERIFYING'; RESOLVED='RESOLVED'; REOPENED='REOPENED'; ESCALATED='ESCALATED'; FAILED='FAILED'

ALLOWED = {
    State.NEW:{State.ROUTED,State.FAILED}, State.ROUTED:{State.CONTEXT_BUILT,State.ESCALATED,State.FAILED},
    State.CONTEXT_BUILT:{State.INVESTIGATING,State.ESCALATED,State.FAILED}, State.INVESTIGATING:{State.EVIDENCE_GAP,State.CONTRADICTION,State.EVIDENCE_READY,State.ESCALATED,State.FAILED},
    State.EVIDENCE_GAP:{State.INVESTIGATING,State.ESCALATED,State.FAILED}, State.CONTRADICTION:{State.INVESTIGATING,State.ESCALATED,State.FAILED},
    State.EVIDENCE_READY:{State.DECISION_READY,State.INVESTIGATING,State.ESCALATED,State.FAILED}, State.DECISION_READY:{State.APPROVAL_REQUIRED,State.ACTION_EXECUTING,State.EVIDENCE_GAP,State.CONTRADICTION,State.ESCALATED,State.FAILED},
    State.APPROVAL_REQUIRED:{State.ACTION_EXECUTING,State.ESCALATED,State.FAILED}, State.ACTION_EXECUTING:{State.VERIFYING,State.ESCALATED,State.FAILED},
    State.VERIFYING:{State.RESOLVED,State.REOPENED,State.ESCALATED,State.FAILED}, State.REOPENED:{State.INVESTIGATING,State.ESCALATED,State.FAILED},
    State.RESOLVED:set(), State.ESCALATED:set(), State.FAILED:set()
}

def transition(current: State, target: State, *, contradiction_resolved: bool=False, actor: str='CONTROL_PLANE') -> None:
    if target not in ALLOWED[current]: raise ValueError(f'illegal transition {current}->{target}')
    if current == State.CONTRADICTION and target == State.INVESTIGATING and (not contradiction_resolved or actor not in {'CONTROL_PLANE','HUMAN'}): raise ValueError('contradiction recovery requires authoritative deterministic or human trigger')

def resolved_mismatch_requires_successor(current: State) -> bool:
    return current == State.RESOLVED
