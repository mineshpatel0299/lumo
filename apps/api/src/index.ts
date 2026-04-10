import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { cors } from 'hono/cors'
import webhookRoutes from './routes/webhook.routes'

const app = new Hono()

app.use('*', logger())
app.use('*', cors())

app.route('/webhooks', webhookRoutes)

app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  })
})

app.get('/', (c) => {
  return c.text('Lumo API - Powered by Hono')
})

const port = 3001
console.log(`Server is running on http://localhost:${port}`)

serve({
  fetch: app.fetch,
  port
})

export default app
