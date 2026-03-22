import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import prisma from '../config/db'

const JWT_SECRET = process.env.JWT_SECRET || 'saanssync_local_secret'
const SALT_ROUNDS = 10

const ADMIN_EMAILS = [
  'harshithj1121@gmail.com',
  'admin@healthplatform.com',
  'admin@saanssync.com'
]

export function isAdminEmail(email?: string | null) {
  if (!email) return false
  return ADMIN_EMAILS.includes(email)
}

export function createToken(userId: string, email: string, role: string) {
  return jwt.sign({ id: userId, email, role }, JWT_SECRET, { expiresIn: '7d' })
}

// Clerk handles all auth flows, these function stubs return errors to force usage of Clerk.
export async function startDoctorRegistration(..._args: any[]) { return { success: false, error: 'Use simplified signup' } }
export async function completeDoctorRegistration(..._args: any[]) { return { success: false, error: 'Use simplified signup' } }

export async function doctorLoginWithPassword(email: string, password?: string) {
  const doctor = await prisma.doctor.findUnique({ where: { email } })
  if (!doctor) return { success: false, error: 'Doctor not found' }
  
  if (doctor.password && password) {
    const valid = await bcrypt.compare(password, doctor.password)
    if (!valid) return { success: false, error: 'Invalid password' }
  } else if (doctor.password && !password) {
    return { success: false, error: 'Password required' }
  }
  
  const token = createToken(doctor.id, doctor.email, 'doctor')
  return { success: true, token, doctorProfile: doctor }
}

export async function doctorLoginWithOtp(..._args: any[]) { return { success: false, error: 'Login handled by Clerk' } }
export async function verifyDoctorOtp(..._args: any[]) { return { success: false, error: 'Login handled by Clerk' } }
export async function setupDoctorPassword(..._args: any[]) { return { success: false, error: 'Password setup handled by Clerk' } }
export async function startPasswordReset(..._args: any[]) { return { success: false, error: 'Not implemented' } }
export async function patientLoginWithOtp(..._args: any[]) { return { success: false, error: 'Login handled by Clerk' } }
export async function verifyPatientOtp(..._args: any[]) { return { success: false, error: 'Login handled by Clerk' } }

export async function patientLoginWithPassword(email: string, password?: string) {
  const patient = await prisma.patient.findUnique({ where: { email } })
  if (!patient) return { success: false, error: 'Patient not found' }
  
  if (patient.password && password) {
    const valid = await bcrypt.compare(password, patient.password)
    if (!valid) return { success: false, error: 'Invalid password' }
  } else if (patient.password && !password) {
    return { success: false, error: 'Password required' }
  }
  
  const token = createToken(patient.id, patient.email, 'patient')
  return { success: true, token, patientProfile: patient }
}

export async function adminLogin(email: string, password?: string) {
  if (!isAdminEmail(email)) return { success: false, error: 'Not an admin email' }
  
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'saanssync_admin'
  if (password !== ADMIN_PASSWORD) {
    return { success: false, error: 'Invalid admin password' }
  }
  
  const token = createToken('admin', email, 'admin')
  return { success: true, token }
}

export async function doctorSignup(email: string, fullName: string, password?: string) {
  const existing = await prisma.doctor.findUnique({ where: { email } })
  if (existing) return { success: false, error: 'Email already exists' }
  
  let hashedPassword = null
  if (password) {
    hashedPassword = await bcrypt.hash(password, SALT_ROUNDS)
  }

  const doctor = await prisma.doctor.create({
    data: { 
      email, 
      fullName, 
      approvalStatus: 'approved',
      password: hashedPassword
    }
  })
  
  const token = createToken(doctor.id, doctor.email, 'doctor')
  return { success: true, token, doctorProfile: doctor }
}

export async function patientSignup(email: string, fullName: string, password?: string) {
  const existing = await prisma.patient.findUnique({ where: { email } })
  if (existing) return { success: false, error: 'Email already exists' }
  
  let hashedPassword = null
  if (password) {
    hashedPassword = await bcrypt.hash(password, SALT_ROUNDS)
  }

  const patient = await prisma.patient.create({
    data: { 
      email, 
      fullName,
      password: hashedPassword,
      registrationDate: new Date(),
      diagnosis: { 
        primaryCategory: 'ILD',
        isAsthmatic: false
      },
      comorbidities: [],
      medications: []
    } as any
  })
  
  const token = createToken(patient.id, patient.email, 'patient')
  return { success: true, token, patientProfile: patient }
}

export async function testEmail(..._args: any[]) { return { success: false, error: 'Not implemented' } }
export async function exchangeCodeForSession(..._args: any[]) { return { success: false, error: 'Verification handled by Clerk' } }

export async function getAuthProfile(user: { id: string; email?: string | null; role?: string }) {
  if (user.role === 'admin' || isAdminEmail(user.email)) {
    return {
      user,
      role: 'admin' as const,
      profile: { email: user.email },
      approved: true
    }
  }

  const doctorProfile = await prisma.doctor.findUnique({
    where: { id: user.id }
  });

  if (doctorProfile) {
    return {
      user,
      role: 'doctor' as const,
      profile: doctorProfile,
      approved: doctorProfile.approvalStatus === 'approved'
    }
  }

  const patientProfile = await prisma.patient.findUnique({
    where: { id: user.id }
  });

  if (patientProfile) {
    return {
      user,
      role: 'patient' as const,
      profile: patientProfile,
      approved: true
    }
  }

  return { user, role: null, profile: null }
}
