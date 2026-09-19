# Demo Runbook

1. Open `/testing` (Admin role) or `/admin` to see live backend status and run scenarios.
2. Scenario 1: open `/app/cases/CASE-1001` or click Run on GC-01. Expect status `RESOLVED`, a `VERIFIED` Verification Receipt, and a Resolution Passport. Qwen proposes the contract; the Trust Layer validates and authorizes it.
3. Scenario 2: `/app/cases/CASE-1002` or GC-02. Expect one targeted question, one stored customer-statement answer, then escalation under POL-007 (customer statement alone is insufficient for a financial action).
4. Scenario 3: `/app/cases/CASE-1003` or GC-03. Expect a Material Contradiction panel, autonomy suspended, and escalation with reason `MATERIAL_CONTRADICTION`.
5. Scenario 4: `/radar`. Expect FACT (15 historical `ORDER_CREATE_TIMEOUT` cases), CORRELATION with `EVT-501`, a HYPOTHESIS statement, and a RECOMMENDATION, all labelled `[DEMO DATA]`.
6. Reset: `/testing` → "Reset demo data". Clears case-scoped ledgers/events for CASE-1001..1003 and restores `NEW`, preserving synthetic base data and policies.

All fallback controls in the UI are labelled `[DEMO AUTH FALLBACK]` or `[DEMO ENVIRONMENT]`. Simulated refund executions are labelled `SIMULATED` and are never presented as real production execution.
