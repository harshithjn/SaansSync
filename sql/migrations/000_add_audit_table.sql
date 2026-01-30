-- Migration: 000_add_audit_table.sql
-- Purpose: create a generic audit table and trigger function that records
-- insert/update/delete operations on important PHI tables. This migration
-- is written defensively: triggers are only created for tables that exist.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Audit table
CREATE TABLE IF NOT EXISTS audits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  schema_name text NOT NULL,
  table_name text NOT NULL,
  operation text NOT NULL,
  changed_by uuid NULL,
  row_data jsonb NULL,
  changed_at timestamptz NOT NULL DEFAULT now()
);

-- Audit function
CREATE OR REPLACE FUNCTION fn_audit_changes() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  v_row jsonb;
  v_user uuid;
BEGIN
  IF (TG_OP = 'DELETE') THEN
    v_row = to_jsonb(OLD);
  ELSE
    v_row = to_jsonb(NEW);
  END IF;

  -- Attempt to read application-set current user id (set via SET LOCAL in app) or NULL
  BEGIN
    v_user := current_setting('app.current_user', true)::uuid;
  EXCEPTION WHEN others THEN
    v_user := NULL;
  END;

  INSERT INTO audits(schema_name, table_name, operation, changed_by, row_data, changed_at)
  VALUES (TG_TABLE_SCHEMA, TG_TABLE_NAME, TG_OP, v_user, v_row, now());

  RETURN NULL;
END;
$$;

-- Attach trigger to known PHI tables if they exist. Add or remove table names as needed.
DO $$
DECLARE
  tbl text;
  candidate_tables text[] := ARRAY['daily_logs','pfts','prescriptions','alerts','patients','users'];
BEGIN
  FOREACH tbl IN ARRAY candidate_tables LOOP
    IF EXISTS (SELECT 1 FROM pg_class WHERE relname = tbl) THEN
      BEGIN
        EXECUTE format('DROP TRIGGER IF EXISTS trg_audit_%I ON %I;', tbl, tbl);
        EXECUTE format('CREATE TRIGGER trg_audit_%I AFTER INSERT OR UPDATE OR DELETE ON %I FOR EACH ROW EXECUTE FUNCTION fn_audit_changes();', tbl, tbl);
      EXCEPTION WHEN others THEN
        RAISE NOTICE 'Could not create audit trigger on %', tbl;
      END;
    END IF;
  END LOOP;
END$$;

-- Index to help lookups
CREATE INDEX IF NOT EXISTS idx_audits_changed_at ON audits(changed_at DESC);

-- NOTE: This migration is safe to run in staging. Review triggers created and audit entries.
