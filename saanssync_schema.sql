-- ============================================================
-- SAANSSYNC COMPLETE DATABASE SCHEMA
-- Single source of truth for the entire project
-- Includes Authentication, Domain Logic, and RLS Policies
-- ============================================================
-- ============================================================
-- 0. CLEANUP & PERMISSIONS
-- ============================================================
-- Grant necessary permissions to service_role
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT ALL ON SEQUENCES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT ALL ON FUNCTIONS TO service_role;
-- Drop triggers first to remove dependencies
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- Drop existing functions to avoid conflicts during recreation
DROP FUNCTION IF EXISTS get_doctor_by_phone(TEXT);
DROP FUNCTION IF EXISTS complete_patient_transfer(UUID, UUID, TEXT);
DROP FUNCTION IF EXISTS create_patient_transfer_request(UUID, UUID);
DROP FUNCTION IF EXISTS assign_patient_to_doctor(UUID, UUID, UUID);
DROP FUNCTION IF EXISTS get_doctor_patients(UUID);
DROP FUNCTION IF EXISTS get_pending_doctors();
DROP FUNCTION IF EXISTS get_all_doctors();
DROP FUNCTION IF EXISTS reject_doctor(UUID);
DROP FUNCTION IF EXISTS approve_doctor(UUID);
DROP FUNCTION IF EXISTS check_doctor_approved();
DROP FUNCTION IF EXISTS check_doctor_approved(UUID);
DROP FUNCTION IF EXISTS create_user_profile();
DROP FUNCTION IF EXISTS is_admin();
-- Drop tables in dependency order
DROP TABLE IF EXISTS patient_otp_codes CASCADE;
DROP TABLE IF EXISTS patient_transfer_requests CASCADE;
DROP TABLE IF EXISTS doctor_patient_assignments CASCADE;
DROP TABLE IF EXISTS pft_records CASCADE;
DROP TABLE IF EXISTS prescriptions CASCADE;
DROP TABLE IF EXISTS saanssync_alerts CASCADE;
DROP TABLE IF EXISTS daily_logs CASCADE;
DROP TABLE IF EXISTS patients CASCADE;
DROP TABLE IF EXISTS doctors CASCADE;
-- ============================================================
-- 1. CORE TABLES
-- ============================================================
-- Doctors Table
CREATE TABLE doctors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  phone TEXT UNIQUE,
  -- Made UNIQUE as per requirements
  alt_phone TEXT,
  approval_status TEXT NOT NULL DEFAULT 'pending' CHECK (
    approval_status IN ('pending', 'approved', 'rejected')
  ),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Patients Table
CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  phone TEXT UNIQUE NOT NULL,
  alt_phone TEXT,
  email TEXT,
  full_name TEXT,
  patient_data JSONB NOT NULL DEFAULT '{}',
  -- Domain specific fields
  doctor_id UUID REFERENCES doctors(id) ON DELETE
  SET NULL,
    default_password TEXT DEFAULT 'patient123',
    disease_type TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- ============================================================
-- 2. DOMAIN TABLES
-- ============================================================
-- Daily Logs
CREATE TABLE daily_logs (
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
-- Alerts
CREATE TABLE saanssync_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES doctors(id) ON DELETE
  SET NULL,
    level TEXT NOT NULL CHECK (level IN ('RED', 'YELLOW', 'GREEN')),
    reason_text TEXT NOT NULL,
    disease_type TEXT NOT NULL,
    alert_data JSONB DEFAULT '{}',
    acknowledged BOOLEAN DEFAULT FALSE,
    acknowledged_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Prescriptions
CREATE TABLE prescriptions (
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
-- PFT Records
CREATE TABLE pft_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES doctors(id) ON DELETE
  SET NULL,
    test_date DATE NOT NULL,
    fev1 DECIMAL(5, 2),
    fvc DECIMAL(5, 2),
    fev1_fvc_ratio DECIMAL(5, 2),
    pef DECIMAL(5, 2),
    test_data JSONB DEFAULT '{}',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Doctor-Patient Assignments
CREATE TABLE doctor_patient_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_by UUID REFERENCES doctors(id),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'transferred')),
  notes TEXT,
  UNIQUE (doctor_id, patient_id)
);
-- Patient Transfer Requests
CREATE TABLE patient_transfer_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  from_doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  to_doctor_id UUID REFERENCES doctors(id) ON DELETE
  SET NULL,
    otp_code TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    status TEXT DEFAULT 'pending' CHECK (
      status IN ('pending', 'completed', 'expired', 'cancelled')
    ),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Patient OTP Codes
CREATE TABLE patient_otp_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
-- ============================================================
-- 3. INDEXES
-- ============================================================
CREATE INDEX idx_doctors_approval_status ON doctors(approval_status);
CREATE INDEX idx_doctors_email ON doctors(email);
CREATE INDEX idx_doctors_auth_user_id ON doctors(auth_user_id);
CREATE INDEX idx_doctors_phone ON doctors(phone);
CREATE INDEX idx_patients_auth_user_id ON patients(auth_user_id);
CREATE INDEX idx_patients_phone ON patients(phone);
CREATE INDEX idx_patients_doctor_id ON patients(doctor_id);
CREATE INDEX idx_patients_email ON patients(email);
CREATE INDEX idx_patients_disease_type ON patients(disease_type);
CREATE INDEX idx_daily_logs_patient_date ON daily_logs(patient_id, log_date DESC);
CREATE INDEX idx_alerts_patient_created ON saanssync_alerts(patient_id, created_at DESC);
CREATE INDEX idx_alerts_doctor_created ON saanssync_alerts(doctor_id, created_at DESC);
CREATE INDEX idx_prescriptions_patient ON prescriptions(patient_id, created_at DESC);
CREATE INDEX idx_prescriptions_doctor ON prescriptions(doctor_id, created_at DESC);
CREATE INDEX idx_pft_records_patient ON pft_records(patient_id, test_date DESC);
CREATE INDEX idx_doctor_patient_assignments ON doctor_patient_assignments(doctor_id, status);
CREATE INDEX idx_patient_otp_codes_phone ON patient_otp_codes(phone, expires_at);
-- ============================================================
-- 4. FUNCTIONS & TRIGGERS
-- ============================================================
-- Function to create user profiles based on role
CREATE OR REPLACE FUNCTION create_user_profile() RETURNS TRIGGER AS $$ BEGIN
DECLARE user_role TEXT := NEW.raw_user_meta_data->>'role';
user_phone TEXT := COALESCE(NEW.phone, NEW.raw_user_meta_data->>'phone', '');
user_full_name TEXT := COALESCE(NEW.raw_user_meta_data->>'full_name', '');
user_email TEXT := NEW.email;
BEGIN -- Normalize phone number (remove +91 or other prefixes if consistent storage is needed)
-- Assuming storage is consistent with auth.users.phone
-- PATIENT HANDLING
IF user_role = 'patient'
OR (
  user_role IS NULL
  AND user_phone IS NOT NULL
  AND user_phone != ''
) THEN -- Try to link to existing patient profile created by doctor
UPDATE patients
SET auth_user_id = NEW.id,
  updated_at = NOW()
WHERE phone = user_phone
  AND auth_user_id IS NULL;
-- If no existing profile found, create a new one
IF NOT FOUND THEN
INSERT INTO patients (
    auth_user_id,
    phone,
    full_name,
    patient_data
  )
VALUES (
    NEW.id,
    user_phone,
    user_full_name,
    '{}'::jsonb
  );
RAISE LOG 'Created new patient profile for user: %',
NEW.id;
ELSE RAISE LOG 'Linked existing patient profile to user: %',
NEW.id;
END IF;
-- DOCTOR HANDLING
ELSIF user_role = 'doctor'
AND user_email IS NOT NULL THEN -- Link to existing doctor profile (must be created/approved by admin first usually)
UPDATE doctors
SET auth_user_id = NEW.id,
  updated_at = NOW()
WHERE email = user_email
  AND auth_user_id IS NULL;
IF FOUND THEN RAISE LOG 'Linked doctor profile to auth user: %',
NEW.id;
ELSE -- Optional: Create pending doctor profile if self-registration is allowed
-- For now, we only link if profile exists (admin approval flow)
RAISE LOG 'No matching doctor profile found for email: %',
user_email;
END IF;
END IF;
RETURN NEW;
EXCEPTION
WHEN OTHERS THEN RAISE WARNING 'Failed to create user profile for %: %',
NEW.id,
SQLERRM;
RETURN NEW;
END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Trigger on auth.users insert
CREATE TRIGGER on_auth_user_created
AFTER
INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION create_user_profile();
-- Check if doctor is approved
CREATE OR REPLACE FUNCTION check_doctor_approved() RETURNS BOOLEAN AS $$ BEGIN RETURN EXISTS (
    SELECT 1
    FROM doctors
    WHERE auth_user_id = auth.uid()
      AND approval_status = 'approved'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Approve doctor (Service Role)
CREATE OR REPLACE FUNCTION approve_doctor(doctor_uuid UUID) RETURNS BOOLEAN AS $$
DECLARE doctor_email TEXT;
doctor_name TEXT;
auth_user_id UUID;
BEGIN IF auth.role() != 'service_role' THEN RAISE EXCEPTION 'Access denied. Service role required.';
END IF;
SELECT email,
  full_name INTO doctor_email,
  doctor_name
FROM doctors
WHERE id = doctor_uuid
  AND approval_status = 'pending';
IF NOT FOUND THEN RAISE EXCEPTION 'Doctor not found or already processed.';
END IF;
UPDATE doctors
SET approval_status = 'approved',
  updated_at = NOW()
WHERE id = doctor_uuid;
RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Reject doctor (Service Role)
CREATE OR REPLACE FUNCTION reject_doctor(doctor_uuid UUID) RETURNS BOOLEAN AS $$ BEGIN IF auth.role() != 'service_role' THEN RAISE EXCEPTION 'Access denied. Service role required.';
END IF;
UPDATE doctors
SET approval_status = 'rejected',
  updated_at = NOW()
WHERE id = doctor_uuid;
RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Get all doctors (Service Role)
CREATE OR REPLACE FUNCTION get_all_doctors() RETURNS TABLE (
    id UUID,
    auth_user_id UUID,
    email TEXT,
    full_name TEXT,
    phone TEXT,
    approval_status TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
  ) AS $$ BEGIN IF auth.role() != 'service_role' THEN RAISE EXCEPTION 'Access denied. Service role required.';
END IF;
RETURN QUERY
SELECT d.id,
  d.auth_user_id,
  d.email,
  d.full_name,
  d.phone,
  d.approval_status,
  d.created_at,
  d.updated_at
FROM doctors d
ORDER BY d.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Get pending doctors (Service Role)
CREATE OR REPLACE FUNCTION get_pending_doctors() RETURNS TABLE (
    id UUID,
    auth_user_id UUID,
    email TEXT,
    full_name TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ
  ) AS $$ BEGIN IF auth.role() != 'service_role' THEN RAISE EXCEPTION 'Access denied. Service role required.';
END IF;
RETURN QUERY
SELECT d.id,
  d.auth_user_id,
  d.email,
  d.full_name,
  d.phone,
  d.created_at
FROM doctors d
WHERE d.approval_status = 'pending'
ORDER BY d.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Get doctor by phone
CREATE OR REPLACE FUNCTION get_doctor_by_phone(phone_number TEXT) RETURNS TABLE (
    id UUID,
    email TEXT,
    full_name TEXT,
    approval_status TEXT
  ) AS $$ BEGIN RETURN QUERY
SELECT d.id,
  d.email,
  d.full_name,
  d.approval_status
FROM doctors d
WHERE d.phone = phone_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Get doctor's assigned patients
CREATE OR REPLACE FUNCTION get_doctor_patients(doctor_uuid UUID) RETURNS TABLE (
    patient_id UUID,
    patient_phone TEXT,
    patient_name TEXT,
    patient_data JSONB,
    assigned_at TIMESTAMPTZ,
    last_log_date DATE,
    alert_count BIGINT
  ) AS $$ BEGIN -- Verify doctor is approved
  IF NOT EXISTS (
    SELECT 1
    FROM doctors
    WHERE id = doctor_uuid
      AND approval_status = 'approved'
  ) THEN RAISE EXCEPTION 'Doctor not found or not approved';
END IF;
RETURN QUERY
SELECT p.id,
  p.phone,
  p.full_name,
  p.patient_data,
  dpa.assigned_at,
  (
    SELECT MAX(log_date)
    FROM daily_logs
    WHERE patient_id = p.id
  ) as last_log_date,
  (
    SELECT COUNT(*)
    FROM saanssync_alerts
    WHERE patient_id = p.id
      AND acknowledged = false
  ) as alert_count
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
  ) RETURNS BOOLEAN AS $$ BEGIN -- Verify doctor is approved
  IF NOT EXISTS (
    SELECT 1
    FROM doctors
    WHERE id = doctor_uuid
      AND approval_status = 'approved'
  ) THEN RAISE EXCEPTION 'Doctor not found or not approved';
END IF;
-- Verify patient exists
IF NOT EXISTS (
  SELECT 1
  FROM patients
  WHERE id = patient_uuid
) THEN RAISE EXCEPTION 'Patient not found';
END IF;
-- Create assignment
INSERT INTO doctor_patient_assignments (
    doctor_id,
    patient_id,
    assigned_by,
    status
  )
VALUES (
    doctor_uuid,
    patient_uuid,
    assigned_by_uuid,
    'active'
  ) ON CONFLICT (doctor_id, patient_id) DO
UPDATE
SET status = 'active',
  assigned_at = NOW();
RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Create patient transfer request
CREATE OR REPLACE FUNCTION create_patient_transfer_request(patient_uuid UUID, from_doctor_uuid UUID) RETURNS TABLE (
    request_id UUID,
    otp_code TEXT,
    expires_at TIMESTAMPTZ
  ) AS $$
DECLARE generated_otp TEXT;
expiry_time TIMESTAMPTZ;
new_request_id UUID;
BEGIN generated_otp := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
expiry_time := NOW() + INTERVAL '10 minutes';
INSERT INTO patient_transfer_requests (
    patient_id,
    from_doctor_id,
    otp_code,
    expires_at,
    status
  )
VALUES (
    patient_uuid,
    from_doctor_uuid,
    generated_otp,
    expiry_time,
    'pending'
  )
RETURNING id INTO new_request_id;
RETURN QUERY
SELECT new_request_id,
  generated_otp,
  expiry_time;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Complete patient transfer
CREATE OR REPLACE FUNCTION complete_patient_transfer(
    patient_uuid UUID,
    to_doctor_uuid UUID,
    otp_input TEXT
  ) RETURNS BOOLEAN AS $$
DECLARE transfer_request RECORD;
BEGIN
SELECT * INTO transfer_request
FROM patient_transfer_requests
WHERE patient_id = patient_uuid
  AND otp_code = otp_input
  AND status = 'pending'
  AND expires_at > NOW();
IF NOT FOUND THEN RETURN FALSE;
END IF;
-- Update request status
UPDATE patient_transfer_requests
SET status = 'completed',
  used_at = NOW(),
  to_doctor_id = to_doctor_uuid
WHERE id = transfer_request.id;
-- Update assignments
UPDATE doctor_patient_assignments
SET status = 'transferred'
WHERE patient_id = patient_uuid
  AND doctor_id = transfer_request.from_doctor_id;
INSERT INTO doctor_patient_assignments (doctor_id, patient_id, status)
VALUES (
    to_doctor_uuid,
    patient_uuid,
    'active'
  );
RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- ============================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================
-- Enable RLS on all tables
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE saanssync_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pft_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_patient_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_transfer_requests ENABLE ROW LEVEL SECURITY;
-- DOCTORS POLICIES
CREATE POLICY "Doctors read own" ON doctors FOR
SELECT USING (auth.uid() = auth_user_id);
CREATE POLICY "Doctors update own" ON doctors FOR
UPDATE USING (auth.uid() = auth_user_id) WITH CHECK (auth.uid() = auth_user_id);
CREATE POLICY "Service role manage doctors" ON doctors FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Service role insert doctors" ON doctors FOR
INSERT WITH CHECK (auth.role() = 'service_role');
-- PATIENTS POLICIES
CREATE POLICY "Patients read own" ON patients FOR
SELECT USING (auth.uid() = auth_user_id);
CREATE POLICY "Patients insert own" ON patients FOR
INSERT WITH CHECK (auth.uid() = auth_user_id);
CREATE POLICY "Patients update own" ON patients FOR
UPDATE USING (auth.uid() = auth_user_id) WITH CHECK (auth.uid() = auth_user_id);
CREATE POLICY "Approved doctors read patients" ON patients FOR
SELECT USING (
    EXISTS (
      SELECT 1
      FROM doctors
      WHERE doctors.auth_user_id = auth.uid()
        AND doctors.approval_status = 'approved'
    )
  );
CREATE POLICY "Approved doctors view assigned patients" ON patients FOR
SELECT USING (
    EXISTS (
      SELECT 1
      FROM doctors d
        JOIN doctor_patient_assignments dpa ON d.id = dpa.doctor_id
      WHERE d.auth_user_id = auth.uid()
        AND d.approval_status = 'approved'
        AND dpa.patient_id = patients.id
        AND dpa.status = 'active'
    )
  );
CREATE POLICY "Service role manage patients" ON patients FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
-- DAILY LOGS POLICIES
CREATE POLICY "Patients manage own logs" ON daily_logs FOR ALL USING (
  EXISTS (
    SELECT 1
    FROM patients
    WHERE patients.id = daily_logs.patient_id
      AND patients.auth_user_id = auth.uid()
  )
) WITH CHECK (
  EXISTS (
    SELECT 1
    FROM patients
    WHERE patients.id = daily_logs.patient_id
      AND patients.auth_user_id = auth.uid()
  )
);
CREATE POLICY "Approved doctors read logs" ON daily_logs FOR
SELECT USING (check_doctor_approved());
CREATE POLICY "Approved doctors read assigned patient logs" ON daily_logs FOR
SELECT USING (
    EXISTS (
      SELECT 1
      FROM doctors d
        JOIN doctor_patient_assignments dpa ON d.id = dpa.doctor_id
      WHERE d.auth_user_id = auth.uid()
        AND d.approval_status = 'approved'
        AND dpa.patient_id = daily_logs.patient_id
        AND dpa.status = 'active'
    )
  );
CREATE POLICY "Service role manage logs" ON daily_logs FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
-- ALERTS POLICIES
CREATE POLICY "Patients view own alerts" ON saanssync_alerts FOR
SELECT USING (
    EXISTS (
      SELECT 1
      FROM patients
      WHERE patients.id = saanssync_alerts.patient_id
        AND patients.auth_user_id = auth.uid()
    )
  );
CREATE POLICY "Approved doctors manage alerts" ON saanssync_alerts FOR ALL USING (check_doctor_approved()) WITH CHECK (check_doctor_approved());
CREATE POLICY "Approved doctors manage assigned patient alerts" ON saanssync_alerts FOR ALL USING (
  EXISTS (
    SELECT 1
    FROM doctors d
      JOIN doctor_patient_assignments dpa ON d.id = dpa.doctor_id
    WHERE d.auth_user_id = auth.uid()
      AND d.approval_status = 'approved'
      AND dpa.patient_id = saanssync_alerts.patient_id
      AND dpa.status = 'active'
  )
) WITH CHECK (
  EXISTS (
    SELECT 1
    FROM doctors d
      JOIN doctor_patient_assignments dpa ON d.id = dpa.doctor_id
    WHERE d.auth_user_id = auth.uid()
      AND d.approval_status = 'approved'
      AND dpa.patient_id = saanssync_alerts.patient_id
      AND dpa.status = 'active'
  )
);
CREATE POLICY "Service role manage alerts" ON saanssync_alerts FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
-- PRESCRIPTIONS POLICIES
CREATE POLICY "Patients view own prescriptions" ON prescriptions FOR
SELECT USING (
    EXISTS (
      SELECT 1
      FROM patients
      WHERE patients.id = prescriptions.patient_id
        AND patients.auth_user_id = auth.uid()
    )
  );
CREATE POLICY "Approved doctors manage own prescriptions" ON prescriptions FOR ALL USING (
  doctor_id = auth.uid()
  AND check_doctor_approved()
) WITH CHECK (
  doctor_id = auth.uid()
  AND check_doctor_approved()
);
CREATE POLICY "Approved doctors manage assigned patient prescriptions" ON prescriptions FOR ALL USING (
  EXISTS (
    SELECT 1
    FROM doctors d
      JOIN doctor_patient_assignments dpa ON d.id = dpa.doctor_id
    WHERE d.auth_user_id = auth.uid()
      AND d.approval_status = 'approved'
      AND dpa.patient_id = prescriptions.patient_id
      AND dpa.status = 'active'
  )
) WITH CHECK (
  EXISTS (
    SELECT 1
    FROM doctors d
      JOIN doctor_patient_assignments dpa ON d.id = dpa.doctor_id
    WHERE d.auth_user_id = auth.uid()
      AND d.approval_status = 'approved'
      AND dpa.patient_id = prescriptions.patient_id
      AND dpa.status = 'active'
  )
);
CREATE POLICY "Service role manage prescriptions" ON prescriptions FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
-- PFT RECORDS POLICIES
CREATE POLICY "Patients view own pft records" ON pft_records FOR
SELECT USING (
    EXISTS (
      SELECT 1
      FROM patients
      WHERE patients.id = pft_records.patient_id
        AND patients.auth_user_id = auth.uid()
    )
  );
CREATE POLICY "Approved doctors manage assigned patient pft records" ON pft_records FOR ALL USING (
  EXISTS (
    SELECT 1
    FROM doctors d
      JOIN doctor_patient_assignments dpa ON d.id = dpa.doctor_id
    WHERE d.auth_user_id = auth.uid()
      AND d.approval_status = 'approved'
      AND dpa.patient_id = pft_records.patient_id
      AND dpa.status = 'active'
  )
) WITH CHECK (
  EXISTS (
    SELECT 1
    FROM doctors d
      JOIN doctor_patient_assignments dpa ON d.id = dpa.doctor_id
    WHERE d.auth_user_id = auth.uid()
      AND d.approval_status = 'approved'
      AND dpa.patient_id = pft_records.patient_id
      AND dpa.status = 'active'
  )
);
CREATE POLICY "Service role manage pft records" ON pft_records FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
-- DOCTOR-PATIENT ASSIGNMENTS POLICIES
CREATE POLICY "Approved doctors view own assignments" ON doctor_patient_assignments FOR
SELECT USING (
    EXISTS (
      SELECT 1
      FROM doctors
      WHERE doctors.id = doctor_patient_assignments.doctor_id
        AND doctors.auth_user_id = auth.uid()
        AND doctors.approval_status = 'approved'
    )
  );
CREATE POLICY "Approved doctors create own assignments" ON doctor_patient_assignments FOR
INSERT WITH CHECK (
    EXISTS (
      SELECT 1
      FROM doctors
      WHERE doctors.id = doctor_patient_assignments.doctor_id
        AND doctors.auth_user_id = auth.uid()
        AND doctors.approval_status = 'approved'
    )
  );
CREATE POLICY "Service role manage assignments" ON doctor_patient_assignments FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
-- PATIENT TRANSFER REQUESTS POLICIES
CREATE POLICY "Patients view own transfer requests" ON patient_transfer_requests FOR
SELECT USING (
    EXISTS (
      SELECT 1
      FROM patients
      WHERE patients.id = patient_transfer_requests.patient_id
        AND patients.auth_user_id = auth.uid()
    )
  );
CREATE POLICY "Approved doctors view patient transfer requests" ON patient_transfer_requests FOR
SELECT USING (
    EXISTS (
      SELECT 1
      FROM doctors d
      WHERE (
          d.id = patient_transfer_requests.from_doctor_id
          OR d.id = patient_transfer_requests.to_doctor_id
        )
        AND d.auth_user_id = auth.uid()
        AND d.approval_status = 'approved'
    )
  );
CREATE POLICY "Service role manage transfer requests" ON patient_transfer_requests FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
-- ============================================================
-- 6. VERIFICATION
-- ============================================================
SELECT 'SAANSSYNC COMPLETE SCHEMA SETUP FINISHED' as status;