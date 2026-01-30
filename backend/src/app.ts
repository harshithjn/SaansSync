import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { authMiddleware } from './middleware/authMiddleware'

const app = express()

app.use(helmet())
app.use(cors())
app.use(express.json())

// Global auth middleware: skip public auth endpoints under /api/auth
app.use((req, res, next) => {
  if (req.path.startsWith('/api/auth')) return next()
  return authMiddleware(req as any, res as any, next as any)
})

export default app
