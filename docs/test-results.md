# Test Results

No command-based tests were run because build, dev, package-manager, compiler, migration, seed, deployment, and server commands are restricted.

| Test group | Status | Evidence |
|---|---|---|
| GC-01 through GC-06 | Pending | Fixtures and deterministic test scaffold created; see verification commands |
| AT-01 through AT-06 | Pending | Fixtures and deterministic test scaffold created; see verification commands |
| State machine | Pending | `backend/tests/test_control_plane.py` covers direct resolution, bounded reopen, contradiction guard |
| Pydantic schema validation | Pending | `backend/models/contracts.py` is the authoritative schema artifact |
