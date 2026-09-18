# Phase 0 Validation

| Capability | Status | Evidence | Fallback |
|---|---|---|---|
| Enter Cloud | Available | Connected; no visible tables returned | Not required |
| Agent builder | Unverified | No workspace agent API exposed | Versioned agent configuration files |
| Skills | Available | Workspace skills loaded | Local skill specifications |
| Knowledge | Unverified | No Knowledge authoring API exposed | Versioned policy and SOP records |
| Cloud Postgres | Available | Connected Cloud schema inspected | Not required |
| Backend functions | Available | Deployment tool exposed | Files retained pending deployment |
| Workflows | Unverified | No workflow tool exposed | Deterministic sequential function design |
| Auth | Unverified | Configuration tool exposed | Clearly labelled demo role fallback |
| Realtime | Unverified | No subscription validation performed | Three-second event polling |
| Storage | Unverified | No storage validation required | Not required for baseline |
| App deployment | Available | Vite application workspace present | Not required |
| Runtime Qwen | Available | AI capability enabled; Qwen 3.8 Max Preview is available | No live calls during deterministic tests |
| Python/Pydantic | Unverified | Workspace cannot run Python under command restrictions | Pydantic models are supplied as authoritative deployment artifacts; do not substitute Zod |

No database migration, seed, deployment, build, dev, compiler, or live Qwen call was executed.