# PE Management Enterprise — IT Deployment Checklist

**Current release status: Development / not production ready.** The V7 application remains live on public GitHub Pages as a demonstration. Do not enter production or personal information.

## 1. IT prerequisites
- Approved internal VM/container runtime, internal DNS and TLS certificates.
- Approved supported Node.js LTS and PostgreSQL instance; separate app/migration DB users.
- Company OIDC provider: issuer, audience, JWKS endpoint, authorized frontend client with Authorization Code + PKCE.
- Firewall permitting only internal HTTPS to application; database connections limited to backend.
- IT policy for source review, vulnerability scanning, monitoring, backups, incidents and retention.

## 2. Initial validation
1. Clone `v8-enterprise-development` on an IT-approved build machine.
2. In `enterprise/server`, run `npm install`, `npm run check`, `npm test`.
3. After source and dependencies are approved, lock dependency versions and use `npm ci` for repeatable deployments.
4. Configure test PostgreSQL and run migrations `001_initial.sql` then `002_production_improvement.sql`.
5. Use `.env.example` to configure protected server secrets (never commit `.env`).
6. Configure OIDC test users, app_users and role_grants through an approved administrative onboarding process.
7. Run backend behind an internal HTTPS reverse proxy. Start with test data only.
8. Run authorized and unauthorized API tests. Check revision conflicts and two-stage approvals.

## 3. Blockers to a real go-live
- Frontend still needs complete SSO Authorization Code + PKCE login, all API-backed modules, and removal of localStorage for company data.
- Authorization must enforce line/team scope on all reads/writes; current scaffold only protects some endpoints by role.
- Build integration tests against real test PostgreSQL and a mock/controlled OIDC issuer, plus audit retention and migrations.
- Add template CRUD, issue edit/close workflow, production filters, improvement updates, exports.
- IT security approval, UAT, data reconciliation, recovery drill and operational handover.

## 4. Deployment decision
Do **not** deploy to the company's production network based only on these files. Stage first; complete blockers; obtain IT and PE owner sign-off.
