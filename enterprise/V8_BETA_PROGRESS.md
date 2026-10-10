# V8.0 Beta implementation checkpoint

Date: 2026-10-10. Branch: `v8-enterprise-development`.

## Implemented in source
- V8 Alpha browser demo (synthetic accounts and two-step UI approval, NOT authentication).
- OIDC JWT verification against configured JWKS and database role grants in backend.
- Tasks: create, submit progress, leader review, manager review, revisions, audit records.
- Inspection POST with atomic NG-issue creation and list by inspector for non-managers.
- Production create/list and quantity-weighted Yield grouped by Line.
- Improvements create/list.
- Independent issue archive without deleting inspection.
- SQL migrations 001 and 002.
- Pure calculation tests for weighted Yield and final approved KPI.

## Required before a usable company-LAN Beta
1. Run `npm install`, `npm run check`, `npm test` on a supported Node runtime; store approved lockfile.
2. Execute migrations in a disposable PostgreSQL test DB; verify constraints and rollback.
3. Implement endpoint coverage for template CRUD, inspection items, issue lifecycle, improvement status, dashboards and exports.
4. **Security blocker:** add per-team/per-line authorization for queries and operations; current roles alone are insufficient.
5. **Security blocker:** ensure leader and manager cannot be same approver when corporate policy requires two independent reviewers.
6. Wire frontend to API using OIDC authorization code with PKCE; never store sensitive corporate data in localStorage.
7. End-to-end API integration tests against isolated DB and OIDC test issuer, including concurrency and rollback.
8. IT to decide infrastructure, secret management, TLS, DB accounts, retention, backup and monitoring.
9. Test migration from browser V7 JSON exports and report reconciliation.
10. Security review and IT sign-off before installing on company LAN.

This is a **development milestone, not a production release**. No company infrastructure or actual data were accessed.
