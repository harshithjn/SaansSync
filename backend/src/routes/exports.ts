import express from 'express'
import * as exportController from '../controllers/exportController'

const router = express.Router()

router.get('/logs', exportController.exportDailyLogs)

export default router
