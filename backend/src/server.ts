// Backend Server Entry Point - Complete with Database Integration
import 'dotenv/config'
import express from 'express'
import { z } from 'zod'
import app from './app'
import { supabase, supabaseAdmin } from './config/supabaseClient'
import prescriptionsRouter from './routes/prescriptions'
import personalizedAlertsRouter from './routes/personalizedAlerts'

const PORT = process.env.PORT || 3001

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

// --- Patient auth (email + default password; requires service role) ---
app.post('/api/auth/patient', async (req, res) => {
    if (!supabaseAdmin) return res.status(503).json({ success: false, error: 'Service role not configured. Set SUPABASE_SERVICE_ROLE_KEY.' })
    try {
        const { email, password } = req.body
        if (!email || !password) return res.status(400).json({ success: false, error: 'email and password required' })
        const { data: row, error } = await supabaseAdmin
            .from('patients')
            .select('id, email, full_name, patient_data, default_password')
            .eq('email', String(email).toLowerCase().trim())
            .maybeSingle()
        if (error) return res.status(500).json({ success: false, error: error.message })
        if (!row) return res.status(401).json({ success: false, error: 'Invalid email or password' })
        const stored = row.default_password ?? (row.patient_data as Record<string, unknown>)?.defaultPassword
        if (stored !== password) return res.status(401).json({ success: false, error: 'Invalid email or password' })
        const pd = row.patient_data as Record<string, unknown> | null
        const diagnosis = pd?.diagnosis as Record<string, unknown> | undefined
        const primaryCategory = (diagnosis?.primaryCategory as string) ?? ''
        res.json({
            success: true,
            session: { patientId: row.id, email: row.email, role: 'PATIENT', primaryDiagnosisCategory: primaryCategory, token: '' }
        })
    } catch (e) {
        res.status(500).json({ success: false, error: (e as Error).message })
    }
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

// Alerts routes moved to modular router (see src/routes/alerts.ts)
import alertsRouter from './routes/alerts'
app.use('/api/alerts', alertsRouter)

// Prescriptions routes (modular)
app.use('/api/prescriptions', prescriptionsRouter)

// Personalized alerts routes (modular)
app.use('/api/personalized-alerts', personalizedAlertsRouter)

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