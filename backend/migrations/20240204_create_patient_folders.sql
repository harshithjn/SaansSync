
-- Create patient_folders table for Doctor Dashboard optimization
-- This table acts as a materialized view of the patient's current status

CREATE TABLE IF NOT EXISTS patient_folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    age INTEGER DEFAULT 0,
    disease_type TEXT,
    last_log_date DATE,
    folder_color TEXT DEFAULT 'green', -- 'red', 'yellow', 'green', 'orange'
    red_flag_score DECIMAL(4, 1) DEFAULT 0,
    alert_count INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(doctor_id, patient_id)
);

-- Enable RLS
ALTER TABLE patient_folders ENABLE ROW LEVEL SECURITY;

-- Policies
-- Doctors can view/manage their own folders
CREATE POLICY "Doctors manage own folders" ON patient_folders
    USING (
        EXISTS (
            SELECT 1 FROM doctors 
            WHERE doctors.id = patient_folders.doctor_id 
            AND doctors.auth_user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM doctors 
            WHERE doctors.id = patient_folders.doctor_id 
            AND doctors.auth_user_id = auth.uid()
        )
    );

-- Service role full access
CREATE POLICY "Service role manage folders" ON patient_folders
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Index for fast lookup by doctor
CREATE INDEX idx_patient_folders_doctor ON patient_folders(doctor_id);
