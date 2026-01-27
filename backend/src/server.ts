// Backend Server Entry Point
// This file serves as the main entry point for the backend server

import express from 'express'
import cors from 'cors'

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json())

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() })
})

// API routes will be added here
app.get('/api', (req, res) => {
    res.json({ message: 'SaansSync Backend API' })
})

// Start server
app.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}`)
})

export default app