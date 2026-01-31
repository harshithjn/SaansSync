-- ============================================================
-- HEALTHCARE DOMAIN DATA SCHEMA
-- Professional Supabase integration for doctor & patient domain logic
-- Execute this ONCE in Supabase SQL Editor (after auth.sql)
-- ============================================================

-- ============================================================
-- 0. COMPREHENSIVE CLEANUP - REMOVE ALL EXISTING DOMAIN SETUP
-- ============================================================

-- Drop existing functions first (they don't depend on tables)
DROP FUNCTION IF EXISTS get_doctor_patients(UUID);
DROP FUNCTION IF EXISTS assign_patient_to_doctor(UUID, UUID, UUID);
DROP FUNCTION IF EXISTS create_patient_transfer_request(UUID, UUID);
DROP FUNCTION IF EXISTS complete_patient_transfer(UUID, UUID, TEXT);

-- Drop ALL policies on ALL domain tables (comprehensive cleanup)
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Drop all policies on daily_logs table
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'daily_logs') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON daily_logs';
    END LOOP;
    
    -- Drop all policies on saanssync_alerts table
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'saanssync_alerts') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON saanssync_alerts';
    END LOOP;
    
    -- Drop all policies on prescriptions table
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'prescriptions') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON prescriptions';
    END LOOP;
    
    -- Drop all policies on pft_records table
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'pft_records') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON pft_records';
    END LOOP;
    
    -- Drop all policies on doctor_patient_assignments table
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'doctor_patient_assignments') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON doctor_patient_assignments';
    END LOOP;
    
    -- Drop all policies on patient_transfer_requests table
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'patient_transfer_requests') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON patient_transfer_requests';
    END LOOP;
    
    -- Drop domain-specific patient policies (but keep auth policies)
    DROP POLICY IF EXISTS "Patients manage own profile" ON patients;
    DROP POLICY IF EXISTS "Approved doctors view assigned patients" ON patients;
    -- Note: Keep "Service role manage patients" from auth.sql - don't drop it
END $$;

-- Drop domain tables in dependency order (CASCADE to handle foreign keys)
DROP TABLE IF EXISTS patient_otp_codes CASCADE;
DROP TABLE IF EXISTS patient_transfer_requests CASCADE;
DROP TABLE IF EXISTS doctor_patient_assignments CASCADE;
DROP TABLE IF EXISTS pft_records CASCADE;
DROP TABLE IF EXISTS prescriptions CASCADE;
DROP TABLE IF EXISTS saanssync_alerts CASCADE;
DROP TABLE IF EXISTS daily_logs CASCADE;

-- ============================================================
-- 1. EXTEND PATIENTS TABLE WITH DOMAIN FIELDS
-- ============================================================

-- Add domain-specific columns to the existing patients table from auth.sql
DO $$
BEGIN
    -- Add doctor_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'patients' AND column_name = 'doctor_id') THEN
        ALTER TABLE patients ADD COLUMN doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL;
    END IF;
    
    -- Add email column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'patients' AND column_name = 'email') THEN
        ALTER TABLE patients ADD COLUMN email TEXT;
    END IF;
    
    -- Add default_password column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'patients' AND column_name = 'default_password') THEN
        ALTER TABLE patients ADD COLUMN default_password TEXT DEFAULT 'patient123';
    END IF;
    
    -- Add disease_type column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'patients' AND column_name = 'disease_type') THEN
        ALTER TABLE patients ADD COLUMN disease_type TEXT;
    END IF;
END $$;

-- ============================================================
-- 2. DOMAIN TABLES (NO AUTH LOGIC)
-- ============================================================

-- Patient daily logs
CREATE TABLE IF NOT EXISTS daily_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,
  disease_type TEXT NOT NULL,
  disease_data JSONB NOT NULL DEFAULT '{}',
  red_flag_score INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (patient_id, log_date)
);

-- Healthcare alerts
CREATE TABLE IF NOT EXISTS saanssync_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL,
  level TEXT NOT NULL CHECK (level IN ('RED', 'YELLOW', 'GREEN')),
  reason_text TEXT NOT NULL,
  disease_type TEXT NOT NULL,
  alert_data JSONB DEFAULT '{}',
  acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Medical prescriptions
CREATE TABLE IF NOT EXISTS prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  prescription_date DATE NOT NULL DEFAULT CURRENT_DATE,
  medications JSONB NOT NULL DEFAULT '[]',
  diagnosis TEXT,
  instructions TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PFT (Pulmonary Function Test) records
CREATE TABLE IF NOT EXISTS pft_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL,
  test_date DATE NOT NULL,
  fev1 DECIMAL(5,2),
  fvc DECIMAL(5,2),
  fev1_fvc_ratio DECIMAL(5,2),
  pef DECIMAL(5,2),
  test_data JSONB DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Doctor-Patient relationships
CREATE TABLE IF NOT EXISTS doctor_patient_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_by UUID REFERENCES doctors(id),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'transferred')),
  notes TEXT,
  UNIQUE (doctor_id, patient_id)
);

-- Patient transfer requests (OTP-based)
CREATE TABLE IF NOT EXISTS patient_transfer_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  from_doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  to_doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL,
  otp_code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Patient OTP codes for phone authentication (fallback system)
CREATE TABLE IF NOT EXISTS patient_otp_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_daily_logs_patient_date ON daily_logs(patient_id, log_date DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_patient_created ON saanssync_alerts(patient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_doctor_created ON saanssync_alerts(doctor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient ON prescriptions(patient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prescriptions_doctor ON prescriptions(doctor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pft_records_patient ON pft_records(patient_id, test_date DESC);
CREATE INDEX IF NOT EXISTS idx_doctor_patient_assignments ON doctor_patient_assignments(doctor_id, status);
CREATE INDEX IF NOT EXISTS idx_patient_otp_codes_phone ON patient_otp_codes(phone, expires_at);

-- Additional indexes for extended patient columns
CREATE INDEX IF NOT EXISTS idx_patients_doctor_id ON patients(doctor_id);
CREATE INDEX IF NOT EXISTS idx_patients_email ON patients(email);
CREATE INDEX IF NOT EXISTS idx_patients_disease_type ON patients(disease_type);

-- ============================================================
-- 3. ROW LEVEL SECURITY POLICIES
-- ============================================================

-- Enable RLS on all domain tables
ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE saanssync_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pft_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_patient_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_transfer_requests ENABLE ROW LEVEL SECURITY;

-- PATIENTS TABLE POLICIES (additional to auth.sql)
-- Note: "Service role manage patients" policy is already defined in auth.sql

-- Approved doctors can view their assigned patients
CREATE POLICY "Approved doctors view assigned patients"
  ON patients FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM doctors d
      JOIN doctor_patient_assignments dpa ON d.id = dpa.doctor_id
      WHERE d.auth_user_id = auth.uid() 
      AND d.approval_status = 'approved'
      AND dpa.patient_id = patients.id
      AND dpa.status = 'active'
    )
  );

-- DAILY LOGS POLICIES
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

-- Approved doctors can read logs of their assigned patients
CREATE POLICY "Approved doctors read assigned patient logs"
  ON daily_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM doctors d
      JOIN doctor_patient_assignments dpa ON d.id = dpa.doctor_id
      WHERE d.auth_user_id = auth.uid() 
      AND d.approval_status = 'approved'
      AND dpa.patient_id = daily_logs.patient_id
      AND dpa.status = 'active'
    )
  );

-- Service role can manage all logs
CREATE POLICY "Service role manage logs"
  ON daily_logs FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ALERTS POLICIES
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

-- Approved doctors can manage alerts for their assigned patients
CREATE POLICY "Approved doctors manage assigned patient alerts"
  ON saanssync_alerts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM doctors d
      JOIN doctor_patient_assignments dpa ON d.id = dpa.doctor_id
      WHERE d.auth_user_id = auth.uid() 
      AND d.approval_status = 'approved'
      AND dpa.patient_id = saanssync_alerts.patient_id
      AND dpa.status = 'active'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM doctors d
      JOIN doctor_patient_assignments dpa ON d.id = dpa.doctor_id
      WHERE d.auth_user_id = auth.uid() 
      AND d.approval_status = 'approved'
      AND dpa.patient_id = saanssync_alerts.patient_id
      AND dpa.status = 'active'
    )
  );

-- Service role can manage all alerts
CREATE POLICY "Service role manage alerts"
  ON saanssync_alerts FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- PRESCRIPTIONS POLICIES
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

-- Approved doctors can manage prescriptions for their assigned patients
CREATE POLICY "Approved doctors manage assigned patient prescriptions"
  ON prescriptions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM doctors d
      JOIN doctor_patient_assignments dpa ON d.id = dpa.doctor_id
      WHERE d.auth_user_id = auth.uid() 
      AND d.approval_status = 'approved'
      AND dpa.patient_id = prescriptions.patient_id
      AND dpa.status = 'active'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM doctors d
      JOIN doctor_patient_assignments dpa ON d.id = dpa.doctor_id
      WHERE d.auth_user_id = auth.uid() 
      AND d.approval_status = 'approved'
      AND dpa.patient_id = prescriptions.patient_id
      AND dpa.status = 'active'
    )
  );

-- Service role can manage all prescriptions
CREATE POLICY "Service role manage prescriptions"
  ON prescriptions FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- PFT RECORDS POLICIES
-- Patients can view their own PFT records
CREATE POLICY "Patients view own pft records"
  ON pft_records FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM patients 
      WHERE patients.id = pft_records.patient_id 
      AND patients.auth_user_id = auth.uid()
    )
  );

-- Approved doctors can manage PFT records for their assigned patients
CREATE POLICY "Approved doctors manage assigned patient pft records"
  ON pft_records FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM doctors d
      JOIN doctor_patient_assignments dpa ON d.id = dpa.doctor_id
      WHERE d.auth_user_id = auth.uid() 
      AND d.approval_status = 'approved'
      AND dpa.patient_id = pft_records.patient_id
      AND dpa.status = 'active'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM doctors d
      JOIN doctor_patient_assignments dpa ON d.id = dpa.doctor_id
      WHERE d.auth_user_id = auth.uid() 
      AND d.approval_status = 'approved'
      AND dpa.patient_id = pft_records.patient_id
      AND dpa.status = 'active'
    )
  );

-- Service role can manage all PFT records
CREATE POLICY "Service role manage pft records"
  ON pft_records FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- DOCTOR-PATIENT ASSIGNMENTS POLICIES
-- Approved doctors can view their own assignments
CREATE POLICY "Approved doctors view own assignments"
  ON doctor_patient_assignments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM doctors 
      WHERE doctors.id = doctor_patient_assignments.doctor_id
      AND doctors.auth_user_id = auth.uid() 
      AND doctors.approval_status = 'approved'
    )
  );

-- Approved doctors can create assignments for themselves
CREATE POLICY "Approved doctors create own assignments"
  ON doctor_patient_assignments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM doctors 
      WHERE doctors.id = doctor_patient_assignments.doctor_id
      AND doctors.auth_user_id = auth.uid() 
      AND doctors.approval_status = 'approved'
    )
  );

-- Service role can manage all assignments
CREATE POLICY "Service role manage assignments"
  ON doctor_patient_assignments FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- PATIENT TRANSFER REQUESTS POLICIES
-- Patients can view their own transfer requests
CREATE POLICY "Patients view own transfer requests"
  ON patient_transfer_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM patients 
      WHERE patients.id = patient_transfer_requests.patient_id 
      AND patients.auth_user_id = auth.uid()
    )
  );

-- Approved doctors can view transfer requests for their patients
CREATE POLICY "Approved doctors view patient transfer requests"
  ON patient_transfer_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM doctors d
      WHERE (d.id = patient_transfer_requests.from_doctor_id OR d.id = patient_transfer_requests.to_doctor_id)
      AND d.auth_user_id = auth.uid() 
      AND d.approval_status = 'approved'
    )
  );

-- Service role can manage all transfer requests
CREATE POLICY "Service role manage transfer requests"
  ON patient_transfer_requests FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============================================================
-- 4. DOMAIN HELPER FUNCTIONS
-- ============================================================

-- Get doctor's assigned patients
CREATE OR REPLACE FUNCTION get_doctor_patients(doctor_uuid UUID)
RETURNS TABLE (
  patient_id UUID,
  patient_phone TEXT,
  patient_name TEXT,
  patient_data JSONB,
  assigned_at TIMESTAMPTZ,
  last_log_date DATE,
  alert_count BIGINT
) AS $$
BEGIN
  -- Verify doctor is approved
  IF NOT EXISTS (
    SELECT 1 FROM doctors 
    WHERE id = doctor_uuid 
    AND approval_status = 'approved'
  ) THEN
    RAISE EXCEPTION 'Doctor not found or not approved';
  END IF;

  RETURN QUERY
  SELECT 
    p.id,
    p.phone,
    p.full_name,
    p.patient_data,
    dpa.assigned_at,
    (SELECT MAX(log_date) FROM daily_logs WHERE patient_id = p.id) as last_log_date,
    (SELECT COUNT(*) FROM saanssync_alerts WHERE patient_id = p.id AND acknowledged = false) as alert_count
  FROM patients p
  JOIN doctor_patient_assignments dpa ON p.id = dpa.patient_id
  WHERE dpa.doctor_id = doctor_uuid 
  AND dpa.status = 'active'
  ORDER BY dpa.assigned_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Assign patient to doctor
CREATE OR REPLACE FUNCTION assign_patient_to_doctor(
  doctor_uuid UUID,
  patient_uuid UUID,
  assigned_by_uuid UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Verify doctor is approved
  IF NOT EXISTS (
    SELECT 1 FROM doctors 
    WHERE id = doctor_uuid 
    AND approval_status = 'approved'
  ) THEN
    RAISE EXCEPTION 'Doctor not found or not approved';
  END IF;

  -- Verify patient exists
  IF NOT EXISTS (SELECT 1 FROM patients WHERE id = patient_uuid) THEN
    RAISE EXCEPTION 'Patient not found';
  END IF;

  -- Create assignment (ON CONFLICT DO NOTHING to handle duplicates)
  INSERT INTO doctor_patient_assignments (
    doctor_id, 
    patient_id, 
    assigned_by,
    status
  ) VALUES (
    doctor_uuid, 
    patient_uuid, 
    assigned_by_uuid,
    'active'
  ) ON CONFLICT (doctor_id, patient_id) DO UPDATE SET
    status = 'active',
    assigned_at = NOW();

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create patient transfer request
CREATE OR REPLACE FUNCTION create_patient_transfer_request(
  patient_uuid UUID,
  from_doctor_uuid UUID
)
RETURNS TABLE (
  request_id UUID,
  otp_code TEXT,
  expires_at TIMESTAMPTZ
) AS $$
DECLARE
  generated_otp TEXT;
  expiry_time TIMESTAMPTZ;
  new_request_id UUID;
BEGIN
  -- Generate 6-digit OTP
  generated_otp := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
  
  -- Set expiry to 10 minutes from now
  expiry_time := NOW() + INTERVAL '10 minutes';
  
  -- Create transfer request
  INSERT INTO patient_transfer_requests (
    patient_id,
    from_doctor_id,
    otp_code,
    expires_at,
    status
  ) VALUES (
    patient_uuid,
    from_doctor_uuid,
    generated_otp,
    expiry_time,
    'pending'
  ) RETURNING id INTO new_request_id;
  
  RETURN QUERY SELECT new_request_id, generated_otp, expiry_time;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Complete patient transfer with OTP
CREATE OR REPLACE FUNCTION complete_patient_transfer(
  patient_uuid UUID,
  to_doctor_uuid UUID,
  otp_input TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  transfer_request RECORD;
BEGIN
  -- Find valid transfer request
  SELECT * INTO transfer_request
  FROM patient_transfer_requests
  WHERE patient_id = patient_uuid
  AND otp_code = otp_input
  AND status = 'pending'
  AND expires_at > NOW()
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or expired OTP';
  END IF;
  
  -- Verify target doctor is approved
  IF NOT EXISTS (
    SELECT 1 FROM doctors 
    WHERE id = to_doctor_uuid 
    AND approval_status = 'approved'
  ) THEN
    RAISE EXCEPTION 'Target doctor not found or not approved';
  END IF;
  
  -- Deactivate old assignment
  UPDATE doctor_patient_assignments 
  SET status = 'transferred'
  WHERE doctor_id = transfer_request.from_doctor_id 
  AND patient_id = patient_uuid;
  
  -- Create new assignment
  INSERT INTO doctor_patient_assignments (
    doctor_id,
    patient_id,
    assigned_by,
    status
  ) VALUES (
    to_doctor_uuid,
    patient_uuid,
    transfer_request.from_doctor_id,
    'active'
  ) ON CONFLICT (doctor_id, patient_id) DO UPDATE SET
    status = 'active',
    assigned_at = NOW();
  
  -- Mark transfer request as completed
  UPDATE patient_transfer_requests
  SET status = 'completed', used_at = NOW()
  WHERE id = transfer_request.id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 5. VERIFICATION QUERIES
-- ============================================================

-- Verify domain setup
SELECT 'HEALTHCARE DOMAIN SCHEMA SETUP COMPLETE' as status;

-- Show domain table status
SELECT 
  table_name,
  CASE WHEN table_name IN (
    'daily_logs', 'saanssync_alerts', 'prescriptions', 
    'pft_records', 'doctor_patient_assignments', 'patient_transfer_requests'
  ) 
    THEN '✅ CREATED' 
    ELSE '❌ MISSING' 
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'daily_logs', 'saanssync_alerts', 'prescriptions', 
  'pft_records', 'doctor_patient_assignments', 'patient_transfer_requests'
)
ORDER BY table_name;

-- Show RLS status for domain tables
SELECT 
  schemaname, 
  tablename, 
  CASE WHEN rowsecurity THEN '✅ ENABLED' ELSE '❌ DISABLED' END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
  'daily_logs', 'saanssync_alerts', 'prescriptions', 
  'pft_records', 'doctor_patient_assignments', 'patient_transfer_requests'
)
ORDER BY tablename;