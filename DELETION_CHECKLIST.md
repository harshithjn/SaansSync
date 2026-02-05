# 🗑️ Files & Code to DELETE After Refactor

## Backend Files (Complete Removal)

### Services
- [ ] `backend/src/services/authService.ts` (replace with `.refactored.ts`)
- [ ] `backend/src/services/patientService.ts` (replace with `.refactored.ts`)

### Scripts (All repair/fix scripts)
- [ ] `backend/scripts/fixPatientAuth.ts`
- [ ] `backend/scripts/deletePatientByPhone.ts`
- [ ] `backend/scripts/checkPatient.ts`
- [ ] `backend/scripts/resetPatient.ts`
- [ ] `backend/debug_errors.log` (can delete, will regenerate if needed)

### Controllers
- [ ] `backend/src/controllers/authController.ts` (replace with `.refactored.ts`)

---

## Code Sections to DELETE

### In `authService.ts` (if keeping file temporarily)

Delete these functions:
```typescript
- patientLoginWithPassword()        // Line ~325
- adminLogin() [old version]        // Line ~344 (custom bcrypt logic)
- doctorLoginWithOtp()              // Line ~142 (if not used)
- verifyDoctorOtp()                 // Line ~153 (if not used)
- setupDoctorPassword()             // Line ~220
- startPasswordReset()              // Line ~246
- testEmail()                       // Line ~409
- doctorSignup()                    // Line ~386 (old version without OTP)
```

### In `authController.ts`

Delete these endpoints:
```typescript
- patientLogin()                    // Line ~77 (email/password)
- doctorLoginOtp()                  // Line ~28
- verifyDoctorOtp()                 // Line ~35
- setupDoctorPassword()             // Line ~42
- startPasswordReset()              // Line ~49
- completePasswordReset()           // Line ~56
- doctorSignup()                    // Line ~91 (old version)
- testEmail()                       // Line ~98
- exchangeCallback()                // Line ~105
```

### In `patientService.ts`

Delete these sections:
```typescript
// Line ~106-113: File logging (debug_errors.log)
try {
  const fs = require('fs');
  const path = require('path');
  const logPath = path.join(process.cwd(), 'debug_errors.log');
  fs.appendFileSync(logPath, ...);
} catch (e) { }

// Line ~45: Default password logic
password: payload.password || 'patient123',

// Line ~68-69: Password in comprehensive object
password: payload.password,
```

---

## Database Columns to DROP

```sql
-- After migration is complete and verified

-- Patients table
ALTER TABLE patients DROP COLUMN IF EXISTS default_password;
ALTER TABLE patients DROP COLUMN IF EXISTS email;  -- If not needed

-- Admins table (if exists)
ALTER TABLE admins DROP COLUMN IF EXISTS password_hash;
```

---

## Frontend Files/Components

### Delete Patient Email Login UI
- [ ] `frontend/src/app/login/page.tsx` - Email login tab for patients
- [ ] Any "Forgot Password" components for patients
- [ ] Default password display logic

### Update Login Pages
- [ ] `frontend/src/app/admin/login/page.tsx` - Ensure uses Supabase endpoint
- [ ] `frontend/src/app/doctor/login/page.tsx` - Keep as-is (email/password)
- [ ] `frontend/src/app/patient/login/page.tsx` - **OTP ONLY**

---

## Routes to DELETE

### Backend Routes (`backend/src/routes/auth.ts`)

```typescript
// DELETE these routes:
router.post('/patient/login', authController.patientLogin)
router.post('/doctor/login-otp', authController.doctorLoginOtp)
router.post('/doctor/verify-otp', authController.verifyDoctorOtp)
router.post('/doctor/setup-password', authController.setupDoctorPassword)
router.post('/doctor/reset-password/start', authController.startPasswordReset)
router.post('/doctor/reset-password/complete', authController.completePasswordReset)
router.post('/test-email', authController.testEmail)
router.post('/exchange-callback', authController.exchangeCallback)
```

---

## Environment Variables (Optional Cleanup)

If you had custom admin password:
```env
# DELETE (if using Supabase Auth for admin)
ADMIN_PASSWORD=admin123
```

---

## Constants/Config

### In `authService.ts`

```typescript
// DELETE these constants
const ADMIN_EMAILS = [...]  // If using user_metadata.role instead
const ADMIN_PASSWORD = ...  // No longer needed
```

---

## Verification Checklist

After deletion, verify:

- [ ] No references to `patientLoginWithPassword`
- [ ] No references to `default_password`
- [ ] No references to `patient123`
- [ ] No references to `fixPatientAuth`
- [ ] No bcrypt imports (unless used elsewhere)
- [ ] No custom JWT signing (Supabase handles it)
- [ ] `grep -r "patient123" backend/` returns nothing
- [ ] `grep -r "default_password" backend/` returns nothing
- [ ] `grep -r "fixPatientAuth" .` returns nothing

---

## Rename Refactored Files

Once verified working:

```bash
# Backend
mv backend/src/services/authService.refactored.ts backend/src/services/authService.ts
mv backend/src/services/patientService.refactored.ts backend/src/services/patientService.ts
mv backend/src/controllers/authController.refactored.ts backend/src/controllers/authController.ts

# Update imports in:
# - backend/src/routes/auth.ts
# - backend/src/routes/patient.ts
# - Any other files importing these
```

---

## Final Cleanup

```bash
# Remove all .refactored.ts files
rm backend/src/**/*.refactored.ts

# Remove debug logs
rm backend/debug_errors.log

# Remove old scripts
rm backend/scripts/fix*.ts
rm backend/scripts/delete*.ts
rm backend/scripts/reset*.ts
rm backend/scripts/check*.ts
```

---

## Estimated LOC Reduction

- **Before**: ~1500 lines of auth code
- **After**: ~400 lines of auth code
- **Reduction**: ~73% less code
- **Deleted Files**: 6-8 files
- **Deleted Functions**: 15+ functions
