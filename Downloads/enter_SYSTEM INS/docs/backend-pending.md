# Backend Pending

## Connected in this session
- Enter Cloud Postgres schema (`rs_*` tables) is migrated and RLS-enabled with read policies.
- Synthetic seed data for all four demo scenarios, POL-001..007, and EVT-501 is loaded.
- `resolvesphere-status`, `resolvesphere-engine`, and `resolvesphere-qwen` backend functions are deployed and live.
- The deterministic Trust Layer (schema validation via Zod, evidence sufficiency/freshness, contradiction detection, policy guard, risk engine, authorization, idempotency, verification) runs inside `resolvesphere-engine` against real database rows.
- One bounded live Qwen call (`alibaba/qwen-3.8-max`) proposes the Resolution Contract for Scenario 1; Scenario 1 was run end-to-end and reached `RESOLVED` with a `VERIFIED` Verification Receipt.
- Scenario 2 (evidence gap → one question → escalate under POL-007), Scenario 3 (contradiction → escalate), and Scenario 4 (radar incident candidate) were run end-to-end against real data.
- The frontend Command Center, Active Case, Escalations, Approvals, Root-Cause Radar, Testing/Admin, and Status pages read live backend data with 3-second polling, not mocks.

## Still pending
- Enter Cloud Auth is not connected; a `[DEMO AUTH FALLBACK]` role switcher gates routes at the application layer only.
- GC-04 (approval above 5000 INR) and GC-05 (failed verification reopen) are implemented but not exercised, because no seeded case currently produces those paths.
- Frontend build/typecheck (`pnpm check`, `pnpm run build`) has not been run in this session; see `docs/verification-commands.md`.

## Next implementation steps
1. Connect Enter Cloud Auth and replace the demo role switcher with real sessions and RLS-scoped policies per role.
2. Seed a >5000 INR case to exercise GC-04, and a corrupted-postcondition fixture to re-exercise AT-06/GC-05 on demand from the Testing page.
3. Run the deferred frontend build/typecheck commands.
