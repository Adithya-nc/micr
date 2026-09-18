# Backend Pending

## Missing
- ResolveSphere database schema (`backend/schema/resolvesphere.sql`) not yet migrated into Enter Cloud Postgres.
- No Enter Cloud Postgres tables exist (confirmed via schema inspection).
- No backend functions deployed (`backend/functions/*` are local Python interfaces, not deployed Enter Cloud functions).
- No workflows configured (refund, approval, escalation, verification).
- No Enter Cloud Auth role integration; a demo role switcher is used instead.
- No seed data loaded (`backend/seed/demo_data.sql` not executed).
- No verification engine deployed; no Verification Receipts exist.
- No golden or adversarial tests executed against a live backend.

## Next implementation steps
1. Review and apply `backend/schema/resolvesphere.sql` through the approved Enter Cloud migration flow, including RLS policies per role.
2. Load `backend/seed/demo_data.sql` for the four demo scenarios after schema is confirmed.
3. Port `backend/functions/*.py` deterministic logic to deployed Enter Cloud backend functions (TypeScript) and connect Pydantic-equivalent validation.
4. Configure refund, approval, escalation, and verification workflows or sequential deterministic fallbacks.
5. Connect Enter Cloud Auth and replace the demo role switcher with real role-based sessions.
6. Wire `src/lib/backendStatus.ts` to a live status check once functions are deployed.
7. Execute golden (`GC-01`–`GC-06`) and adversarial (`AT-01`–`AT-06`) tests and record actual results in `docs/test-results.md`.
