# PE Management V9 Preview

This preview is isolated on branch `feature/pe-management-v9`. The default branch (`main`) is unchanged.

Open `preview/v9/index.html` in a browser, or test the HTML file using a static web server. The preview does not require a backend.

## Included
- Dashboard, Line/Yield, Check History, Task Kanban, Issue/CAPA editing, Team, two-stage demo Approval, KPI, Improvements.
- JSON export/import, V7/V8 localStorage migration, synthetic sample data.
- Data is stored under `pe-management-v9`. It does not overwrite `pe-management-unified-v7` or `pe-management-unified-v8alpha`.

## Important limitations
- Prototype only. Roles/approvals are not authenticated and are not suitable for production use.
- There is no cloud sync. Data is browser-origin scoped; migrating between preview domains requires a JSON export/import.
- Only use synthetic data or data your organization explicitly authorizes.
- Do not switch GitHub Pages' production source to this branch without explicit approval.
