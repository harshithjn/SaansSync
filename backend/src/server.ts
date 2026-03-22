import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import prisma from './config/db'
import { requireAuth } from './middleware/jwtMiddleware'
import prescriptionsRouter from './routes/prescriptions'
import authRouter from './routes/auth'
import adminRouter from './routes/admin'
import patientRouter from './routes/patient'
import doctorRouter from './routes/doctor'
import logsRouter from './routes/logs'
import exportsRouter from './routes/exports'
import messageRouter from './routes/messageRoutes'
import alertsRouter from './routes/alerts'

import apiRouter from './routes/apiRouter'

const PORT = process.env.PORT || 3001

const app = express()

// Request Logging for Debugging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - Origin: ${req.headers.origin}`);
  next();
});

app.use(helmet())
app.use(cors({
  origin: [
    "http://localhost:3000",
    "https://saanssync.harshithj.me"
  ],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
}))
app.use(express.json())


// --- PUBLIC ROUTES ---
app.use('/auth', authRouter)

app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        database: 'connected'
    })
})

app.get('/keepalive', async (req, res) => {
    try {
        await prisma.doctor.count();
        res.json({
            status: 'alive',
            timestamp: new Date().toISOString(),
            database: 'active'
        })
    } catch (error: any) {
        console.error('Keepalive error:', error)
        res.status(500).json({
            status: 'error',
            message: 'Database keepalive failed',
            error: error.message
        })
    }
})

// --- PROTECTED API ROUTES ---
app.use('/api', (req, res, next) => {
    if (req.path === '/' || req.path === '/db-status') return next()
    return requireAuth(req as any, res as any, next as any)
}, apiRouter)

app.get('/api', (req, res) => {
    res.json({ message: 'SaansSync Backend API - Working with Database!' })
})

app.get('/api/db-status', async (req, res) => {
    try {
        await prisma.doctor.count();
        res.json({ status: 'connected', connected: true, timestamp: new Date().toISOString() })
    } catch (error: any) {
        res.status(500).json({ status: 'error', connected: false, message: 'Database connection failed' })
    }
})


setInterval(async () => {
    try {
        await prisma.doctor.count();
        console.log('✅ Database keepalive successful:', new Date().toISOString())
    } catch (error) {
        console.error('Auto-keepalive error:', error)
    }
}, 10 * 60 * 1000)

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Unhandled Error:', err.stack);
    res.status(500).json({
        status: 'error',
        message: 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Backend server running on port ${PORT}`)
})

export default app