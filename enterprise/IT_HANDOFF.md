# IT Information Request — PE Management LAN Deployment

## Purpose
Host PE Management as a separate intranet application, optionally on shared kPMS infrastructure. **Do not modify kPMS production services.** Reuse authorized infrastructure only if isolated by access, service identities, configuration and database.

## Infrastructure questionnaire
- VM or container platform and approved operating system?
- Separate staging and production environment? Expected users/concurrency?
- Internal DNS, TLS certificate issuance and internal reverse proxy?
- Available identity provider: Entra ID, AD FS or other OIDC-compatible IdP?
- Identity application registration, groups/claims, API audience and JWKS URL?
- PostgreSQL available/approved or alternate IT-standard database?
- Network rules between browser, proxy, API, database and identity provider?
- Central logs, monitoring, backup schedule, restoration test, disaster recovery and retention policy?
- Security vulnerability scanning, patching, deployment CI/CD and designated service owner?
- Data classification and whether production/KPI/personnel data can be processed there?
- Whether kPMS exposes an **approved, authenticated, read-only API** for AVI, Yield, Defect; if so its specification, scopes and rate limits.

## Suggested separation
Browser (internal LAN) -> HTTPS reverse proxy -> PE Frontend + Backend API -> isolated PE DB. Authentication via company IdP. kPMS exchange only through authorized API or separate IT-managed integration job.

## Review roles
- Technician/Engineer: own assigned work, create inspections and issues within permitted line scope.
- Leader: assign/review within delegated team.
- PE Manager: second-stage approve and view authorized department KPI.
- IT Admin: technical operations, **no implicit KPI approval rights**.
- Auditor: read-only audit log if company policy permits.

## Acceptance criteria before go-live
- Authentication verified using company identities, MFA/conditional access if mandated.
- No demo-account switching in production; server checks every permission.
- Cannot self-review or approve out-of-sequence; every decision auditable.
- Concurrent updates cannot overwrite each other; transaction and revision tests.
- Restricted read access by line/team; no unauthorized data in APIs or exports.
- HTTPS, secure secrets, database least privilege, network isolation.
- Database backup recovery demonstrated; restore objectives approved.
- Migration of existing V7 data checked with counts and reconciliation.
- Full end-to-end regression pass for check sheet, issue lifecycle, task, review, KPI, yield and export.
- IT security signoff and PE Manager functional acceptance documented.

## Deliverables IT receives
Source repository branch `v8-enterprise-development`, API scaffold, SQL migration, environment variable template and project roadmap. **No passwords, production tokens or proprietary datasets are included**.
