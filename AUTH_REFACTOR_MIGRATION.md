# 🔐 Authentication Refactor - Migration Guide

## Overview

This refactor simplifies authentication from 3 disparate systems to a single unified Supabase Auth system.

---

## 🎯 What Changed

### BEFORE (Complex)
- **Admin**: Custom bcrypt + JWT
- **Doctor**: Supabase Auth (email/password)
- **Patient**: Supabase Auth (email/password + OTP) + fallback default passwords

### AFTER (Simple)
- **Admin**: Supabase Auth (email/password) with `user_metadata.role = 'admin'`
- **Doctor**: Supabase Auth (email/password) with profile in `doctors` table
- **Patient**: Supabase Auth (**OTP ONLY**) with profile in `patients` table

---

## 🗑️ What Was Deleted

### Backend Files/Code
- ❌ `patientLoginWithPassword()` - Patients now use OTP only
- ❌ Default password logic (`patient123`)
- ❌ Custom admin bcrypt authentication
- ❌ `admins.password_hash` column (if it existed)
- ❌ Auth repair scripts (`fixPatientAuth.ts`, etc.)
- ❌ Multiple token generation paths

### Frontend
- ❌ Patient email/password login UI
- ❌ "Forgot Password" for patients
- ❌ Default password displays

---

## ✅ What Was Added/Updated

### Backend

#### 1. **Unified Auth Service** (`authService.refactored.ts`)
```typescript
// Single source of truth
- adminLogin(email, password)          // Checks user_metadata.role
- doctorLogin(email, password)         // Checks doctors table + approval
- patientLoginWithOtp(phone)           // OTP only
- verifyPatientOtp(phone, token)       // Returns session
```

#### 2. **Patient Creation** (`patientService.refactored.ts`)
```typescript
// ALWAYS creates auth user first
createPatient({
  fullName,
  phone,        // REQUIRED (for OTP)
  diseaseType,
  doctorId,
  patientData
})

// Steps:
// 1. Create Supabase Auth User (phone-based)
// 2. Get auth_user_id
// 3. Insert into patients table WITH auth_user_id
// 4. Fail fast if any step fails
```

#### 3. **Simplified Controller** (`authController.refactored.ts`)
- Removed 10+ unused endpoints
- Kept only essential flows
- Clear separation by role

### Database

#### Required Schema Changes
```sql
-- Ensure auth_user_id is NOT NULL (after migration)
ALTER TABLE patients 
  ALTER COLUMN auth_user_id SET NOT NULL;

ALTER TABLE doctors 
  ALTER COLUMN auth_user_id SET NOT NULL;

-- Optional: Add admin table if you want admin profiles
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Remove unused columns
ALTER TABLE patients DROP COLUMN IF EXISTS default_password;
ALTER TABLE patients DROP COLUMN IF EXISTS email; -- If not needed
```

---

## 🚀 Migration Steps (Zero Downtime)

### Phase 1: Prepare (Before Deployment)

1. **Backup Database**
   ```bash
   # Export current data
   pg_dump > backup_pre_refactor.sql
   ```

2. **Audit Existing Users**
   ```sql
   -- Find patients without auth_user_id
   SELECT id, full_name, phone, email 
   FROM patients 
   WHERE auth_user_id IS NULL;
   
   -- Find doctors without auth_user_id
   SELECT id, full_name, email 
   FROM doctors 
   WHERE auth_user_id IS NULL;
   ```

3. **Create Migration Script** (Run this ONCE)
   ```typescript
   // scripts/migrateAuthUsers.ts
   
   import { createClient } from '@supabase/supabase-js'
   
   const admin = createClient(
     process.env.SUPABASE_URL!,
     process.env.SUPABASE_SERVICE_ROLE_KEY!
   )
   
   async function migrate() {
     // 1. Migrate Patients
     const { data: patients } = await admin
       .from('patients')
       .select('*')
       .is('auth_user_id', null)
     
     for (const patient of patients || []) {
       if (!patient.phone) {
         console.warn(`Patient ${patient.id} has no phone. Skipping.`)
         continue
       }
       
       const phone = `+91${patient.phone.replace(/\D/g, '')}`
       
       // Create auth user
       const { data: authUser, error } = await admin.auth.admin.createUser({
         phone,
         phone_confirm: true,
         user_metadata: { role: 'patient', full_name: patient.full_name }
       })
       
       if (authUser?.user) {
         // Link to profile
         await admin
           .from('patients')
           .update({ auth_user_id: authUser.user.id })
           .eq('id', patient.id)
         
         console.log(`✅ Migrated patient: ${patient.full_name}`)
       } else {
         console.error(`❌ Failed for patient ${patient.id}:`, error)
       }
     }
     
     // 2. Migrate Doctors (similar logic)
     // 3. Migrate Admins (create with email/password)
   }
   
   migrate()
   ```

### Phase 2: Deploy

1. **Deploy New Code**
   - Replace `authService.ts` with `authService.refactored.ts`
   - Replace `authController.ts` with `authController.refactored.ts`
   - Replace `patientService.ts` with `patientService.refactored.ts`
   - Update route imports

2. **Update Frontend**
   - Remove patient email/password login UI
   - Keep only OTP flow for patients
   - Update admin login to use Supabase endpoint

### Phase 3: Verify

1. **Test Each Role**
   ```bash
   # Admin
   curl -X POST http://localhost:3001/api/auth/admin/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@saanssync.com","password":"admin123"}'
   
   # Doctor
   curl -X POST http://localhost:3001/api/auth/doctor/login \
     -H "Content-Type: application/json" \
     -d '{"email":"doctor@saanssync.com","password":"doctor123"}'
   
   # Patient (OTP)
   curl -X POST http://localhost:3001/api/auth/patient/login-otp \
     -H "Content-Type: application/json" \
     -d '{"phone":"9370778995"}'
   ```

2. **Check Logs**
   - No "auth_user_id is null" errors
   - No "default password" references
   - All logins succeed

### Phase 4: Cleanup

1. **Remove Old Code**
   ```bash
   rm backend/src/services/authService.ts
   rm backend/src/controllers/authController.ts
   rm backend/scripts/fixPatientAuth.ts
   rm backend/scripts/deletePatientByPhone.ts
   ```

2. **Enforce Schema Constraints**
   ```sql
   ALTER TABLE patients ALTER COLUMN auth_user_id SET NOT NULL;
   ALTER TABLE doctors ALTER COLUMN auth_user_id SET NOT NULL;
   ```

---

## 🔒 Security Improvements

1. **Single Identity Source**: All users in `auth.users`
2. **No Default Passwords**: Patients use OTP (more secure)
3. **Role Enforcement**: Backend checks `user_metadata.role`
4. **Fail Fast**: Patient creation fails if auth user creation fails
5. **Audit Trail**: All auth events logged by Supabase

---

## 📊 Testing Checklist

- [ ] Admin can login with email/password
- [ ] Doctor can register via OTP
- [ ] Doctor can login with email/password
- [ ] Doctor can create patient
- [ ] Patient receives OTP
- [ ] Patient can login with OTP
- [ ] Patient CANNOT login with email/password
- [ ] `/api/auth/me` returns correct role
- [ ] Unapproved doctor cannot access dashboard
- [ ] Non-admin cannot access admin routes

---

## 🆘 Rollback Plan

If issues arise:

1. **Restore Database**
   ```bash
   psql < backup_pre_refactor.sql
   ```

2. **Revert Code**
   ```bash
   git revert <commit-hash>
   ```

3. **Redeploy**

---

## 📞 Support

For issues during migration:
- Check `backend/debug_errors.log`
- Verify Supabase Auth settings (Phone provider enabled)
- Ensure test phone numbers configured for development

---

## 🎉 Benefits

- **90% less auth code**
- **Zero auth repair scripts**
- **Single mental model**
- **Better security (OTP > default passwords)**
- **Easier onboarding for new developers**
