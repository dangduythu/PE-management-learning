# PE Management V8.0 Enterprise — IT handoff (development scaffold)

**Status:** Backend scaffold committed; NOT tested for production, NOT deployed. The V7 GitHub Pages release remains unchanged.

## Contents

| Folder | Purpose |
|---|---|
| `server/src/server.js` | Node/Express REST API with OIDC JWT validation, role checks, atomic task approvals and KPI query |
| `server/sql/001_initial.sql` | PostgreSQL schema for users, role grants, inspections, issues, tasks, review decisions, audit events |
| `server/.env.example` | Environment variables; sample placeholders ONLY |
| `server/package.json` | Node runtime dependencies; versions need IT review/lockfile |
| `V8_ARCHITECTURE.md` | Planned full system architecture and API scope |
| `IT_HANDOFF.md` | IT infrastructure requests and acceptance gates |

## Developer quick start — IT-controlled test VM only

1. Obtain permission to run Node.js (supported LTS version), PostgreSQL, and access the corporate IdP. Do not deploy from the public repository directly to production.
2. Provision isolated DB and least-privilege application DB credentials. Run migration `server/sql/001_initial.sql` after review.
3. In `enterprise/server`: run `npm install` on an approved build machine, then `npm run check`. Generate and commit an approved dependency lockfile before any real deployment.
4. Copy `.env.example` to a **non-committed** local `.env` and replace placeholders using IT-managed secrets. Keep this file off GitHub.
5. Register a test OIDC application/resource in approved Identity Provider and configure JWKS/issuer/audience.
6. Seed **test-only** app_users and role_grants, matching the IdP subject ID to the database user ID. There is no self-registration.
7. Run `npm start` behind IT-managed internal HTTPS reverse proxy; restrict traffic and database to approved network.
8. Access `GET /healthz` for basic liveness, and test authorized `GET /api/me` with an IT-issued token.

## What already exists (scaffold)

- Role-aware task creation and ownership enforcement.
- Task progress update with revision conflict check and submit-to-Leader.
- Two-stage Leader -> Manager review with verified identity from validated access token; rejects self-review.
- Transaction-based review decisions and basic audit events.
- Weighted KPI based on Manager-approved tasks only.
- Archive/restore Issue independently of Inspection.

## Mandatory development remaining

- Move **all existing V7 frontend modules** from localStorage to HTTP API; V8 Alpha GitHub Pages is only a demo.
- Full production APIs for Inspection/NG generation, templates, production records, improvement actions, attachments, dashboard and filters.
- Strong per-project, per-line and per-team authorization for ALL reads/writes (the scaffold's issue list is not scoped); refine role mapping and scope.
- Approval graph policy: Manager/Leader may need higher-level checks; enforce no self-assignment loopholes and reviewer separation across stages.
- Real corporate SSO sign-in in frontend using authorization code + PKCE and access token renewal.
- Tests: unit, integration, migrations, concurrent writes, permissions, CSRF/CORS, backups, load, security review.
- Rate limiting, structured logs, monitoring/alerting, lifecycle, input/schema validation for all endpoints, dependency lockfiles.
- Data migration and reconciliation from V7 JSON backups; IT-approved retention/PII handling.
- Change-management, staging pilot, sign-off from IT and PE management.

## Never assume

- The mock account switcher is authentication.
- The API scaffold alone is a finished enterprise server.
- Public GitHub Pages is suitable for internal company data.
- kPMS database can be connected directly without IT authorization.

## Current Git strategy

V7 official: `main/index.html`. V8 preview: `main/preview/v8-alpha/` (demo only). Enterprise branch: `v8-enterprise-development`. Do not merge enterprise code to main or expose it as a production service without testing and review.
