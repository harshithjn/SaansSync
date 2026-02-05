import express from 'express'
import * as alertsController from '../controllers/alertsController'

const router = express.Router()

router.post('/evaluate/:patientId', alertsController.evaluateAlert)
router.post('/', alertsController.createAlert)
router.get('/', alertsController.getAlerts)
router.post('/:alertId/ack', alertsController.acknowledgeAlert)
router.post('/:alertId/acknowledge', alertsController.acknowledgeAlert) // Alias for completeness

export default router
