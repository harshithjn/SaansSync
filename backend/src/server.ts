// Backend Server Entry Point - Complete with Database Integration
import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { supabase } from './config/supabaseClient'
import { requireAuth } from './middleware/jwtMiddleware'
import prescriptionsRouter from './routes/prescriptions'
import personalizedAlertsRouter from './routes/personalizedAlerts'
import authRouter from './routes/auth'
import adminRouter from './routes/admin'
import patientRouter from './routes/patient'
import doctorRouter from './routes/doctor'
import logsRouter from './routes/logs'
import exportsRouter from './routes/exports'
import messageRouter from './routes/messageRoutes'
import alertsRouter from './routes/alerts'

const PORT = process.env.PORT || 3001

// Create app with basic middleware
const app = express()
app.use(helmet())
app.use(cors())
app.use(express.json())

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        database: 'connected'
    })
})

// Database keepalive endpoint
app.get('/keepalive', async (req, res) => {
    if (!supabase) return res.status(503).json({ status: 'error', message: 'Supabase not configured' })
    try {
        // Test database connectivity with a simple query to a public table
        const { data, error } = await supabase
            .from('doctors')
            .select('count')
            .limit(1)

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned, which is fine
            console.error('Keepalive error:', error)
            return res.status(500).json({
                status: 'error',
                message: 'Database connection failed',
                error: error.message
            })
        }

        res.json({
            status: 'alive',
            timestamp: new Date().toISOString(),
            database: 'active'
        })
    } catch (error) {
        console.error('Keepalive error:', error)
        res.status(500).json({
            status: 'error',
            message: 'Database keepalive failed'
        })
    }
})

// Basic API endpoint
app.get('/api', (req, res) => {
    res.json({ message: 'SaansSync Backend API - Working with Database!' })
})

// Database status endpoint
app.get('/api/db-status', async (req, res) => {
    if (!supabase) return res.status(503).json({ status: 'error', connected: false, message: 'Supabase not configured' })
    try {
        // Test database connectivity with a simple query to a public table
        const { data, error } = await supabase
            .from('doctors')
            .select('count')
            .limit(1)

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned, which is fine
            return res.status(500).json({ status: 'error', connected: false, error: error.message })
        }

        res.json({ status: 'connected', connected: true, timestamp: new Date().toISOString() })
    } catch (error) {
        res.status(500).json({ status: 'error', connected: false, message: 'Database connection failed' })
    }
})

// Register all routes BEFORE auth middleware
app.use('/api/auth', authRouter)
app.use('/api/admin', adminRouter)
app.use('/api/patient', patientRouter)
app.use('/api/doctor', doctorRouter)
app.use('/api/logs', logsRouter)
app.use('/api/exports', exportsRouter)
app.use('/api/messages', messageRouter)
app.use('/api/alerts', alertsRouter)
app.use('/api/prescriptions', prescriptionsRouter)
app.use('/api/personalized-alerts', personalizedAlertsRouter)

// Global auth middleware AFTER routes - applies to all routes except excluded ones
app.use((req, res, next) => {
    if (
        req.path.startsWith('/api/auth') ||
        req.path === '/health' ||
        req.path === '/keepalive' ||
        req.path === '/api/db-status' ||
        req.path === '/api'
    ) return next()
    return requireAuth(req as any, res as any, next as any)
})

// Automatic keepalive every 10 minutes
setInterval(async () => {
    if (!supabase) return
    try {
        // Test database connectivity with a simple query to a public table
        const { data, error } = await supabase
            .from('doctors')
            .select('count')
            .limit(1)

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned, which is fine
            console.error('Auto-keepalive failed:', error)
        } else {
            console.log('✅ Database keepalive successful:', new Date().toISOString())
        }
    } catch (error) {
        console.error('Auto-keepalive error:', error)
    }
}, 10 * 60 * 1000) // 10 minutes

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Unhandled Error:', err.stack);
    res.status(500).json({
        status: 'error',
        message: 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Backend server running on port ${PORT}`)
    console.log(`📊 Health check: http://localhost:${PORT}/health`)
    console.log(`💓 Keepalive: http://localhost:${PORT}/keepalive`)
    console.log(`🗄️  Database status: http://localhost:${PORT}/api/db-status`)
    console.log(`⏰ Auto-keepalive every 10 minutes`)
})

export default app