import express from 'express'
import * as prescriptionsController from '../controllers/prescriptionsController'

const router = express.Router()

router.post('/', prescriptionsController.createPrescription)
router.get('/', prescriptionsController.listPrescriptions)

export default router
