from backend.functions.control_plane import authorize, contract_hash, idempotency_key, risk, sufficiency
from backend.functions.state_machine import State, transition
from backend.models.contracts import ResolutionContract, VerificationReceipt, VerificationResult

def fn_case_intake(case_id, customer_id, complaint, channel): return {'case_id':case_id,'customer_id':customer_id,'raw_complaint':complaint,'channel':channel,'state':State.NEW.value,'event':'CASE_CREATED'}
def fn_build_case_twin(case_id, customer_ref, context): return {'case_id':case_id,'customer_ref':customer_ref,'context':context,'event':'CONTEXT_RECONSTRUCTED'}
def fn_fetch_evidence(case_id, tool_id): return {'case_id':case_id,'tool_id':tool_id,'event':'EVIDENCE_RETRIEVED'}
def fn_evidence_freshness(entry): from backend.functions.control_plane import freshness; return freshness(entry)
def fn_evidence_sufficiency(contract, evidence): return sufficiency(contract,evidence)
def fn_contradiction_check(evidence): return any(e.status.value=='CONTRADICTED' for e in evidence)
def fn_policy_guard(policy_id, score, sufficient): return authorize(policy_id,score,sufficient)
def fn_risk_engine(amount, gaps, urgency, retries): return risk(amount,gaps,urgency,retries)
def fn_authorization_router(policy_id, score, sufficient): return authorize(policy_id,score,sufficient)
def fn_validate_contract(payload, evidence, policy_id, urgency, retries):
    contract=ResolutionContract.model_validate(payload); result,gaps=sufficiency(contract,evidence); score,level=risk(contract.proposed_action.amount,gaps,urgency,retries); return {'contract':contract,'contract_hash':contract_hash(contract),'sufficiency':result,'gaps':gaps,'risk_score':score,'risk_level':level,'authorization':authorize(policy_id,score,result)}
def fn_execute_action(case_id, action_type, target_id, fingerprint): return idempotency_key(case_id,action_type,target_id,fingerprint)
def fn_trigger_refund(payment_id, amount): return {'payment_id':payment_id,'amount':str(amount),'status':'SUCCESS','label':'SIMULATED'}
def fn_verify_action(receipt_payload):
    receipt=VerificationReceipt.model_validate(receipt_payload); return receipt.result==VerificationResult.VERIFIED
def fn_reopen_case(current, retries):
    transition(current,State.REOPENED); return State.ESCALATED if retries>=2 else State.INVESTIGATING
def fn_escalate_case(case_id, reason): return {'case_id':case_id,'state':State.ESCALATED.value,'reason':reason,'event':'ESCALATED_TO_HUMAN'}
def fn_customer_question(case_id, question): return {'case_id':case_id,'question':question,'event':'QUESTION_ASKED'}
def fn_approval_request(contract_hash_value, decision_id): return {'contract_hash':contract_hash_value,'decision_id':decision_id,'status':'PENDING'}
def fn_approval_decision(approved, current): return State.ACTION_EXECUTING if approved else State.ESCALATED
def fn_root_cause_radar(records): return {'fact':records,'correlation':[],'hypothesis':[],'recommendation':[]}
def fn_reset_demo_data(): return {'preserve':['synthetic_customers','synthetic_products','synthetic_orders','synthetic_payments','synthetic_refunds','policies'],'clear':['cases','case_twins','evidence_ledger','decisions','actions','verifications','approvals','resolution_passports','outcome_memory','case_events']}
