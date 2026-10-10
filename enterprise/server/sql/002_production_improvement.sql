BEGIN;
CREATE TABLE IF NOT EXISTS production_records (
  id UUID PRIMARY KEY, production_date DATE NOT NULL,
  project TEXT NOT NULL, line TEXT NOT NULL, lot TEXT NOT NULL,
  total_qty INTEGER NOT NULL CHECK(total_qty>0),
  good_qty INTEGER NOT NULL CHECK(good_qty>=0 AND good_qty<=total_qty),
  defect TEXT, defect_qty INTEGER NOT NULL DEFAULT 0
    CHECK(defect_qty>=0 AND defect_qty<=total_qty-good_qty),
  entered_by TEXT NOT NULL REFERENCES app_users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_production_project_date ON production_records(project,production_date);
CREATE TABLE IF NOT EXISTS improvement_actions (
  id UUID PRIMARY KEY, title TEXT NOT NULL, process TEXT NOT NULL DEFAULT '',
  owner_id TEXT NOT NULL REFERENCES app_users(id),
  before_loss NUMERIC(6,3) CHECK(before_loss BETWEEN 0 AND 100),
  after_loss NUMERIC(6,3) CHECK(after_loss BETWEEN 0 AND 100),
  status TEXT NOT NULL DEFAULT 'Planning'
    CHECK(status IN ('Planning','Trial','Monitoring','Verified')),
  due_date DATE, evidence TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_improvements_owner ON improvement_actions(owner_id,status);
COMMIT;
