# Fallbacks

- Knowledge: use versioned policy and SOP files plus the `policies` table; policy text never proves transactional state.
- Workflows: chain deterministic backend functions only after Trust Layer authorization.
- Realtime: poll lightweight case-event endpoints every three seconds on Active Case.
- Auth: show a `[DEMO ENVIRONMENT]` role selector until role-based backend auth is configured.
- Python/Pydantic: Pydantic models are included as the authoritative validation artifact. Runtime validation is pending a Python-capable backend deployment; frontend Zod is not a replacement.
- Runtime Qwen: use the strongest available Qwen reasoning model only after model protocol is confirmed. An admin-only `[DEMO FALLBACK]` may inject a pre-validated mock contract if runtime reasoning is unavailable.
- Workflow failure: an admin-only `[DEMO FALLBACK]` may simulate execution workflow completion, never verification.
- Contradiction testing: an admin-only `[DEMO FALLBACK]` may insert conflicting evidence, visibly labelled.
