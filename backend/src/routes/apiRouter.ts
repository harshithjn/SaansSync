import express from 'express'
import adminRouter from './admin'
import alertsRouter from './alerts'
import doctorRouter from './doctor'
import exportsRouter from './exports'
import logsRouter from './logs'
import messageRouter from './messageRoutes'
import patientRouter from './patient'
import prescriptionsRouter from './prescriptions'

const apiRouter = express.Router()

apiRouter.use('/admin', adminRouter)
apiRouter.use('/alerts', alertsRouter)
apiRouter.use('/doctor', doctorRouter)
apiRouter.use('/exports', exportsRouter)
apiRouter.use('/logs', logsRouter)
apiRouter.use('/messages', messageRouter)
apiRouter.use('/patient', patientRouter)
apiRouter.use('/prescriptions', prescriptionsRouter)

export default apiRouter
