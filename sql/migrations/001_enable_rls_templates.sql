-- Migration Template: 001_enable_rls_templates.sql
-- Purpose: Template and example policies for enabling Row-Level Security (RLS).
-- This file contains example SQL snippets and comments to guide a safe RLS rollout.

-- Example: enable RLS on a table named `daily_logs`
-- ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;

-- Example policy: allow rows where patient_id matches current user (adjust column names to your schema)
-- CREATE POLICY daily_logs_select_by_owner ON daily_logs
--   FOR SELECT
--   USING (patient_id = current_setting('app.current_user', true)::uuid);

-- Example policy: allow inserts when patient_id equals current user
-- CREATE POLICY daily_logs_insert_by_owner ON daily_logs
--   FOR INSERT
--   WITH CHECK (patient_id = current_setting('app.current_user', true)::uuid);

-- Notes and recommended rollout steps:
-- 1. Test policies in staging with a copy of production data.
-- 2. Use SET LOCAL app.current_user = '<uuid>' in sessions or ensure the app sets session variable
--    for the DB connection before requests where triggers/policies rely on it.
-- 3. Apply policies incrementally: start with SELECT policies only, deploy, run smoke tests.
-- 4. Add INSERT/UPDATE/DELETE policies after validating read access.
-- 5. Avoid a global blanket policy in production — prefer relationship checks.

-- Use the templates above as a starting point and replace `patient_id` with your actual owner keys.
