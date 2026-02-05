import express from 'express'
import * as logsController from '../controllers/logsController'

const router = express.Router()

router.post('/', logsController.createLog)

export default router
