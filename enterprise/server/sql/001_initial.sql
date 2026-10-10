BEGIN;
CREATE TABLE IF NOT EXISTS app_users (
 id TEXT PRIMARY KEY, display_name TEXT NOT NULL, email TEXT,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS role_grants (
 user_id TEXT NOT NULL REFERENCES app_users(id), role TEXT NOT NULL
 CHECK (role IN ('technician','engineer','leader','manager','it_admin')),
 PRIMARY KEY(user_id,role)
);
CREATE TABLE IF NOT EXISTS inspections (
 id UUID PRIMARY KEY, performed_by TEXT NOT NULL REFERENCES app_users(id),
 template_name TEXT NOT NULL, line TEXT NOT NULL, production_date DATE NOT NULL,
 result TEXT NOT NULL CHECK(result IN ('OK','NG')), results JSONB NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS issues (
 id UUID PRIMARY KEY, inspection_id UUID REFERENCES inspections(id),
 title TEXT NOT NULL, line TEXT, status TEXT NOT NULL DEFAULT 'Open'
 CHECK(status IN ('Open','Progress','Closed')), archived BOOLEAN NOT NULL DEFAULT false,
 owner_id TEXT REFERENCES app_users(id), created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS tasks (
 id UUID PRIMARY KEY, issue_id UUID REFERENCES issues(id), name TEXT NOT NULL,
 owner_id TEXT NOT NULL REFERENCES app_users(id), created_by TEXT NOT NULL REFERENCES app_users(id),
 priority INTEGER NOT NULL DEFAULT 2 CHECK(priority BETWEEN 1 AND 3),
 complexity INTEGER NOT NULL DEFAULT 2 CHECK(complexity BETWEEN 1 AND 3),
 progress INTEGER NOT NULL DEFAULT 0 CHECK(progress BETWEEN 0 AND 100),
 approved_percent INTEGER CHECK(approved_percent BETWEEN 0 AND 100),
 status TEXT NOT NULL DEFAULT 'Not started'
 CHECK(status IN ('Not started','In progress','Pending leader','Pending manager','Reviewed','Rejected')),
 evidence TEXT NOT NULL DEFAULT '', due_date DATE, revision INTEGER NOT NULL DEFAULT 1,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS review_decisions (
 id UUID PRIMARY KEY, task_id UUID NOT NULL REFERENCES tasks(id),
 reviewer_id TEXT NOT NULL REFERENCES app_users(id),
 stage TEXT NOT NULL CHECK(stage IN ('leader','manager')),
 decision TEXT NOT NULL CHECK(decision IN ('approve','reject')),
 verified_percent INTEGER NOT NULL CHECK(verified_percent BETWEEN 0 AND 100),
 comment TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS audit_events (
 id BIGSERIAL PRIMARY KEY, actor_id TEXT NOT NULL, entity TEXT NOT NULL,
 entity_id TEXT NOT NULL, action TEXT NOT NULL, detail JSONB NOT NULL DEFAULT '{}',
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_tasks_owner_status ON tasks(owner_id,status);
CREATE INDEX IF NOT EXISTS ix_tasks_due ON tasks(due_date);
CREATE INDEX IF NOT EXISTS ix_issue_inspection ON issues(inspection_id);
CREATE INDEX IF NOT EXISTS ix_reviews_task ON review_decisions(task_id);
COMMIT;
