import express from 'express'
import * as patientController from '../controllers/patientController'

const router = express.Router()

router.post('/', patientController.createPatient)
router.get('/:patientId', patientController.getPatient)
router.put('/:patientId', patientController.updatePatient)
router.get('/:patientId/logs', patientController.getPatientLogs)
router.get('/:patientId/medications', patientController.getPatientMedications)
router.get('/:patientId/reports', patientController.getPatientReports)
router.get('/:patientId/can-log', patientController.canLogToday)
router.get('/:patientId/instructions', patientController.getPatientInstructions)
router.post('/:patientId/instructions', patientController.addPatientInstruction)

export default router
