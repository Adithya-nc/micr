# Backend Function Interfaces

- `fn_case_intake`: POST complaint, customer identifier, timestamp, channel.
- `fn_build_case_twin`: create redacted minimum-context Case Twin.
- `fn_fetch_evidence`: execute an allow-listed read tool and append provenance.
- `fn_validate_contract`: Pydantic validation plus deterministic Trust Layer output.
- `fn_execute_action` and `fn_trigger_refund`: idempotent authorized SIMULATED action path.
- `fn_verify_action`: authoritative predicate receipt path.
- `fn_reopen_case`, `fn_escalate_case`, `fn_customer_question`, `fn_approval_request`, `fn_approval_decision`, `fn_root_cause_radar`, `fn_reset_demo_data`: lifecycle functions.

The UI reads cases, events, evidence, decisions, actions, verifications, approvals, passports, escalations, radar incidents, and test results through backend interfaces only.
