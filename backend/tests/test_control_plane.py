from datetime import datetime, timezone, timedelta
from decimal import Decimal
from backend.functions.control_plane import authorize, idempotency_key, risk
from backend.functions.state_machine import State, transition

def test_forbidden_direct_resolution():
    try: transition(State.NEW, State.RESOLVED)
    except ValueError: return
    raise AssertionError('NEW to RESOLVED must be blocked')

def test_reopen_path():
    transition(State.VERIFYING, State.REOPENED)
    transition(State.REOPENED, State.INVESTIGATING)

def test_contradiction_guard():
    try: transition(State.CONTRADICTION, State.INVESTIGATING, contradiction_resolved=False)
    except ValueError: return
    raise AssertionError('Contradiction recovery must require deterministic evidence trigger')

def test_high_risk_escalates():
    score, _ = risk(Decimal('6001'), ['CONTRADICTION_DETECTED'], 'HIGH', 0)
    assert authorize('POL-004', score, 'BLOCKED') == 'ESCALATE'

def test_idempotency_is_stable():
    assert idempotency_key('CASE-1001','REFUND_PAYMENT','PAY-7001','fingerprint') == idempotency_key('CASE-1001','REFUND_PAYMENT','PAY-7001','fingerprint')
