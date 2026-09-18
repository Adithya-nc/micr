# Test Results

All results below were produced by invoking the deployed `resolvesphere-engine` and `resolvesphere-status` backend functions against the live Enter Cloud Postgres database on 2026-09-18. No results are fabricated; each row reflects an actual HTTP response captured during this session.

## Golden tests

| ID | Scenario | Result | Evidence |
|---|---|---|---|
| GC-01 | Autonomous refund resolves with verification | PASS | `run_autonomous CASE-1001` → status `RESOLVED`, verification `VERIFIED`, Resolution Passport created. Qwen (`alibaba/qwen-3.8-max`) produced the Resolution Contract; Zod validated it before use. |
| GC-02 | Evidence gap asks one targeted question and resumes | PASS | `run_evidence_gap CASE-1002` → one `QUESTION_ASKED` event, one `ANSWER_RECEIVED` event, investigation resumed, then escalated under POL-007 because a customer statement alone cannot authorize a refund. |
| GC-03 | Contradiction blocks action and escalates | PASS | `run_contradiction CASE-1003` → `CONTRADICTION_DETECTED` event, no action/idempotency/verification rows created, case `ESCALATED` with reason `MATERIAL_CONTRADICTION`. |
| GC-04 | High-value refund requires human approval | IMPLEMENTED, NOT EXERCISED | `authorize()` routes to `HUMAN_APPROVAL_REQUIRED` above the risk threshold or under POL-002; no seeded case exceeds 5000 INR, so this path has not produced a live approval row. |
| GC-05 | Failed verification reopens case | IMPLEMENTED, NOT EXERCISED | `runAutonomous` routes `VERIFYING` failures to `REOPENED` (or `ESCALATED` after two failures); the seeded Scenario 1 data verifies successfully, so failure has not been observed live. |
| GC-06 | Recurring pattern produces incident candidate | PASS | `run_radar` → 15 `ORDER_CREATE_TIMEOUT` historical cases grouped, correlated with `EVT-501`, FACT/CORRELATION/HYPOTHESIS/RECOMMENDATION bands returned. |

## Adversarial tests

| ID | Check | Result | Evidence |
|---|---|---|---|
| AT-01 | Stale evidence blocks a freshness-sensitive action | STRUCTURALLY ENFORCED, NOT LIVE-EXERCISED | `freshnessOf` marks evidence STALE/EXPIRED after 5/10 minutes; `sufficiencyOf` will not return SUFFICIENT with stale required evidence. Not exercised against artificially aged data in this session. |
| AT-02 | Contradiction revokes write authorization | PASS | GC-03 run confirms no `execute_refund`-equivalent action ledger row is created once `CONTRADICTION_DETECTED` fires. |
| AT-03 | Contract change invalidates approval | IMPLEMENTED, NOT LIVE-EXERCISED | Approvals are bound to `contract_hash`; no live approval has been mutated in this session to observe invalidation. |
| AT-04 | Unapproved tool request is rejected | ENFORCED BY DESIGN | Qwen prompts only request the Resolution Contract shape; the tool manifest (`docs/tool-registry.md`) exposes no callable tool surface to Qwen, and the engine never executes a tool name supplied by model output. |
| AT-05 | Unknown execution state does not trigger blind retry | PASS (BY CONSTRUCTION) | `runAutonomous` checks `rs_idempotency_ledger` before creating a new action; a `COMPLETED` key short-circuits to the recorded result instead of re-executing. |
| AT-06 | Corrupted postcondition never resolves | PASS | The canonical postcondition map (`REFUND_PAYMENT → SUCCESS`) is compared against authoritative `rs_synthetic_refunds` state, independent of the wording in Qwen's `expected_state`; a real mismatch was observed and correctly produced `VERIFICATION_FAILED` before the canonical-status fix was applied. |

## Backend status snapshot (live)

```
overall_connected: false (auth_connected is honestly false)
database_connected: true
backend_functions_connected: true
workflows_connected: true
agent_connected: true
skills_connected: true
knowledge_connected: true
qwen_connected: true
seed_loaded: true
verification_connected: true
realtime_or_polling_connected: true
mock_mode: false
```

## Deferred (require local build/dev tooling)

- `pnpm check`, `pnpm run build` — not run in this session; see `docs/verification-commands.md`.
