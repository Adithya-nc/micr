# Phase 0 Validation

| Capability | Status | Evidence |
|---|---|---|
| Enter Cloud Postgres | Connected | `rs_*` schema migrated; seed data verified via `supabase_read_query` and `resolvesphere-status`. |
| Backend functions | Connected | `resolvesphere-status`, `resolvesphere-engine`, `resolvesphere-qwen` deployed and invoked successfully. |
| Workflows | Connected (deterministic fallback) | Sequential function chaining inside `resolvesphere-engine`; no distinct EnterPro workflow orchestrator was exposed in this workspace. |
| Agent / Skills / Knowledge | Connected (structural) | Orchestrator routing and SK-01..SK-07 logic live inside the deployed functions; `rs_policies` is the knowledge fallback. |
| Qwen runtime | Connected | `alibaba/qwen-3.8-max` (OpenAI-compatible chat completions) called live for Scenario 1's Resolution Contract proposal. |
| Auth | Pending | Enter Cloud Auth not connected; `[DEMO AUTH FALLBACK]` role switcher gates routes at the application layer. |
| Realtime | Pending (fallback active) | 3-second polling via React Query on Command Center, Active Case, and Status pages. |
| Python/Pydantic | Unavailable on this platform | Enter Cloud functions run on Deno; Zod is the authoritative backend validator. See `docs/fallbacks.md`. |

Frontend `pnpm run build`, `pnpm run lint`, and `tsc --noEmit` were run in this session and passed with 0 errors (3 pre-existing fast-refresh warnings unrelated to this work).
