# Backend Function Interfaces

Deployed Enter Cloud backend functions (`supabase/functions/*`):

- `resolvesphere-status` — `fn_backend_status`. Returns the exact JSON contract with `checks[]`, computed live from the database and environment; never hardcoded.
- `resolvesphere-engine` — action-routed deterministic engine. Actions: `list_cases`, `get_case`, `list_approvals`, `list_events`, `run_autonomous`, `run_evidence_gap`, `run_contradiction`, `run_radar`, `reset_demo`.
- `resolvesphere-qwen` — standalone bounded Qwen proposal caller (used for isolated testing; `run_autonomous` also calls Qwen inline).

The frontend calls these exclusively through `supabase.functions.invoke` (see `src/lib/resolvesphereApi.ts`); no raw HTTP calls, no service-role key in the browser.
