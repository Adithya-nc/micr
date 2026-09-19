# Architecture

## Intelligence Plane
The `resolvesphere-engine` backend function calls `alibaba/qwen-3.8-max` (OpenAI-compatible chat completions protocol) with a redacted Case Twin and evidence summary for the Resolution Contract proposal only. Qwen has no database credentials and cannot execute writes; it returns JSON text that the engine parses and validates.

## Control Plane
`resolvesphere-engine` implements deterministic evidence freshness/sufficiency, contradiction detection, policy guard, risk engine, and authorization routing in TypeScript, validated against the live `rs_*` tables. The Resolution Contract is validated with a Zod schema (the authoritative backend validator; Pydantic is unavailable because Enter Cloud functions run on Deno, not Python — see `docs/fallbacks.md`). State transitions are enforced against a fixed allow-list before any row is written.

## Execution Plane
Authorized actions are executed idempotently: an `rs_idempotency_ledger` row is checked before an `rs_actions` row is created; a simulated refund updates `rs_synthetic_refunds` labelled `SIMULATED`. Verification re-reads the authoritative refund row and compares canonical postcondition predicates before allowing `RESOLVED`.

## Resolution Rule
A case resolves only after a `VERIFIED` Verification Receipt. Failed verification routes to `REOPENED` then `INVESTIGATING`, or `ESCALATED` after two failures. `CONTRADICTION` can only return to `INVESTIGATING` through a deterministic Control Plane trigger with new authoritative evidence — Qwen cannot cause this transition, and in the current implementation this transition path is not invoked at all in the live scenarios (contradictions always escalate).
