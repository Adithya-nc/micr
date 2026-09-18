# Deferred Verification Commands

- `pnpm check` — Expected: ESLint and TypeScript checks pass.
- `pnpm run build` — Expected: production artifact completes without errors.
- `python -m pytest backend/tests` — Expected: golden, adversarial, and state-machine fixtures pass with no live Qwen calls.
- Apply `backend/schema/resolvesphere.sql` through the approved Enter Cloud migration flow — Expected: ResolveSphere tables, constraints, and RLS policies exist.
- Run `backend/seed/demo_data.sql` after schema application — Expected: only labelled SYNTHETIC demo records are inserted.
- Deploy configured backend functions/workflows after review — Expected: UI endpoints return append-only case events and authoritative ledger data.
