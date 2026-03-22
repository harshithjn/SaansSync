import express from 'express'
import * as adminController from '../controllers/adminController'

const router = express.Router()

router.get('/doctors', adminController.getAllDoctors)
router.post('/doctors/:doctorId/approve', adminController.approveDoctorAccount)
router.post('/doctors/:doctorId/reject', adminController.rejectDoctorAccount)
router.post('/doctors/fix-approved', adminController.fixApprovedDoctors)

router.get('/patients/recent', adminController.getRecentPatients)

export default router
