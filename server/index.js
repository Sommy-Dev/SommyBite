import 'dotenv/config'
import express from 'express'
import cors from 'cors'

import productsRouter from './routes/products.js'
import ordersRouter from './routes/orders.js'
import adminRouter from './routes/admin.js'
import promoRouter from './routes/promo.js'
import paymentsRouter from './routes/payments.js'

const app = express()
const PORT = Number(process.env.PORT) || 5000

// CORS: allow the configured frontend origin(s); fall back to allowing all
// in local dev. The API uses Authorization headers (no cookies), so this is safe.
const allowedOrigins = (process.env.CLIENT_URL || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean)

app.use(
  cors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  }),
)

app.use(express.json({ limit: '1mb' }))

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'sommybite-api', time: new Date().toISOString() })
})

app.use('/api/products', productsRouter)
app.use('/api/orders', ordersRouter)
app.use('/api/admin', adminRouter)
app.use('/api/promo', promoRouter)
app.use('/api/payments', paymentsRouter)

app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found.' })
})

// Error handler - HttpError carries its own status, everything else is 500.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status = err.status || err.statusCode || 500
  if (status >= 500) console.error('[error]', err)
  res.status(status).json({ error: err.message || 'Something went wrong on the server.' })
})

app.listen(PORT, () => {
  console.log(`SommyBite API listening on http://localhost:${PORT}`)
})
