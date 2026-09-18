# ResolveSphere Orchestrator Agent

- SK-01 Case Intelligence: redacted intake classification and routing only.
- SK-02 Investigation: requests approved read tools only.
- SK-03 Knowledge and Policy: semantic policy and SOP retrieval only.
- SK-04 Resolution Proposal: proposes strict JSON Resolution Contracts only.
- SK-05 Control Plane Validator: deterministic Pydantic, evidence, policy, risk, authorization, and state validation.
- SK-06 Action and Verification: deterministic authorized action, idempotency, and predicate verification only.
- SK-07 Escalation and Analytics: advisory case brief and clearly labelled root-cause interpretation only.

The orchestrator never exposes write tools to Qwen. Qwen can request only manifest read tools. Invalid JSON is re-prompted once, then deterministically escalated or failed.
