import { Hono } from 'hono'
import OpenAI from 'openai'
import { authMiddleware } from '../middleware/auth.middleware'
import { env } from 'hono/adapter'

const aiRoutes = new Hono()

aiRoutes.post('/suggest-description', authMiddleware, async (c) => {
  const { OPENAI_API_KEY } = env<{ OPENAI_API_KEY: string }>(c)
  const { title } = await c.req.json()

  if (!OPENAI_API_KEY) {
    return c.json({
      suggestion: `This is an AI-generated placeholder description for: "${title}". \n\n### Tasks:\n- Research the root cause of the ${title} issue.\n- Implement a robust fix.\n- Verify with unit tests.`
    })
  }

  const openai = new OpenAI({ apiKey: OPENAI_API_KEY })

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a technical product manager. Generate a concise, professional GitHub-style issue description in markdown for the given issue title. Use bullet points for tasks."
        },
        {
          role: "user",
          content: `Issue Title: ${title}`
        }
      ],
      max_tokens: 300
    })

    return c.json({
      suggestion: response.choices[0].message.content
    })
  } catch (err) {
    console.error(err)
    return c.json({ error: 'AI generation failed' }, 500)
  }
})

aiRoutes.get('/workspace-summary/:workspaceSlug', authMiddleware, async (c) => {
  const { OPENAI_API_KEY } = env<{ OPENAI_API_KEY: string }>(c)
  const workspaceSlug = c.req.param('workspaceSlug')

  const issues = await prisma.issue.findMany({
    where: { workspace: { slug: workspaceSlug } },
    include: { status: true }
  })

  if (issues.length === 0) {
    return c.json({ summary: "No issues found in this workspace yet. Start by creating some tasks!" })
  }

  if (!OPENAI_API_KEY) {
    return c.json({
      summary: `### Lumo Digest: ${workspaceSlug}\n\nCurrently, there are **${issues.length}** active tasks in this workspace. Most are in the **${issues[0].status?.name}** phase. \n\n*Keep pushing forward!*`
    })
  }

  const openai = new OpenAI({ apiKey: OPENAI_API_KEY })

  try {
    const issueList = issues.map(i => `- [${i.status?.name}] ${i.title}`).join('\n')
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an executive assistant. Summarize the current status of the workspace based on the issue list provided. Be encouraging and concise. Use markdown."
        },
        {
          role: "user",
          content: `Workspace: ${workspaceSlug}\nIssues:\n${issueList}`
        }
      ],
      max_tokens: 500
    })

    return c.json({
      summary: response.choices[0].message.content
    })
  } catch (err) {
    console.error(err)
    return c.json({ error: 'AI summary failed' }, 500)
  }
})

aiRoutes.post('/search', authMiddleware, async (c) => {
  const { OPENAI_API_KEY } = env<{ OPENAI_API_KEY: string }>(c)
  const { query, workspaceSlug } = await c.req.json()

  if (!OPENAI_API_KEY) {
    // Basic fuzzy search fallback if no AI key
    const issues = await prisma.issue.findMany({
      where: {
        workspace: { slug: workspaceSlug },
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { identifier: { contains: query, mode: 'insensitive' } }
        ]
      },
      include: { status: true }
    })
    return c.json({ issues })
  }

  const openai = new OpenAI({ apiKey: OPENAI_API_KEY })

  try {
    // AI determines intent and returns a Prisma-like filter object or keywords
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a search assistant for a project management app. Translate the user's natural language query into a set of search keywords and filters. Return ONLY a JSON object with 'keywords' (array), 'priority' (optional string), and 'status' (optional string)."
        },
        {
          role: "user",
          content: `Query: ${query}`
        }
      ],
      response_format: { type: "json_object" }
    })

    const filter = JSON.parse(response.choices[0].message.content as string)
    
    // Execute search based on AI intent
    const issues = await prisma.issue.findMany({
      where: {
        workspace: { slug: workspaceSlug },
        AND: [
          filter.keywords?.length ? {
            OR: filter.keywords.map((k: string) => ({
              OR: [
                { title: { contains: k, mode: 'insensitive' } },
                { description: { contains: k, mode: 'insensitive' } }
              ]
            }))
          } : {},
          filter.priority ? { priority: filter.priority } : {},
          filter.status ? { status: { name: { contains: filter.status, mode: 'insensitive' } } } : {}
        ]
      },
      include: { status: true }
    })

    return c.json({ issues })
  } catch (err) {
    console.error(err)
    return c.json({ error: 'Smart search failed' }, 500)
  }
})

export default aiRoutes
