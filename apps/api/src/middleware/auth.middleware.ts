import { createClerkClient } from '@clerk/backend'
import { Context, Next } from 'hono'
import { env } from 'hono/adapter'

export const authMiddleware = async (c: Context, next: Next) => {
  const { CLERK_SECRET_KEY } = env<{ CLERK_SECRET_KEY: string }>(c)
  
  const authHeader = c.req.header('Authorization')
  if (!authHeader) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const token = authHeader.replace('Bearer ', '')
  const clerk = createClerkClient({ secretKey: CLERK_SECRET_KEY })

  try {
    const session = await clerk.verifyToken(token)
    if (!session) {
      return c.json({ error: 'Invalid token' }, 401)
    }

    c.set('userId', session.sub)
    await next()
  } catch (err) {
    return c.json({ error: 'Authentication failed' }, 401)
  }
}
