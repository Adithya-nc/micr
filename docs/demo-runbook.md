# Demo Runbook

1. Apply schema and seed commands in `docs/verification-commands.md`.
2. Scenario 1: select CASE-1001, show payment SUCCESS and order FAILED evidence, AUTO_ALLOWED decision, SIMULATED refund, and VERIFIED receipt.
3. Scenario 2: select CASE-1002, show incomplete refund evidence, one targeted question, then resumed investigation.
4. Scenario 3: select CASE-1003, show conflicting refund statuses, autonomy suspended, and evidence-first Case Brief.
5. Scenario 4: run radar, show ORDER_CREATE_TIMEOUT cluster with EVT-501 and separate FACT, CORRELATION, HYPOTHESIS, RECOMMENDATION bands.
6. Reset: invoke `fn_reset_demo_data`; preserve synthetic enterprise records and policies.

All fallbacks must visibly display `[DEMO FALLBACK]`. Simulated workflow success never implies verification success.
