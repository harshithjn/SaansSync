-- SaansSync — Supabase schema (Phase 1: persistence + auth)
-- Run in Supabase: Dashboard → SQL Editor → New query → paste and run

-- ============================================================
-- 1. Doctors (Supabase Auth: id = auth.uid())
-- ============================================================
CREATE TABLE IF NOT EXISTS doctors (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Doctors read own"
  ON doctors FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Doctors insert own"
  ON doctors FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Doctors update own"
  ON doctors FOR UPDATE USING (auth.uid() = id);

-- ============================================================
-- 2. Patients (auth_uid = patient's Supabase user id; doctor_id = assigning doctor)
-- ============================================================
CREATE TABLE IF NOT EXISTS patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_uid UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  patient_data JSONB NOT NULL DEFAULT '{}',
  default_password TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_patients_doctor_id ON patients(doctor_id);
CREATE INDEX IF NOT EXISTS idx_patients_auth_uid ON patients(auth_uid);
CREATE INDEX IF NOT EXISTS idx_patients_email ON patients(email);

ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

-- Doctor sees own patients; patient sees own row
CREATE POLICY "Patients select doctor"
  ON patients FOR SELECT USING (doctor_id = auth.uid());
CREATE POLICY "Patients select patient"
  ON patients FOR SELECT USING (auth_uid = auth.uid());
CREATE POLICY "Patients insert doctor"
  ON patients FOR INSERT WITH CHECK (doctor_id = auth.uid());
CREATE POLICY "Patients update doctor"
  ON patients FOR UPDATE USING (doctor_id = auth.uid());
CREATE POLICY "Patients update patient"
  ON patients FOR UPDATE USING (auth_uid = auth.uid());

-- ============================================================
-- 3. Doctor–patient mapping & patient folders
-- ============================================================
CREATE TABLE IF NOT EXISTS doctor_patient_mapping (
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  disease_type TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (doctor_id, patient_id)
);

CREATE TABLE IF NOT EXISTS patient_folders (
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  age INT NOT NULL DEFAULT 0,
  disease_type TEXT NOT NULL,
  last_log_date TIMESTAMPTZ DEFAULT NOW(),
  folder_color TEXT NOT NULL DEFAULT 'green' CHECK (folder_color IN ('green', 'yellow', 'red')),
  red_flag_score INT NOT NULL DEFAULT 0,
  alert_count INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (patient_id, doctor_id)
);

CREATE INDEX IF NOT EXISTS idx_patient_folders_doctor_id ON patient_folders(doctor_id);

ALTER TABLE doctor_patient_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Mapping doctor"
  ON doctor_patient_mapping FOR ALL USING (doctor_id = auth.uid()) WITH CHECK (doctor_id = auth.uid());
CREATE POLICY "Folders doctor"
  ON patient_folders FOR ALL USING (doctor_id = auth.uid()) WITH CHECK (doctor_id = auth.uid());

-- ============================================================
-- 4. Daily logs
-- ============================================================
CREATE TABLE IF NOT EXISTS daily_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,
  spo2_at_rest INT,
  spo2_on_exertion INT,
  mmrc_scale INT,
  disease_type TEXT,
  disease_data JSONB DEFAULT '{}',
  symptoms JSONB DEFAULT '[]',
  medications JSONB DEFAULT '[]',
  side_effects JSONB DEFAULT '[]',
  aqi_data JSONB,
  red_flag_score INT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (patient_id, log_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_logs_patient_date ON daily_logs(patient_id, log_date DESC);

ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;

-- Doctor: via patients they own; patient: own logs
CREATE POLICY "Daily logs select"
  ON daily_logs FOR SELECT USING (
    EXISTS (SELECT 1 FROM patients p WHERE p.id = daily_logs.patient_id AND (p.doctor_id = auth.uid() OR p.auth_uid = auth.uid()))
  );
CREATE POLICY "Daily logs insert"
  ON daily_logs FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM patients p WHERE p.id = daily_logs.patient_id AND (p.doctor_id = auth.uid() OR p.auth_uid = auth.uid()))
  );

-- ============================================================
-- 5. Patient baselines
-- ============================================================
CREATE TABLE IF NOT EXISTS patient_baselines (
  patient_id UUID PRIMARY KEY REFERENCES patients(id) ON DELETE CASCADE,
  baseline_data JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE patient_baselines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Baselines doctor"
  ON patient_baselines FOR ALL USING (
    EXISTS (SELECT 1 FROM patients p WHERE p.id = patient_baselines.patient_id AND p.doctor_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM patients p WHERE p.id = patient_baselines.patient_id AND p.doctor_id = auth.uid())
  );
CREATE POLICY "Baselines patient"
  ON patient_baselines FOR ALL USING (
    EXISTS (SELECT 1 FROM patients p WHERE p.id = patient_baselines.patient_id AND p.auth_uid = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM patients p WHERE p.id = patient_baselines.patient_id AND p.auth_uid = auth.uid())
  );

-- ============================================================
-- 6. SaansSync Alerts (RED / YELLOW / GREEN)
-- ============================================================
CREATE TABLE IF NOT EXISTS saanssync_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id TEXT NOT NULL,
  doctor_id TEXT NOT NULL,
  patient_name TEXT,
  level TEXT NOT NULL CHECK (level IN ('RED', 'YELLOW', 'GREEN')),
  reason_text TEXT NOT NULL,
  triggers JSONB DEFAULT '[]',
  disease_type TEXT NOT NULL,
  acknowledged BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_saanssync_alerts_doctor_id ON saanssync_alerts(doctor_id);
CREATE INDEX IF NOT EXISTS idx_saanssync_alerts_patient_id ON saanssync_alerts(patient_id);
CREATE INDEX IF NOT EXISTS idx_saanssync_alerts_created_at ON saanssync_alerts(created_at DESC);

ALTER TABLE saanssync_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon saanssync_alerts" ON saanssync_alerts;
-- Backend/anon can write; authenticated doctor can manage own alerts
CREATE POLICY "SaansSync alerts all"
  ON saanssync_alerts FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- 7. Prescriptions
-- ============================================================
CREATE TABLE IF NOT EXISTS prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id TEXT NOT NULL,
  doctor_id TEXT NOT NULL,
  patient_name TEXT,
  doctor_name TEXT,
  prescription_date DATE NOT NULL DEFAULT CURRENT_DATE,
  medications JSONB NOT NULL DEFAULT '[]',
  personalized_alerts JSONB DEFAULT '[]',
  diagnosis TEXT,
  instructions TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prescriptions_doctor_id ON prescriptions(doctor_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient_id ON prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_date ON prescriptions(prescription_date DESC);

ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon prescriptions" ON prescriptions;
CREATE POLICY "Prescriptions all"
  ON prescriptions FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- 8. Personalized alerts
-- ============================================================
CREATE TABLE IF NOT EXISTS personalized_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id TEXT NOT NULL,
  doctor_id TEXT,
  type TEXT NOT NULL CHECK (type IN ('pulmonary-rehabilitation', 'chest-physiotherapy', 'suctioning', 'custom', 'medication')),
  name TEXT NOT NULL,
  frequency TEXT,
  interval TEXT,
  instructions TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_personalized_alerts_patient_id ON personalized_alerts(patient_id);

ALTER TABLE personalized_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon personalized_alerts" ON personalized_alerts;
CREATE POLICY "Personalized alerts all"
  ON personalized_alerts FOR ALL USING (true) WITH CHECK (true);
