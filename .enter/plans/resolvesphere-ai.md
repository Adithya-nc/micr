# ResolveSphere AI Implementation Plan

## Context
Build ResolveSphere AI as an evidence-driven enterprise case-resolution application. The implementation will preserve the required separation of planes: Qwen proposes structured, read-only reasoning; deterministic Enter Cloud logic validates evidence, policy, risk, state transitions, and idempotency; approved workflows execute only simulated synthetic-data actions and verify their authoritative result.

## Phase 0 validation and schema lock

### A. EnterPro capability validation checklist
- Validate **Enter Agent** by confirming an agent configuration can invoke only SK-01 through SK-07 and has no write tool exposure.
- Validate **Skills** by creating the seven scoped skill definitions; use deterministic code rather than Qwen for SK-05 and execution rules in SK-06.
- Validate **Knowledge** by registering the required policy/SOP/product entries; use the `policies` table only if Knowledge is unavailable.
- Validate **Enter Cloud Postgres** by applying the schema and inserting synthetic seed records.
- Validate **Cloud Functions** by running deterministic state, evidence, policy, risk, idempotency, and verification functions against mock contracts and ledgers.
- Validate **Workflows** by invoking the refund, approval, escalation, and verification paths; use sequential function chaining only if workflows are unavailable.
- Validate **App/UI deployment** with the Vite React application and live case-event-driven views.
- Validate **Auth** and role enforcement for Customer, Support Agent, Manager, and Admin; expose a clearly labelled demo role switcher only when backend auth is unavailable.
- Validate realtime updates; otherwise use a 3-second polling query on the active-case route.
- Validate storage only if knowledge/media capability requires it; no media uploads are in baseline scope.
- Validate the runtime Qwen model selector and record the actual exposed Qwen model identifier without hardcoding an unavailable version.
- Record every unavailable capability and its approved fallback in `docs/fallbacks.md` before dependent implementation begins.

### B. Locked JSON schemas

#### Case Twin
```json
{
  "type": "object",
  "additionalProperties": false,
  "required": ["case_id", "customer_ref", "primary_intent", "domain", "urgency", "sla_state", "context", "evidence_ids", "missing_evidence", "contradictions", "state"],
  "properties": {
    "case_id": {"type": "string"},
    "customer_ref": {"type": "string", "description": "Redacted stable reference only"},
    "primary_intent": {"type": "string"},
    "secondary_intent": {"type": ["string", "null"]},
    "domain": {"type": "array", "items": {"type": "string"}, "minItems": 1},
    "urgency": {"enum": ["LOW", "MEDIUM", "HIGH", "SLA_CRITICAL"]},
    "sentiment": {"enum": ["NEUTRAL", "FRUSTRATED", "URGENT", "UNKNOWN"]},
    "sla_state": {"type": "string"},
    "context": {"type": "object", "additionalProperties": false, "properties": {"relevant_orders": {"type": "array"}, "relevant_payments": {"type": "array"}, "relevant_refunds": {"type": "array"}, "relevant_tickets": {"type": "array"}, "timeline": {"type": "array"}}},
    "evidence_ids": {"type": "array", "items": {"type": "string"}},
    "missing_evidence": {"type": "array", "items": {"type": "string"}},
    "contradictions": {"type": "array", "items": {"type": "string"}},
    "policy_refs": {"type": "array", "items": {"type": "string"}},
    "risk_level": {"enum": ["LOW", "MEDIUM", "HIGH", "UNKNOWN"]},
    "authorization_state": {"enum": ["PENDING", "AUTO_ALLOWED", "HUMAN_APPROVAL_REQUIRED", "ESCALATE", "ASK_CUSTOMER", "BLOCKED"]},
    "state": {"type": "string"}
  }
}
```

#### Evidence Ledger entry
```json
{
  "type": "object",
  "additionalProperties": false,
  "required": ["evidence_id", "case_id", "source_system", "source_record_id", "source_type", "field_name", "value", "authority_level", "observed_at", "retrieved_at", "freshness_status", "retrieval_method", "relevance", "status"],
  "properties": {
    "evidence_id": {"type": "string"}, "case_id": {"type": "string"},
    "source_system": {"type": "string"}, "source_record_id": {"type": "string"},
    "source_type": {"enum": ["TRANSACTIONAL", "SUPPORT", "POLICY", "HISTORICAL", "CUSTOMER_STATEMENT", "SYSTEM_EVENT"]},
    "field_name": {"type": "string"}, "value": {},
    "authority_level": {"enum": ["AUTHORITATIVE", "SECONDARY", "HISTORICAL", "CUSTOMER_STATEMENT"]},
    "observed_at": {"type": "string", "format": "date-time"}, "retrieved_at": {"type": "string", "format": "date-time"},
    "freshness_status": {"enum": ["FRESH", "STALE", "EXPIRED", "UNKNOWN"]},
    "retrieval_method": {"type": "string"}, "relevance": {"type": "string"}, "status": {"enum": ["ACTIVE", "SUPERSEDED", "RETRACTED"]}
  }
}
```

#### Resolution Contract
```json
{
  "type": "object",
  "additionalProperties": false,
  "required": ["case_id", "problem", "evidence_ids", "proposed_action", "policy_reference", "risk_level", "authorization_required", "expected_state", "verification_target", "escalation_required", "customer_message_intent"],
  "properties": {
    "case_id": {"type": "string"}, "problem": {"type": "string"},
    "evidence_ids": {"type": "array", "items": {"type": "string"}, "minItems": 1},
    "proposed_action": {"type": "object", "additionalProperties": false, "required": ["type", "target_id", "amount", "currency"], "properties": {"type": {"enum": ["REFUND_PAYMENT", "REQUEST_CUSTOMER_INFO", "ESCALATE_CASE"]}, "target_id": {"type": "string"}, "amount": {"type": "number", "minimum": 0}, "currency": {"type": "string", "pattern": "^[A-Z]{3}$"}}},
    "policy_reference": {"type": "string"}, "risk_level": {"enum": ["LOW", "MEDIUM", "HIGH"]}, "authorization_required": {"type": "boolean"},
    "expected_state": {"type": "object", "additionalProperties": false, "required": ["entity", "target_id", "status"], "properties": {"entity": {"type": "string"}, "target_id": {"type": "string"}, "status": {"type": "string"}}},
    "verification_target": {"type": "string"}, "escalation_required": {"type": "boolean"}, "customer_message_intent": {"type": "string"}
  }
}
```

#### Verification Receipt
```json
{
  "type": "object",
  "additionalProperties": false,
  "required": ["verification_id", "action_id", "case_id", "authoritative_source", "evidence_ids", "expected_postconditions", "observed_state", "predicate_results", "result", "verified_at"],
  "properties": {
    "verification_id": {"type": "string"}, "action_id": {"type": "string"}, "case_id": {"type": "string"}, "authoritative_source": {"type": "string"},
    "evidence_ids": {"type": "array", "items": {"type": "string"}}, "expected_postconditions": {"type": "array", "items": {"type": "string"}},
    "observed_state": {"type": "object"}, "predicate_results": {"type": "object", "additionalProperties": {"type": "boolean"}},
    "result": {"enum": ["VERIFIED", "FAILED", "TIMEOUT", "UNKNOWN"]}, "failure_reason": {"type": ["string", "null"]}, "verified_at": {"type": "string", "format": "date-time"}
  }
}
```

### C. 15-state Case State Machine
Canonical states: `NEW`, `ROUTED`, `CONTEXT_BUILT`, `INVESTIGATING`, `EVIDENCE_GAP`, `CONTRADICTION`, `EVIDENCE_READY`, `DECISION_READY`, `APPROVAL_REQUIRED`, `ACTION_EXECUTING`, `VERIFYING`, `RESOLVED`, `REOPENED`, `ESCALATED`, `FAILED`.

The transition function will allow only these edges; every other state pair is rejected by DB/function logic and creates no action:
- `NEW → ROUTED | FAILED`
- `ROUTED → CONTEXT_BUILT | ESCALATED | FAILED`
- `CONTEXT_BUILT → INVESTIGATING | ESCALATED | FAILED`
- `INVESTIGATING → EVIDENCE_GAP | CONTRADICTION | EVIDENCE_READY | ESCALATED | FAILED`
- `EVIDENCE_GAP → INVESTIGATING | ESCALATED | FAILED`
- `CONTRADICTION → INVESTIGATING` only after fresh authoritative conflict-resolving evidence; otherwise `CONTRADICTION → ESCALATED | FAILED`
- `EVIDENCE_READY → DECISION_READY | INVESTIGATING | ESCALATED | FAILED`
- `DECISION_READY → APPROVAL_REQUIRED | ACTION_EXECUTING | EVIDENCE_GAP | CONTRADICTION | ESCALATED | FAILED`
- `APPROVAL_REQUIRED → ACTION_EXECUTING | ESCALATED | FAILED`
- `ACTION_EXECUTING → VERIFYING | ESCALATED | FAILED`
- `VERIFYING → RESOLVED | REOPENED | ESCALATED | FAILED`
- `REOPENED → INVESTIGATING | ESCALATED | FAILED`
- `RESOLVED`, `ESCALATED`, and `FAILED` are terminal except an explicit new intake creates a new `NEW` case.

Explicit forbidden invariants: `NEW → RESOLVED`; `INVESTIGATING → RESOLVED`; `ACTION_EXECUTING → RESOLVED`; `CONTRADICTION → ACTION_EXECUTING`; and `VERIFYING` failure → `RESOLVED`. An action must pass through `VERIFYING`; two failed verifications route to `ESCALATED`; a contradiction can resume only with newly stored authoritative resolution evidence.

## Recommended implementation approach

1. **Platform foundation and records**
   - Enable and inspect Enter Cloud before any backend changes; validate Phase 0, document availability/fallbacks, create the requested architecture, data-model, registry, API, runbook, and test-result documentation.
   - Add a versioned Enter Cloud schema/migration for core ledgers, synthetic enterprise tables, policies, incidents, constraints, append-only protections, state transition function, event trigger, role/RLS policy, and approved-tool configuration.
   - Seed fully synthetic Scenario 1–4 data, policies POL-001 through POL-007, operational events, and reproducible reset behavior.

2. **Deterministic control and execution planes**
   - Implement typed, testable Cloud Function modules for intake, context construction/redaction, approved read evidence collection, freshness, sufficiency, contradiction detection, policy evaluation, risk scoring, authorization, contract validation, idempotent simulated refund, verification, reopen, escalation, approvals, root-cause radar, and reset.
   - Persist immutable decisions, actions, verification receipts, passports, outcome memory, and case events. Ensure every state change goes through the transition function.
   - Build the tool manifest and function interfaces. Qwen tool requests are read-only intents checked against this manifest; no write function is exposed to Qwen.

3. **Intelligence and workflow configuration**
   - Register one orchestrator and SK-01–SK-07 with bounded inputs/outputs; place strict JSON prompt templates and Zod validation schemas under backend configuration.
   - Restrict Qwen calls to semantic intake, investigation planning, contract proposal, targeted questions, escalation/case summaries, and root-cause interpretation. Re-prompt invalid JSON once, then deterministically fail/escalate.
   - Configure refund, approval, escalation, and verification workflows, or document and implement sequential Cloud Function fallbacks only when workflow capability validation fails.

4. **React application and design system**
   - Replace the starter gradient screen and default Vite styles with semantic enterprise tokens in `src/index.css` and Tailwind, using only the required system font stack, flat panels, 1px borders, and accessible semantic status treatments.
   - Create reusable case-domain types, API/query hooks, app shell/navigation, states, tables, timeline, provenance drawer, trust-gate rail, action/verification panels, and accessibility-compliant loading/empty/error/partial views.
   - Implement routes for Command Center, Active Case, Escalations/Case Brief, Approvals, Root-Cause Radar, and Testing/Admin. Source all displayed status, counts, ledgers, and timeline events from backend queries and visibly label all synthetic and simulated data.
   - Add responsive behavior: desktop 3-pane workspace, tablet navigation rail/context drawer, and mobile stacked workspace/bottom navigation; enable realtime when available or active-case 3-second polling fallback.

5. **Tests, safety, and acceptance**
   - Add golden tests GC-01–GC-06 and adversarial tests AT-01–AT-06 using mock Resolution Contracts and Evidence Ledger fixtures, never spending Qwen calls on deterministic tests.
   - Exercise success, evidence gap, contradiction, approval, verification-failure/reopen, incident-radar, stale-evidence, changed-contract approval, unapproved tool, unknown execution, and corrupt postcondition paths.
   - Update runbook/test records only with actual results; validate TypeScript, lint/build, backend test suite, and responsive routes at desktop and mobile viewports.

## Critical files and planned additions
- `src/index.css`, `tailwind.config.ts`, `src/App.tsx`, `src/router.tsx`, `src/pages/*`, `src/components/*`, `src/lib/*` — enterprise UI, routes, typed data access, and design tokens.
- `backend/schema/*`, `backend/functions/*`, `backend/workflows/*`, `backend/skills/*`, `backend/prompts/*`, `backend/seed/*`, `backend/tests/*` — deterministic backend, workflow definitions, tool boundary, prompts, fixtures, and behavioral tests.
- `knowledge/policies/*`, `knowledge/sops/*`, `knowledge/product/*` — semantic-only knowledge sources.
- `docs/phase0-validation.md`, `docs/fallbacks.md`, `docs/architecture.md`, `docs/data-model.md`, `docs/tool-registry.md`, `docs/api.md`, `docs/test-results.md`, `docs/demo-runbook.md` — accurate operational artifacts.

## Implementation checklist
- [ ] Validate and document each Phase 0 capability and fallback before backend implementation.
- [ ] Create all core, synthetic, policy, event, ledger, approval, passport, outcome-memory, and incident storage structures with referential constraints.
- [ ] Enforce the locked state transition allow-list and emit one `case_events` record for every successful transition.
- [ ] Seed resettable, labelled synthetic data and all four requested scenarios.
- [ ] Implement deterministic evidence freshness, sufficiency, contradiction, policy, risk, authorization, idempotency, and verification invariants.
- [ ] Implement only authorized, labelled simulated refund execution and closed-loop authoritative verification.
- [ ] Register the approved read/write tool manifest and reject Qwen requests outside the read allow-list.
- [ ] Create the single orchestrator, seven scoped skills, schema-validated prompts, and one-retry Qwen failure handling.
- [ ] Configure workflows or documented sequential deterministic fallbacks.
- [ ] Replace starter UI with the complete enterprise routes and real backend-backed case/replay data.
- [ ] Add all required UI loading, empty, error, partial, success, accessibility, responsive, synthetic, and simulated states.
- [ ] Implement role access or a visible demo-auth fallback without exposing secrets.
- [ ] Create golden and adversarial backend tests with hardcoded contracts and ledgers.
- [ ] Record actual test outcomes and complete the demo runbook.

## Verification checklist
- [ ] Given Scenario 1 evidence, when a valid refund contract is authorized, the simulated refund is executed once and the case resolves only after a `VERIFIED` receipt.
- [ ] Given Scenario 2 lacks a confirmation reference, when systems and history are checked, exactly one targeted question is stored and duplicate questioning is prevented.
- [ ] Given Scenario 3 has conflicting authoritative refund state, when contradiction validation runs, write authorization is blocked and the case escalates with a Case Brief.
- [ ] Given a refund above 5,000 INR, when the contract is valid, authorization requires an approval bound to the exact contract hash.
- [ ] Given the contract changes after approval, when execution is requested, the prior approval is invalid and execution is blocked.
- [ ] Given stale or missing authoritative evidence, when a financial action is proposed, sufficiency cannot return `SUFFICIENT`.
- [ ] Given unknown action execution, when retry is considered, idempotency/action/authoritative target checks occur before any re-execution.
- [ ] Given an intentionally failed predicate or two failed verification attempts, the case never resolves and routes through reopen or escalation as defined.
- [ ] Given Scenario 4 historical records and EVT-501, when radar runs, the incident distinguishes FACT, CORRELATION, HYPOTHESIS, and RECOMMENDATION.
- [ ] Confirm UI uses backend counts/events, labels synthetic/simulated data, and never represents execution success as verification success.
- [ ] Run `pnpm check`, `pnpm run build`, backend behavioral tests, and targeted desktop/mobile route visual checks after implementation.
