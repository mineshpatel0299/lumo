import { Hono } from 'hono'
import { prisma } from '../lib/prisma'
import { authMiddleware } from '../middleware/auth.middleware'

const issueRoutes = new Hono()

// Get all issues for a workspace (scoped by column)
issueRoutes.get('/:workspaceSlug', authMiddleware, async (c) => {
  const workspaceSlug = c.req.param('workspaceSlug')
  
  const issues = await prisma.issue.findMany({
    where: {
      workspace: { slug: workspaceSlug }
    },
    include: {
      assignee: true,
      status: true,
      labels: {
        include: { label: true }
      }
    },
    orderBy: { sortOrder: 'asc' }
  })

  return c.json({ issues })
})

// Update issue status/position (DND)
issueRoutes.patch('/:issueId', authMiddleware, async (c) => {
  const issueId = c.req.param('issueId')
  const { statusId, sortOrder } = await c.req.json()

  const issue = await prisma.issue.update({
    where: { id: issueId },
    data: {
      statusId,
      sortOrder
    }
  })

  return c.json({ issue })
})

// Create new issue
issueRoutes.post('/', authMiddleware, async (c) => {
  const userId = c.get('userId')
  const { title, projectId, workspaceId, statusId, priority } = await c.req.json()

  const user = await prisma.user.findUnique({ where: { clerkId: userId } })
  if (!user) return c.json({ error: 'User not found' }, 404)

  // Generate identifier (e.g. LUMO-1)
  const project = await prisma.project.findUnique({ where: { id: projectId } })
  const issueCount = await prisma.issue.count({ where: { projectId } })
  const identifier = `${project?.slug || 'TASK'}-${issueCount + 1}`

  const issue = await prisma.issue.create({
    data: {
      title,
      identifier,
      projectId,
      workspaceId,
      statusId,
      priority: priority || 'no_priority',
      creatorId: user.id,
      sortOrder: issueCount // At the end
    }
  })

  return c.json({ issue })
})

export default issueRoutes
