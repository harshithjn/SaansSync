import express from 'express'
import * as alertsController from '../controllers/alertsController'

const router = express.Router()

router.post('/', alertsController.createAlert)
router.get('/', alertsController.getAlerts)

export default router
