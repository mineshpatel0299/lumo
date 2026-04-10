import { Hono } from 'hono'
import { prisma } from '../lib/prisma'
import { authMiddleware } from '../middleware/auth.middleware'

const workspaceRoutes = new Hono()

// Get all workspaces for the logged-in user (with project statuses)
workspaceRoutes.get('/', authMiddleware, async (c) => {
  const userId = c.get('userId')

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: {
      workspaceMembers: {
        include: {
          workspace: {
            include: {
              projects: {
                include: { statuses: { orderBy: { position: 'asc' } } }
              }
            }
          }
        }
      }
    }
  })

  // Flatten: attach first-project statuses directly on the workspace object
  // so the frontend store can access currentWorkspace.statuses and currentWorkspace.projects
  const workspaces = user?.workspaceMembers.map((m) => {
    const ws = m.workspace
    const firstProject = ws.projects[0]
    return {
      ...ws,
      statuses: firstProject?.statuses ?? [],
    }
  }) ?? []

  return c.json({ workspaces })
})

// Create a new workspace
workspaceRoutes.post('/', authMiddleware, async (c) => {
  const userId = c.get('userId')
  const { name, slug } = await c.req.json()

  if (!name || !slug) {
    return c.json({ error: 'name and slug are required' }, 400)
  }

  // Check slug uniqueness up-front for a clear error
  const existing = await prisma.workspace.findUnique({ where: { slug } })
  if (existing) {
    return c.json({ error: 'Workspace slug is already taken' }, 409)
  }

  const user = await prisma.user.findUnique({ where: { clerkId: userId } })
  if (!user) {
    return c.json({ error: 'User not found in database' }, 404)
  }

  // Workspace → Project → ProjectStatuses (all in one nested create)
  const workspace = await prisma.workspace.create({
    data: {
      name,
      slug,
      members: {
        create: { userId: user.id, role: 'owner' }
      },
      projects: {
        create: {
          name: 'Main Project',
          slug: 'MAIN',
          creatorId: user.id,
          // ProjectStatus lives under Project, not Workspace
          statuses: {
            createMany: {
              data: [
                { name: 'Backlog',     color: '#6B7280', category: 'backlog',    position: 0 },
                { name: 'Todo',        color: '#3B82F6', category: 'unstarted',  position: 1, isDefault: true },
                { name: 'In Progress', color: '#F59E0B', category: 'started',    position: 2 },
                { name: 'Done',        color: '#10B981', category: 'completed',  position: 3 },
              ]
            }
          }
        }
      }
    },
    include: {
      projects: {
        include: { statuses: { orderBy: { position: 'asc' } } }
      }
    }
  })

  // Flatten statuses onto the workspace for the frontend
  const firstProject = workspace.projects[0]
  return c.json({
    workspace: {
      ...workspace,
      statuses: firstProject?.statuses ?? [],
    }
  })
})

export default workspaceRoutes
