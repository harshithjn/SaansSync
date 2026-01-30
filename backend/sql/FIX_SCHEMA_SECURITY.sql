-- FIX: Security and Schema Integrity Update

-- 0. Drop conflicting policies BEFORE altering columns
DROP POLICY IF EXISTS "SaansSync alerts all" ON saanssync_alerts;
DROP POLICY IF EXISTS "Patients view alerts" ON saanssync_alerts;
DROP POLICY IF EXISTS "Doctors view alerts" ON saanssync_alerts;
DROP POLICY IF EXISTS "Allow anon saanssync_alerts" ON saanssync_alerts;

DROP POLICY IF EXISTS "Prescriptions all" ON prescriptions;
DROP POLICY IF EXISTS "Doctors view prescriptions" ON prescriptions;
DROP POLICY IF EXISTS "Patients view prescriptions" ON prescriptions;

-- 1. Fix SaansSync Alerts Table
-- Drop constraints if they exist to allow re-running script
ALTER TABLE saanssync_alerts DROP CONSTRAINT IF EXISTS fk_alerts_patient;
ALTER TABLE saanssync_alerts DROP CONSTRAINT IF EXISTS fk_alerts_doctor;

-- Convert columns to UUID and add Foreign Keys
ALTER TABLE saanssync_alerts 
  ALTER COLUMN patient_id TYPE UUID USING patient_id::UUID,
  ALTER COLUMN doctor_id TYPE UUID USING doctor_id::UUID;

ALTER TABLE saanssync_alerts
  ADD CONSTRAINT fk_alerts_patient FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_alerts_doctor FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE;

-- 2. Fix Prescriptions Table
-- Drop constraints if they exist
ALTER TABLE prescriptions DROP CONSTRAINT IF EXISTS fk_prescriptions_patient;
ALTER TABLE prescriptions DROP CONSTRAINT IF EXISTS fk_prescriptions_doctor;

-- Convert columns to UUID and add Foreign Keys
ALTER TABLE prescriptions 
  ALTER COLUMN patient_id TYPE UUID USING patient_id::UUID,
  ALTER COLUMN doctor_id TYPE UUID USING doctor_id::UUID;

ALTER TABLE prescriptions
  ADD CONSTRAINT fk_prescriptions_patient FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_prescriptions_doctor FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE;

-- 3. Security Hardening (RLS)
-- Create secure policies for Alerts
-- Doctors can see alerts for their patients
CREATE POLICY "Doctors view alerts"
  ON saanssync_alerts FOR SELECT
  USING (
    doctor_id = auth.uid()
  );

-- Patients can see their own alerts
CREATE POLICY "Patients view alerts"
  ON saanssync_alerts FOR SELECT
  USING (
    patient_id IN (
      SELECT id FROM patients WHERE auth_uid = auth.uid()
    )
  );

-- Create secure policies for Prescriptions
-- Doctors can see prescriptions they created
CREATE POLICY "Doctors view prescriptions"
  ON prescriptions FOR SELECT
  USING (
    doctor_id = auth.uid()
  );

-- Patients can see their own prescriptions
CREATE POLICY "Patients view prescriptions"
  ON prescriptions FOR SELECT
  USING (
    patient_id IN (
      SELECT id FROM patients WHERE auth_uid = auth.uid()
    )
  );

-- SERVICE ROLE (Backend) can do everything
-- Note: Supabase Service Role bypasses RLS automatically, 
-- but explicit policies help if we ever switch to restricted roles.
