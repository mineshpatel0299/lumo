import { Hono } from 'hono'
import { prisma } from '../lib/prisma'
import { authMiddleware } from '../middleware/auth.middleware'

const workspaceRoutes = new Hono()

// Get all workspaces for the logged-in user
workspaceRoutes.get('/', authMiddleware, async (c) => {
  const userId = c.get('userId')
  
  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: {
      workspaceMembers: {
        include: {
          workspace: {
            include: {
              projects: true,
              statuses: true
            }
          }
        }
      }
    }
  })

  const workspaces = user?.workspaceMembers.map(m => m.workspace) || []
  return c.json({ workspaces })
})

// Create a new workspace
workspaceRoutes.post('/', authMiddleware, async (c) => {
  const userId = c.get('userId')
  const { name, slug } = await c.req.json()

  // Find the internal user ID
  const user = await prisma.user.findUnique({
    where: { clerkId: userId }
  })

  if (!user) {
    return c.json({ error: 'User not found in database' }, 404)
  }

  const workspace = await prisma.workspace.create({
    data: {
      name,
      slug,
      members: {
        create: {
          userId: user.id,
          role: 'owner'
        }
      },
      projects: {
        create: {
          name: 'Main Project',
          slug: 'MAIN',
          creatorId: user.id,
        }
      },
      statuses: {
        createMany: {
          data: [
            { name: 'Backlog', color: '#6B7280', sortOrder: 0 },
            { name: 'Todo', color: '#3B82F6', sortOrder: 1 },
            { name: 'In Progress', color: '#F59E0B', sortOrder: 2 },
            { name: 'Done', color: '#10B981', sortOrder: 3 },
          ]
        }
      }
    },
    include: {
      projects: true,
      statuses: true
    }
  })

  return c.json({ workspace })
})

export default workspaceRoutes
