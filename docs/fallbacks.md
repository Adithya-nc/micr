# Fallbacks

- Python/Pydantic: Enter Cloud backend functions run on the Deno/TypeScript runtime; there is no Python runtime available. Pydantic cannot execute in this environment. The authoritative backend validator is a Zod schema (`ContractSchema` in `supabase/functions/resolvesphere-engine/index.ts`), enforced server-side before any write action. This is a platform constraint, not a design preference.
- Knowledge: `rs_policies` table serves as the semantic policy/SOP fallback; Enter Knowledge (RAG) was not available as a separate managed capability in this workspace.
- Workflows: sequential deterministic steps inside `resolvesphere-engine` (transition → evidence → sufficiency → contradiction → policy → risk → authorization → idempotent action → verification) replace a dedicated workflow orchestrator, which was not exposed as a distinct EnterPro capability in this workspace.
- Auth: Enter Cloud Auth is not connected. A `[DEMO AUTH FALLBACK]` role switcher (`src/lib/demoAuth.tsx`) gates routes in the application layer only; it is not a security boundary.
- Realtime: Active Case, Command Center, and Status pages poll every 3 seconds via React Query instead of a Postgres realtime subscription.
- Root-Cause Radar and reset are computed live per request rather than through a separate incidents table, since Scenario 4 does not require persisted incident records.
