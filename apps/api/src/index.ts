import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { cors } from 'hono/cors'
import { Server } from 'socket.io'
import webhookRoutes from './routes/webhook.routes'
import workspaceRoutes from './routes/workspace.routes'
import issueRoutes from './routes/issue.routes'
import aiRoutes from './routes/ai.routes'

const app = new Hono()

// Middleware
app.use('*', logger())
app.use('*', cors())

// Routes
app.route('/webhooks', webhookRoutes)
app.route('/workspaces', workspaceRoutes)
app.route('/issues', issueRoutes)
app.route('/ai', aiRoutes)

app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  })
})

const port = 3001
console.log(`Server is running on http://localhost:${port}`)

const server = serve({
  fetch: app.fetch,
  port,
})

// Initialize Socket.io
const io = new Server(server as any, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
})

io.on('connection', (socket) => {
  console.log('User connected:', socket.id)

  socket.on('join-workspace', (workspaceId) => {
    socket.join(workspaceId)
    socket.data.workspaceId = workspaceId
    console.log(`User ${socket.id} joined workspace ${workspaceId}`)
  })

  socket.on('cursor-move', (data) => {
    const workspaceId = socket.data.workspaceId || 'default'
    socket.to(workspaceId).emit('cursor-move', {
      ...data,
      userId: socket.id
    })
  })

  socket.on('issue-moved', (data) => {
    const workspaceId = socket.data.workspaceId || 'default'
    socket.to(workspaceId).emit('issue-moved', data)
  })

  socket.on('disconnect', () => {
    const workspaceId = socket.data.workspaceId || 'default'
    io.to(workspaceId).emit('user-disconnected', socket.id)
    console.log('User disconnected:', socket.id)
  })
})

// Export io for use in other routes/services
export { io }
