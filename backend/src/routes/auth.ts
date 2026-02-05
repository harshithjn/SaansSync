import express from 'express'
import * as authController from '../controllers/authController'
import { requireAuth } from '../middleware/jwtMiddleware'

const router = express.Router()

router.post('/doctor/start-registration', authController.startDoctorRegistration)
router.post('/doctor/complete-registration', authController.completeDoctorRegistration)
router.post('/doctor/login', authController.doctorLogin)
router.post('/doctor/login-otp', authController.doctorLoginOtp)
router.post('/doctor/verify-otp', authController.verifyDoctorOtp)
router.post('/doctor/setup-password', authController.setupDoctorPassword)
router.post('/doctor/signup', authController.doctorSignup)

router.post('/password/reset/start', authController.startPasswordReset)
router.post('/password/reset/complete', authController.completePasswordReset)

router.post('/patient/login-otp', authController.patientLoginOtp)
router.post('/patient/verify-otp', authController.verifyPatientOtp)
router.post('/patient/login', authController.patientLogin)

router.post('/admin/login', authController.adminLogin)

router.post('/callback', authController.exchangeCallback)
router.post('/test-email', authController.testEmail)

router.get('/me', requireAuth, authController.authMe)
router.post('/signout', authController.signOut)

export default router
