# Workflows

- refund_action_workflow: validate authorization, check idempotency, execute simulated refund, record action, verify authoritative refund state.
- approval_workflow: bind request to decision and contract hash, reject stale or mutated contract, route grant to execution or rejection to escalation.
- escalation_workflow: assemble evidence-first Case Brief, assign queue, emit escalation event.
- verification_workflow: evaluate predicates against authoritative synthetic state, emit receipt, resolve only when VERIFIED, otherwise reopen or escalate.

When workflow infrastructure is unavailable, chain the same deterministic functions sequentially after Trust Layer authorization.
