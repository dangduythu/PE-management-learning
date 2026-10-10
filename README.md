# PE Management V2.0

Static, browser-based demo for learning internal software development. No build tools and no server needed.

## Features
- Dashboard: weighted Yield, total Input, NG and NG rate; filter by Line and dates.
- Production Data: create and edit Lot/Line/date records, four defect categories, input validation.
- Yield Analysis: weighted Yield by Line.
- Defect Analysis: defect quantities and Pareto cumulative percentage.
- Data History: search, filter, edit, delete, clear all and load four sample records on demand.
- UTF-8 BOM CSV export for Excel.
- Local browser storage. No analytics, external libraries or network calls.

## Installation
1. Preserve `main` as V1.0; create a new branch `v2-development` in GitHub.
2. On `v2-development`, upload or replace `index.html` and `README.md` with these files, committing the change.
3. Test through GitHub Pages by temporarily publishing the development branch **only if you accept the live URL switching**, or use a local preview / separate demo repository. Prefer a separate test repository for simultaneous stable V1.0 and V2.0 previews.
4. Once approved, merge the development branch into `main`. GitHub Pages (main/root) updates automatically.

## Data safety
Use synthetic sample data only unless your organization's IT/security team approves deployment and data processing. Public GitHub and GitHub Pages are public. `localStorage` is per browser/profile/device and may be cleared; it is not cloud synchronization or managed backup.

## Yield convention
Weighted Yield = sum(Good) / sum(Input) × 100. NG = Input − Good.

The defect-category total must not exceed NG. Remaining NG is uncategorized; Pareto uses only categorized quantities.
