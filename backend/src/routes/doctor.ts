import express from 'express'
import * as doctorController from '../controllers/doctorController'

const router = express.Router()

router.post('/profile', doctorController.createDoctorProfile)

router.get('/:doctorId/patients', doctorController.getDoctorPatients)
router.get('/:doctorId', doctorController.getDoctorProfile)
router.get('/:doctorId/logs', doctorController.getDoctorLogs)
router.get('/:doctorId/alerts', doctorController.getDoctorAlerts)
router.post('/:doctorId/assign-patient', doctorController.assignPatient)

router.get('/:doctorId/patient-folders', doctorController.getPatientFolders)
router.post('/:doctorId/patient-folders', doctorController.upsertPatientFolder)
router.patch('/:doctorId/patient-folders/:patientId', doctorController.updatePatientFolder)
router.delete('/:doctorId/patient-folders/:patientId', doctorController.deletePatientFolder)

export default router
