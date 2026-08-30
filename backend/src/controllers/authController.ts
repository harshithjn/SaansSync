import { Request, Response } from 'express'
import * as authService from '../services/authService'
import { AuthedRequest } from '../middleware/jwtMiddleware'

export async function startDoctorRegistration(req: Request, res: Response) {
  const { email } = req.body
  if (!email) return res.status(400).json({ success: false, error: 'email required' })
  const result = await authService.startDoctorRegistration(email)
  return res.status(result.success ? 200 : 400).json(result)
}

export async function completeDoctorRegistration(req: Request, res: Response) {
  const { token, email, fullName, password } = req.body
  if (!token || !email || !fullName || !password) {
    return res.status(400).json({ success: false, error: 'token, email, fullName, password required' })
  }
  const result = await authService.completeDoctorRegistration({ token, email, fullName, password })
  return res.status(result.success ? 200 : 400).json(result)
}

export async function doctorLogin(req: Request, res: Response) {
  const { email, password } = req.body
  if (!email || !password) return res.status(400).json({ success: false, error: 'email and password required' })
  const result = await authService.doctorLoginWithPassword(email, password)
  return res.status(result.success ? 200 : 401).json(result)
}

export async function doctorLoginOtp(req: Request, res: Response) {
  const { email } = req.body
  if (!email) return res.status(400).json({ success: false, error: 'email required' })
  const result = await authService.doctorLoginWithOtp(email)
  return res.status(result.success ? 200 : 400).json(result)
}

export async function verifyDoctorOtp(req: Request, res: Response) {
  const { email, token } = req.body
  if (!email || !token) return res.status(400).json({ success: false, error: 'email and token required' })
  const result = await authService.verifyDoctorOtp(email, token)
  return res.status(result.success ? 200 : 401).json(result)
}

export async function setupDoctorPassword(req: Request, res: Response) {
  const { email, token, newPassword } = req.body
  if (!email || !token || !newPassword) return res.status(400).json({ success: false, error: 'email, token, newPassword required' })
  const result = await authService.setupDoctorPassword(email, token, newPassword)
  return res.status(result.success ? 200 : 400).json(result)
}

export async function startPasswordReset(req: Request, res: Response) {
  const { email } = req.body
  if (!email) return res.status(400).json({ success: false, error: 'email required' })
  const result = await authService.startPasswordReset(email)
  return res.status(result.success ? 200 : 400).json(result)
}

export async function completePasswordReset(req: Request, res: Response) {
  const { email, token, newPassword } = req.body
  if (!email || !token || !newPassword) return res.status(400).json({ success: false, error: 'email, token, newPassword required' })
  const result = await authService.setupDoctorPassword(email, token, newPassword)
  return res.status(result.success ? 200 : 400).json(result)
}

export async function patientLoginOtp(req: Request, res: Response) {
  const { email } = req.body
  if (!email) return res.status(400).json({ success: false, error: 'email required' })
  const result = await authService.patientLoginWithOtp(email)
  return res.status(result.success ? 200 : 400).json(result)
}

export async function verifyPatientOtp(req: Request, res: Response) {
  const { email, token } = req.body
  if (!email || !token) return res.status(400).json({ success: false, error: 'email and token required' })
  const result = await authService.verifyPatientOtp(email, token)
  return res.status(result.success ? 200 : 401).json(result)
}

export async function patientLogin(req: Request, res: Response) {
  const { email, password } = req.body
  if (!email || !password) return res.status(400).json({ success: false, error: 'email and password required' })
  const result = await authService.patientLoginWithPassword(email, password)
  return res.status(result.success ? 200 : 401).json(result)
}

export async function guestLogin(req: Request, res: Response) {
  const role = req.body?.role === 'patient' ? 'patient' : 'doctor'
  try {
    const result = role === 'doctor'
      ? await authService.guestDoctorLogin()
      : await authService.guestPatientLogin()
    return res.status(result.success ? 200 : 400).json(result)
  } catch (error: any) {
    return res.status(500).json({ success: false, error: 'Guest login failed' })
  }
}

export async function adminLogin(req: Request, res: Response) {
  const { email, password } = req.body
  if (!email || !password) return res.status(400).json({ success: false, error: 'email and password required' })
  const result = await authService.adminLogin(email, password)
  return res.status(result.success ? 200 : 401).json(result)
}

export async function doctorSignup(req: Request, res: Response) {
  const { email, fullName, password } = req.body
  if (!email || !fullName) return res.status(400).json({ success: false, error: 'email and fullName required' })
  const result = await authService.doctorSignup(email, fullName, password)
  return res.status(result.success ? 200 : 400).json(result)
}

export async function patientSignup(req: Request, res: Response) {
  const { email, fullName, password } = req.body
  if (!email || !fullName) return res.status(400).json({ success: false, error: 'email and fullName required' })
  const result = await authService.patientSignup(email, fullName, password)
  return res.status(result.success ? 200 : 400).json(result)
}

export async function testEmail(req: Request, res: Response) {
  const { email } = req.body
  if (!email) return res.status(400).json({ success: false, error: 'email required' })
  const result = await authService.testEmail(email)
  return res.status(result.success ? 200 : 400).json(result)
}

export async function exchangeCallback(req: Request, res: Response) {
  const { code } = req.body
  if (!code) return res.status(400).json({ success: false, error: 'code required' })
  const result = await authService.exchangeCodeForSession(code)
  return res.status(result.success ? 200 : 400).json(result)
}

export async function authMe(req: AuthedRequest, res: Response) {
  if (!req.user?.id) return res.status(401).json({ user: null })
  const data = await authService.getAuthProfile({
    id: req.user.id,
    email: req.user.email,
    role: req.user.role
  })
  return res.json(data)
}

export async function signOut(_req: Request, res: Response) {
  return res.json({ success: true })
}
