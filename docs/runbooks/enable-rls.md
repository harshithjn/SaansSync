# Runbook: Enabling Row-Level Security (RLS)

This runbook documents a safe staged approach to enabling RLS for production use.

1) Goal
   - Enable RLS for PHI tables so users can only access authorized rows.

2) Pre-reqs
   - Snapshot of production DB applied to staging for testing.
   - Running integration tests covering core API surface.

3) Steps (staging)
   - Apply `sql/migrations/000_add_audit_table.sql` to staging.
   - Review `audits` entries when exercising the app.
   - Edit `sql/migrations/001_enable_rls_templates.sql` replacing placeholders with schema values.
   - Apply RLS SELECT policies only and run smoke tests.
   - Add INSERT/UPDATE/DELETE policies incrementally.

4) Steps (production)
   - Schedule a low-traffic maintenance window.
   - Ensure application sets `app.current_user` per DB session or uses a claim in JWT mapping.
   - Apply migration for audit table and enable RLS per table as validated in staging.
   - Run smoke tests and verify `audits` entries and API correctness.

5) Rollback
   - To rollback: DROP the newly created policy or set app flag `app.bypass_rls = 'true'` (if implemented).
   - Keep the `audits` table — it is non-destructive and helpful for debugging.

6) Notes
   - Avoid enabling RLS blindly; test all queries (ORMs, raw SQL) for compatibility.
   - Verify triggers do not incur unacceptable latency; audits are lightweight JSON inserts.
