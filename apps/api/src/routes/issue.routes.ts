import { Hono } from 'hono'
import { prisma } from '../lib/prisma'
import { authMiddleware } from '../middleware/auth.middleware'

const issueRoutes = new Hono()

// Get all issues for a workspace
issueRoutes.get('/:workspaceSlug', authMiddleware, async (c) => {
  const workspaceSlug = c.req.param('workspaceSlug')

  try {
    const issues = await prisma.issue.findMany({
      where: {
        workspace: { slug: workspaceSlug },
      },
      include: {
        assignee: true,
        status: true,
        labels: {
          include: { label: true },
        },
      },
      orderBy: { sortOrder: 'asc' },
    })

    return c.json({ issues })
  } catch (err) {
    console.error('[GET /issues/:workspaceSlug]', err)
    return c.json({ error: 'Failed to fetch issues' }, 500)
  }
})

// Update issue status/position (DND)
issueRoutes.patch('/:issueId', authMiddleware, async (c) => {
  const issueId = c.req.param('issueId')
  const { statusId, sortOrder } = await c.req.json()

  if (!statusId) {
    return c.json({ error: 'statusId is required' }, 400)
  }

  try {
    const issue = await prisma.issue.update({
      where: { id: issueId },
      data: { statusId, sortOrder },
    })
    return c.json({ issue })
  } catch (err) {
    console.error('[PATCH /issues/:issueId]', err)
    return c.json({ error: 'Failed to update issue' }, 500)
  }
})

// Create new issue
issueRoutes.post('/', authMiddleware, async (c) => {
  const userId = c.get('userId')

  let body: Record<string, unknown>
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400)
  }

  const { title, projectId, workspaceId, statusId, priority, description } = body as {
    title?: string
    projectId?: string
    workspaceId?: string
    statusId?: string
    priority?: string
    description?: string
  }

  // Validate required fields before touching the DB
  if (!title)       return c.json({ error: 'title is required' }, 400)
  if (!projectId)   return c.json({ error: 'projectId is required — workspace may still be loading' }, 400)
  if (!workspaceId) return c.json({ error: 'workspaceId is required' }, 400)
  if (!statusId)    return c.json({ error: 'statusId is required — workspace statuses may still be loading' }, 400)

  try {
    const user = await prisma.user.findUnique({ where: { clerkId: userId } })
    if (!user) return c.json({ error: 'User not found in database. Clerk webhook may not have fired yet.' }, 404)

    // Generate identifier (e.g. MAIN-1)
    const project = await prisma.project.findUnique({ where: { id: projectId } })
    if (!project) return c.json({ error: 'Project not found' }, 404)

    const issueCount = await prisma.issue.count({ where: { projectId } })
    const identifier = `${project.slug}-${issueCount + 1}`

    const issue = await prisma.issue.create({
      data: {
        title,
        identifier,
        projectId,
        workspaceId,
        statusId,
        priority: (priority as any) || 'no_priority',
        creatorId: user.id,
        sortOrder: issueCount,
        // description is Json? — only include if provided
        ...(description ? { description } : {}),
      },
      include: {
        status: true,
        assignee: true,
      },
    })

    return c.json({ issue }, 201)
  } catch (err) {
    console.error('[POST /issues]', err)
    return c.json({ error: 'Failed to create issue' }, 500)
  }
})

export default issueRoutes
