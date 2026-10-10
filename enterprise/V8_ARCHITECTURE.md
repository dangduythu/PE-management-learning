# PE Management V8.0 — Enterprise Ready

Status: **Development preparation**. Branch: `v8-enterprise-development`. V7 remains official and unchanged.

## Goals
- Preserve V7's Daily Line Check, Issue Tracking, Check Sheet Builder, Work Tracking, Reviewer, KPI, Yield Improvement, Priority Center and dashboards.
- Multi-user architecture with real API, central PostgreSQL database, authenticated identities and server-enforced RBAC.
- Demo mode for synthetic sample data only. Never treat client-side demo permissions as secure authorization.
- No company secrets, employee personal data or production records in this public repository.

## Architecture
- Frontend: modular browser UI, shared API client and role-specific views.
- Backend: Node.js TypeScript API, PostgreSQL, schema migrations, server-side validation and authorization.
- Authentication: abstract OIDC integration (Entra ID or company IdP chosen by IT); local developer accounts are non-production only.
- Roles: system_admin, pe_manager, deputy_manager, engineer, technician; separate permission to administer the app from permission to approve KPI.
- Audit: append-only review events and server-recorded actor/time, with strict access and retention decisions approved by IT.
- Deployment: company-managed internal server/VM, TLS, approved DNS, network access controls, backup/restore and monitoring.

## Core entities
User, Team, Membership, RoleGrant, CheckSheetTemplate, CheckSheetItem, Inspection, InspectionResult, Issue, Task, TaskUpdate, ReviewDecision, ProductionRecord, ImprovementAction, AttachmentReference, AuditEvent.

Relations: Inspection -> Issue -> Task -> ReviewDecision -> approved KPI. Issue may be archived independently from Inspection. Closing Issue requires a verification record. Review decisions are immutable events; corrections create new events.

## API outline
- GET /api/me
- GET/POST /api/templates, GET/POST /api/inspections
- GET/POST/PATCH /api/issues, POST /api/issues/:id/archive
- GET/POST/PATCH /api/tasks, POST /api/tasks/:id/submit
- GET /api/reviews/pending, POST /api/tasks/:id/reviews
- GET/POST /api/production, GET/POST /api/improvements
- GET /api/dashboard, GET /api/kpi?from=&to=&team=
- GET /api/audit (manager/auditor permissions)

## Mandatory security/quality gates
1. Backend rejects unauthorized requests, even if frontend controls are manipulated.
2. Self-approval is rejected; Reviewer identity comes from verified authentication.
3. Concurrent task updates use revision/version checks to prevent lost updates.
4. Transactions ensure review events and task status update together.
5. Database backups and restore drills; documented retention and access policy.
6. Automated tests: inspection NG generation, archive without deleting inspection, task ownership, deadline, review and KPI formula.
7. Validate numeric production totals and weighted yield; prevent invalid KPI inputs.
8. Static checks and CI; dependency scanning; avoid credentials in Git.
9. Synthetic data only in public GitHub Pages previews; real deployment requires IT clearance.

## Delivery sequence
- V8.0-alpha: restructure frontend and offline/demo adapter, preserve V7 regression cases.
- V8.0-beta: API, PostgreSQL schema/migrations, SSO adapter, RBAC, audit and tests.
- V8.0-RC: compose/deployment instructions, IT handoff, pilot and security checklist.
- Enterprise go-live: only after IT approves infrastructure and security policies, manager signs off KPI policy, and end-to-end tests pass.

## IT information needed
Approved VM/OS, network segment, internal DNS/TLS, database provisioning, IdP/OIDC tenant, group mapping, VPN access, backups, security monitoring, retention, patching ownership and allowed ports.

**Not yet implemented:** this document is a development blueprint, not a claim that V8 backend/authentication is already functional.
