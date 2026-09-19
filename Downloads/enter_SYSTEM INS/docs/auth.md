# Auth

## Approach
Enter Cloud Auth is not yet connected for ResolveSphere. A `[DEMO AUTH FALLBACK]` role switcher (`src/lib/demoAuth.tsx`) stores a selected role in `localStorage` and is presented as a demo-only mechanism, never as real authentication.

## Roles
- Customer: landing page only in this scope; no access to app-shell pages.
- Support Agent: Command Center, Active Case, Escalations, Approvals.
- Manager: Support Agent pages plus Root-Cause Radar.
- Admin: all pages, including Testing / Admin and Backend Status.

## Route protection
`AppShell` calls `canAccess(role, page)` before rendering page content. If the role is not permitted, `AccessRestrictedPanel` renders instead, with the reason and a role switcher; no page data is faked.

## Security restrictions
No secrets are stored client-side. No privilege check is performed against a real backend; access is a demo-only convenience gate, not a security boundary.

## Pending
Real Enter Cloud Auth, session storage, and RLS-backed role enforcement remain pending until the backend is connected.
