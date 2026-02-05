# 🔐 Authentication System

## Overview

Single unified authentication system using **Supabase Auth** for all user types.

---

## 🎭 Roles

| Role | Login Method | Registration | Approval Required |
|------|-------------|--------------|-------------------|
| **Admin** | Email/Password | Manual (Supabase Dashboard) | No |
| **Doctor** | Email/Password | Mobile OTP → Set Password | Yes (by Admin) |
| **Patient** | **Mobile OTP ONLY** | Created by Doctor | No |

---

## 🔑 Login Flows

### Admin
```
1. Enter email + password
2. Backend verifies via Supabase Auth
3. Checks user_metadata.role === 'admin'
4. Returns session token
```

### Doctor
```
1. Enter email + password
2. Backend verifies via Supabase Auth
3. Fetches doctor profile (auth_user_id link)
4. Checks approval_status === 'approved'
5. Returns session token + profile
```

### Patient
```
1. Enter phone number
2. Backend sends OTP via Supabase
3. Enter OTP code
4. Backend verifies OTP
5. Fetches patient profile (auth_user_id link)
6. Returns session token + profile
```

---

## 👨‍⚕️ Doctor Creates Patient

```typescript
// Frontend sends
POST /api/patient
{
  fullName: "John Doe",
  phone: "9876543210",
  diseaseType: "Asthma",
  doctorId: "uuid",
  patientData: { age: 45, sex: "Male", ... }
}

// Backend does
1. Create Supabase Auth User:
   admin.auth.admin.createUser({
     phone: "+919876543210",
     phone_confirm: true,
     user_metadata: { role: 'patient', full_name: 'John Doe' }
   })

2. Get auth_user_id

3. Insert into patients table:
   {
     auth_user_id: "uuid",
     full_name: "John Doe",
     phone: "9876543210",
     doctor_id: "uuid",
     patient_data: { ... }
   }

4. Return success
```

**Patient can now login immediately using Mobile OTP.**

---

## 🛡️ Security

### Token Flow
```
Frontend → Next.js BFF Proxy → Backend
          ↓
    Reads cookie: saanssync_access
          ↓
    Adds header: Authorization: Bearer <token>
          ↓
    Backend calls: supabase.auth.getUser(token)
          ↓
    Attaches req.user = { id, email, role }
```

### Role Guards
```typescript
// Middleware checks
requireAdmin()   // user_metadata.role === 'admin'
requireDoctor()  // doctors table + approved
requirePatient() // patients table
```

---

## 📁 Database Schema

### `auth.users` (Supabase Managed)
```sql
id UUID PRIMARY KEY
email TEXT
phone TEXT
user_metadata JSONB  -- { role: 'admin' | 'doctor' | 'patient', full_name: '...' }
```

### `public.doctors`
```sql
id UUID PRIMARY KEY
auth_user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id)
email TEXT UNIQUE NOT NULL
full_name TEXT NOT NULL
phone TEXT
approval_status TEXT DEFAULT 'pending'  -- pending | approved | rejected
```

### `public.patients`
```sql
id UUID PRIMARY KEY
auth_user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id)
full_name TEXT NOT NULL
phone TEXT UNIQUE NOT NULL
disease_type TEXT
doctor_id UUID REFERENCES doctors(id)
patient_data JSONB
```

---

## 🚫 What's NOT Supported

- ❌ Patient email/password login
- ❌ Default passwords
- ❌ Password reset for patients (use OTP)
- ❌ Custom admin authentication (uses Supabase)

---

## 🧪 Testing

### Local Development

1. **Configure Test Phone Numbers** (Supabase Dashboard)
   ```
   Phone: +919370778995
   OTP: 123456
   ```

2. **Seed Admin User**
   ```sql
   -- In Supabase SQL Editor
   -- Admin user is created on first login via Supabase Auth
   -- Just ensure email is in ADMIN_EMAILS list in code
   ```

3. **Test Flows**
   ```bash
   # Admin
   POST /api/auth/admin/login
   { "email": "admin@saanssync.com", "password": "admin123" }

   # Doctor Registration
   POST /api/auth/doctor/register/start
   { "phone": "9370778995" }
   
   POST /api/auth/doctor/register/complete
   { 
     "phone": "9370778995", 
     "token": "123456",
     "email": "doctor@example.com",
     "fullName": "Dr. Smith",
     "password": "securepass123"
   }

   # Patient Login
   POST /api/auth/patient/login-otp
   { "phone": "9876543210" }
   
   POST /api/auth/patient/verify-otp
   { "phone": "9876543210", "token": "123456" }
   ```

---

## 🔧 Environment Variables

```env
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

---

## 📞 Troubleshooting

### "Patient profile not found"
- **Cause**: `auth_user_id` is NULL in patients table
- **Fix**: Patient must be created via doctor dashboard (which creates auth user)

### "Account is pending"
- **Cause**: Doctor not approved yet
- **Fix**: Admin must approve in admin dashboard

### "Invalid OTP"
- **Cause**: Test phone not configured OR real SMS not sent
- **Fix**: Add test phone in Supabase Dashboard → Authentication → Phone Auth

---

## 📚 API Reference

| Endpoint | Method | Body | Response |
|----------|--------|------|----------|
| `/api/auth/admin/login` | POST | `{ email, password }` | `{ access_token, user }` |
| `/api/auth/doctor/login` | POST | `{ email, password }` | `{ access_token, doctorProfile }` |
| `/api/auth/doctor/register/start` | POST | `{ phone }` | `{ success }` |
| `/api/auth/doctor/register/complete` | POST | `{ phone, token, email, fullName, password }` | `{ doctorProfile }` |
| `/api/auth/patient/login-otp` | POST | `{ phone }` | `{ success }` |
| `/api/auth/patient/verify-otp` | POST | `{ phone, token }` | `{ access_token, patientProfile }` |
| `/api/auth/me` | GET | - | `{ user, role, profile }` |
| `/api/auth/signout` | POST | - | `{ success }` |

---

## ✅ Best Practices

1. **Always create auth user before profile**
2. **Use phone for patients** (not email)
3. **Check approval_status for doctors**
4. **Verify role in backend** (never trust frontend)
5. **Log auth failures** for security audits

---

## 🎯 Future Enhancements

- [ ] 2FA for admins
- [ ] Biometric auth for mobile app
- [ ] Session management dashboard
- [ ] Audit log for auth events
