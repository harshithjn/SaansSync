-- ============================================================
-- PRODUCTION HEALTHCARE AUTHENTICATION SYSTEM
-- Single SQL file for complete auth implementation
-- Execute this ONCE in Supabase SQL Editor
-- ============================================================

-- ============================================================
-- 0. GRANT PERMISSIONS TO SERVICE ROLE
-- ============================================================

-- Grant necessary permissions to service_role
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Grant permissions for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;

-- ============================================================
-- 1. CLEAN SLATE - REMOVE EXISTING AUTH SETUP
-- ============================================================

-- Drop existing constraints and policies first
ALTER TABLE IF EXISTS doctors DROP CONSTRAINT IF EXISTS doctors_id_fkey;
ALTER TABLE IF EXISTS doctors DROP CONSTRAINT IF EXISTS doctors_pkey CASCADE;

-- Drop existing policies, triggers, and functions in dependency order
DROP POLICY IF EXISTS "Doctors read patient logs" ON daily_logs;
DROP POLICY IF EXISTS "Doctors manage alerts" ON saanssync_alerts;
DROP POLICY IF EXISTS "Doctors manage prescriptions" ON prescriptions;
DROP POLICY IF EXISTS "Doctors read own" ON doctors;
DROP POLICY IF EXISTS "Doctors insert own" ON doctors;
DROP POLICY IF EXISTS "Doctors update own" ON doctors;
DROP POLICY IF EXISTS "Admin manage doctors" ON doctors;
DROP POLICY IF EXISTS "Service role manage doctors" ON doctors;
DROP POLICY IF EXISTS "Service role insert doctors" ON doctors;
DROP POLICY IF EXISTS "Patients read own" ON patients;
DROP POLICY IF EXISTS "Patients insert own" ON patients;
DROP POLICY IF EXISTS "Patients update own" ON patients;
DROP POLICY IF EXISTS "Doctors read patients" ON patients;
DROP POLICY IF EXISTS "Patients manage own logs" ON daily_logs;
DROP POLICY IF EXISTS "Patients view own alerts" ON saanssync_alerts;
DROP POLICY IF EXISTS "System create alerts" ON saanssync_alerts;
DROP POLICY IF EXISTS "Patients view own prescriptions" ON prescriptions;
DROP POLICY IF EXISTS "Approved doctors read patients" ON patients;
DROP POLICY IF EXISTS "Approved doctors read logs" ON daily_logs;
DROP POLICY IF EXISTS "Approved doctors manage alerts" ON saanssync_alerts;
DROP POLICY IF EXISTS "Approved doctors manage own prescriptions" ON prescriptions;
DROP POLICY IF EXISTS "Service role manage patients" ON patients;
DROP POLICY IF EXISTS "Service role manage logs" ON daily_logs;
DROP POLICY IF EXISTS "Service role manage alerts" ON saanssync_alerts;
DROP POLICY IF EXISTS "Service role manage prescriptions" ON prescriptions;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

DROP FUNCTION IF EXISTS create_user_profile();
DROP FUNCTION IF EXISTS check_doctor_approved();
DROP FUNCTION IF EXISTS check_doctor_approved(UUID);
DROP FUNCTION IF EXISTS approve_doctor(UUID);
DROP FUNCTION IF EXISTS reject_doctor(UUID);
DROP FUNCTION IF EXISTS get_pending_doctors();
DROP FUNCTION IF EXISTS is_admin();
DROP FUNCTION IF EXISTS get_all_doctors();

-- ============================================================
-- 2. CORE AUTH TABLES
-- ============================================================

-- Recreate doctors table with proper structure
DROP TABLE IF EXISTS doctors CASCADE;
CREATE TABLE doctors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID UNIQUE, -- No foreign key constraint initially
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  phone TEXT,
  approval_status TEXT NOT NULL DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key constraint after table creation (safer)
ALTER TABLE doctors ADD CONSTRAINT doctors_auth_user_id_fkey 
FOREIGN KEY (auth_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Patients table for phone-based auth
CREATE TABLE IF NOT EXISTS patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  phone TEXT UNIQUE NOT NULL,
  full_name TEXT,
  patient_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_doctors_approval_status ON doctors(approval_status);
CREATE INDEX IF NOT EXISTS idx_doctors_email ON doctors(email);
CREATE INDEX IF NOT EXISTS idx_doctors_auth_user_id ON doctors(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_patients_auth_user_id ON patients(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_patients_phone ON patients(phone);

-- ============================================================
-- 3. AUTOMATIC PROFILE CREATION
-- ============================================================

-- Function to create user profiles based on role (only for patients and approved doctors)
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  DECLARE
    user_role TEXT := NEW.raw_user_meta_data->>'role';
    user_phone TEXT := COALESCE(NEW.raw_user_meta_data->>'phone', '');
    user_full_name TEXT := COALESCE(NEW.raw_user_meta_data->>'full_name', '');
    user_email TEXT := NEW.email;
  BEGIN
    -- Create patient profile (phone-based registration)
    IF user_role = 'patient' OR user_phone != '' THEN
      INSERT INTO patients (
        auth_user_id,
        phone,
        full_name,
        patient_data
      ) VALUES (
        NEW.id,
        user_phone,
        user_full_name,
        '{}'::jsonb
      );
      
      RAISE LOG 'Created patient profile for user: %', NEW.id;
    
    -- Update doctor profile with auth_user_id (when admin approves)
    ELSIF user_role = 'doctor' AND user_email IS NOT NULL THEN
      UPDATE doctors 
      SET auth_user_id = NEW.id, updated_at = NOW()
      WHERE email = user_email AND approval_status = 'approved' AND auth_user_id IS NULL;
      
      RAISE LOG 'Linked doctor profile to auth user: %', NEW.id;
    END IF;
    
    RETURN NEW;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'Failed to create user profile for %: %', NEW.id, SQLERRM;
      RETURN NEW;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users insert
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_user_profile();

-- ============================================================
-- 4. ROW LEVEL SECURITY POLICIES
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

-- DOCTORS POLICIES
-- Doctors can read their own profile (using auth_user_id)
CREATE POLICY "Doctors read own"
  ON doctors FOR SELECT
  USING (auth.uid() = auth_user_id);

-- Doctors can update their own profile (using auth_user_id)
CREATE POLICY "Doctors update own"
  ON doctors FOR UPDATE
  USING (auth.uid() = auth_user_id)
  WITH CHECK (auth.uid() = auth_user_id);

-- Service role can manage all doctors (for admin operations)
CREATE POLICY "Service role manage doctors"
  ON doctors FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Allow service role to insert new doctor registrations
CREATE POLICY "Service role insert doctors"
  ON doctors FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- PATIENTS POLICIES
-- Patients can read their own profile
CREATE POLICY "Patients read own"
  ON patients FOR SELECT
  USING (auth.uid() = auth_user_id);

-- Patients can insert their own profile (handled by trigger)
CREATE POLICY "Patients insert own"
  ON patients FOR INSERT
  WITH CHECK (auth.uid() = auth_user_id);

-- Patients can update their own profile
CREATE POLICY "Patients update own"
  ON patients FOR UPDATE
  USING (auth.uid() = auth_user_id)
  WITH CHECK (auth.uid() = auth_user_id);

-- Approved doctors can read patients (for healthcare management)
CREATE POLICY "Approved doctors read patients"
  ON patients FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM doctors 
      WHERE doctors.auth_user_id = auth.uid() 
      AND doctors.approval_status = 'approved'
    )
  );

-- Service role can manage all patients
CREATE POLICY "Service role manage patients"
  ON patients FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============================================================
-- 5. DOCTOR APPROVAL SYSTEM
-- ============================================================

-- Function to check if doctor is approved (no parameters - uses auth.uid())
CREATE OR REPLACE FUNCTION check_doctor_approved()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM doctors 
    WHERE auth_user_id = auth.uid() 
    AND approval_status = 'approved'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to approve doctor (service role only) - creates Supabase auth user
CREATE OR REPLACE FUNCTION approve_doctor(doctor_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  doctor_email TEXT;
  doctor_name TEXT;
  auth_user_id UUID;
BEGIN
  -- Only service role can approve
  IF auth.role() != 'service_role' THEN
    RAISE EXCEPTION 'Access denied. Service role required.';
  END IF;

  -- Get doctor details
  SELECT email, full_name INTO doctor_email, doctor_name
  FROM doctors 
  WHERE id = doctor_uuid AND approval_status = 'pending';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Doctor not found or already processed.';
  END IF;

  -- Update approval status first
  UPDATE doctors 
  SET approval_status = 'approved', updated_at = NOW()
  WHERE id = doctor_uuid;
  
  -- Note: Supabase auth user creation will be handled by the frontend
  -- The trigger will link the auth_user_id when the user is created
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reject doctor (service role only)
CREATE OR REPLACE FUNCTION reject_doctor(doctor_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Only service role can reject
  IF auth.role() != 'service_role' THEN
    RAISE EXCEPTION 'Access denied. Service role required.';
  END IF;

  UPDATE doctors 
  SET approval_status = 'rejected', updated_at = NOW()
  WHERE id = doctor_uuid;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all doctors (service role only)
CREATE OR REPLACE FUNCTION get_all_doctors()
RETURNS TABLE (
  id UUID,
  auth_user_id UUID,
  email TEXT,
  full_name TEXT,
  phone TEXT,
  approval_status TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  -- Only service role can access
  IF auth.role() != 'service_role' THEN
    RAISE EXCEPTION 'Access denied. Service role required.';
  END IF;

  RETURN QUERY
  SELECT d.id, d.auth_user_id, d.email, d.full_name, d.phone, d.approval_status, d.created_at, d.updated_at
  FROM doctors d
  ORDER BY d.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get pending doctors (service role only)
CREATE OR REPLACE FUNCTION get_pending_doctors()
RETURNS TABLE (
  id UUID,
  auth_user_id UUID,
  email TEXT,
  full_name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  -- Only service role can access
  IF auth.role() != 'service_role' THEN
    RAISE EXCEPTION 'Access denied. Service role required.';
  END IF;

  RETURN QUERY
  SELECT d.id, d.auth_user_id, d.email, d.full_name, d.phone, d.created_at
  FROM doctors d
  WHERE d.approval_status = 'pending'
  ORDER BY d.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 6. SUPPORTING TABLES WITH PROPER RLS
-- ============================================================

-- Daily logs table (if not exists)
CREATE TABLE IF NOT EXISTS daily_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,
  disease_type TEXT,
  disease_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (patient_id, log_date)
);

ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;

-- Patients can manage their own logs
CREATE POLICY "Patients manage own logs"
  ON daily_logs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM patients 
      WHERE patients.id = daily_logs.patient_id 
      AND patients.auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM patients 
      WHERE patients.id = daily_logs.patient_id 
      AND patients.auth_user_id = auth.uid()
    )
  );

-- Approved doctors can read patient logs
CREATE POLICY "Approved doctors read logs"
  ON daily_logs FOR SELECT
  USING (check_doctor_approved());

-- Service role can manage all logs
CREATE POLICY "Service role manage logs"
  ON daily_logs FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Alerts table (if not exists)
CREATE TABLE IF NOT EXISTS saanssync_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL,
  level TEXT NOT NULL CHECK (level IN ('RED', 'YELLOW', 'GREEN')),
  reason_text TEXT NOT NULL,
  disease_type TEXT NOT NULL,
  acknowledged BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE saanssync_alerts ENABLE ROW LEVEL SECURITY;

-- Patients can view their own alerts
CREATE POLICY "Patients view own alerts"
  ON saanssync_alerts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM patients 
      WHERE patients.id = saanssync_alerts.patient_id 
      AND patients.auth_user_id = auth.uid()
    )
  );

-- Approved doctors can manage alerts
CREATE POLICY "Approved doctors manage alerts"
  ON saanssync_alerts FOR ALL
  USING (check_doctor_approved())
  WITH CHECK (check_doctor_approved());

-- Service role can manage all alerts
CREATE POLICY "Service role manage alerts"
  ON saanssync_alerts FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Prescriptions table (if not exists)
CREATE TABLE IF NOT EXISTS prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  prescription_date DATE NOT NULL DEFAULT CURRENT_DATE,
  medications JSONB NOT NULL DEFAULT '[]',
  diagnosis TEXT,
  instructions TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;

-- Patients can view their own prescriptions
CREATE POLICY "Patients view own prescriptions"
  ON prescriptions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM patients 
      WHERE patients.id = prescriptions.patient_id 
      AND patients.auth_user_id = auth.uid()
    )
  );

-- Approved doctors can manage prescriptions they created
CREATE POLICY "Approved doctors manage own prescriptions"
  ON prescriptions FOR ALL
  USING (
    doctor_id = auth.uid() AND check_doctor_approved()
  )
  WITH CHECK (
    doctor_id = auth.uid() AND check_doctor_approved()
  );

-- Service role can manage all prescriptions
CREATE POLICY "Service role manage prescriptions"
  ON prescriptions FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============================================================
-- 7. VERIFICATION QUERIES
-- ============================================================

-- Verify setup
SELECT 'PRODUCTION AUTH SYSTEM SETUP COMPLETE' as status;

-- Show table status
SELECT 
  table_name,
  CASE WHEN table_name IN ('doctors', 'patients', 'daily_logs', 'saanssync_alerts', 'prescriptions') 
    THEN '✅ CREATED' 
    ELSE '❌ MISSING' 
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('doctors', 'patients', 'daily_logs', 'saanssync_alerts', 'prescriptions')
ORDER BY table_name;

-- Show RLS status
SELECT 
  schemaname, 
  tablename, 
  CASE WHEN rowsecurity THEN '✅ ENABLED' ELSE '❌ DISABLED' END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('doctors', 'patients', 'daily_logs', 'saanssync_alerts', 'prescriptions')
ORDER BY tablename;