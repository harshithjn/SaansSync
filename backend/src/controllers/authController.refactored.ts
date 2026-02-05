/**
 * REFACTORED AUTH CONTROLLER
 * 
 * Simplified to 3 core flows:
 * 1. Admin Login (email/password)
 * 2. Doctor Login (email/password) + Registration (OTP)
 * 3. Patient Login (OTP ONLY)
 */

import { Request, Response } from 'express'
import * as authService from '../services/authService.refactored'
import { AuthedRequest } from '../middleware/jwtMiddleware'

// ============================================================================
// ADMIN
// ============================================================================

export async function adminLogin(req: Request, res: Response) {
    const { email, password } = req.body
    if (!email || !password) {
        return res.status(400).json({ success: false, error: 'Email and password required' })
    }

    const result = await authService.adminLogin(email, password)
    return res.status(result.success ? 200 : 401).json(result)
}

// ============================================================================
// DOCTOR
// ============================================================================

export async function doctorLogin(req: Request, res: Response) {
    const { email, password } = req.body
    if (!email || !password) {
        return res.status(400).json({ success: false, error: 'Email and password required' })
    }

    const result = await authService.doctorLogin(email, password)
    return res.status(result.success ? 200 : 401).json(result)
}

export async function startDoctorRegistration(req: Request, res: Response) {
    const { phone } = req.body
    if (!phone) {
        return res.status(400).json({ success: false, error: 'Phone number required' })
    }

    const result = await authService.startDoctorRegistration(phone)
    return res.status(result.success ? 200 : 400).json(result)
}

export async function completeDoctorRegistration(req: Request, res: Response) {
    const { phone, token, email, fullName, password, altPhone } = req.body

    if (!phone || !token || !email || !fullName || !password) {
        return res.status(400).json({
            success: false,
            error: 'Phone, token, email, fullName, and password required'
        })
    }

    const result = await authService.completeDoctorRegistration({
        phone,
        token,
        email,
        fullName,
        password,
        altPhone
    })

    return res.status(result.success ? 200 : 400).json(result)
}

// ============================================================================
// PATIENT (OTP ONLY)
// ============================================================================

export async function patientLoginOtp(req: Request, res: Response) {
    const { phone } = req.body
    if (!phone) {
        return res.status(400).json({ success: false, error: 'Phone number required' })
    }

    const result = await authService.patientLoginWithOtp(phone)
    return res.status(result.success ? 200 : 400).json(result)
}

export async function verifyPatientOtp(req: Request, res: Response) {
    const { phone, token } = req.body
    if (!phone || !token) {
        return res.status(400).json({ success: false, error: 'Phone and token required' })
    }

    const result = await authService.verifyPatientOtp(phone, token)
    return res.status(result.success ? 200 : 401).json(result)
}

// ============================================================================
// SHARED
// ============================================================================

export async function authMe(req: AuthedRequest, res: Response) {
    if (!req.user?.id) {
        return res.status(401).json({ user: null })
    }

    const data = await authService.getAuthProfile({
        id: req.user.id,
        email: req.user.email
    })

    return res.json(data)
}

export async function signOut(_req: Request, res: Response) {
    return res.json({ success: true })
}
