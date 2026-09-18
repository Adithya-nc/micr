# Landing Page

## Structure
`src/pages/Index.tsx` renders the root route with: header and navigation, product statement, operating principles, architecture boundary, four demo scenario panels, backend status panel, app entry links, and footer.

## Routes
- `/` landing page
- `/app` Command Center placeholder
- `/app/cases/:caseId` Active Case placeholder
- `/escalations`, `/approvals`, `/radar`, `/testing`, `/status` placeholders

## Design rules applied
System font stack only, flat `#F9FAFB`/`#FFFFFF` panels with `1px` `#E5E7EB` borders, semantic status colors, no gradients, no glassmorphism, no decorative icons, all demo/mock content labelled.

## Backend dependency behavior
The landing page renders fully without a backend connection. `BackendStatusPanel` reads `src/lib/backendStatus.ts`, which truthfully reports every capability as pending until Enter Cloud Postgres, functions, workflows, and verification are connected. No fake metrics or verified resolutions are shown.
