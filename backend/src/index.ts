import express from 'express'
import cors from 'cors'

const app = express()
const port = Number(process.env.PORT ?? 3000)

app.use(cors())
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  })
})

app.listen(port, '0.0.0.0', () => {
  console.log(`API server listening on port ${port}`)
})