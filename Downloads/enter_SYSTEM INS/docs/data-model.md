# Data Model

Core case data: `cases`, `case_twins`, `case_events`.

Append-only audit ledgers: `evidence_ledger`, `decisions`, `actions`, `idempotency_ledger`, `verifications`, `approvals`, `resolution_passports`, `outcome_memory`.

Synthetic enterprise sources: `synthetic_customers`, `synthetic_products`, `synthetic_orders`, `synthetic_payments`, `synthetic_refunds`, `synthetic_tickets`, `synthetic_ticket_messages`, `policies`, `system_events`, `historical_resolutions`.

`cases.parent_case_id` links a post-resolution mismatch successor to its immutable resolved predecessor. All displayed source records must carry SYNTHETIC labels; executed demo refunds carry SIMULATED labels.
