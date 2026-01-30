import express from 'express'
import * as personalizedAlertsController from '../controllers/personalizedAlertsController'

const router = express.Router()

router.post('/', personalizedAlertsController.createPersonalizedAlert)
router.get('/', personalizedAlertsController.listPersonalizedAlerts)

export default router
