import { Hono } from 'hono'
import { Webhook } from 'svix'
import { env } from 'hono/adapter'

const webhookRoutes = new Hono()

webhookRoutes.post('/clerk', async (c) => {
  const payload = await c.req.text()
  const headerPayload = c.req.header()
  
  const svix_id = headerPayload['svix-id']
  const svix_timestamp = headerPayload['svix-timestamp']
  const svix_signature = headerPayload['svix-signature']

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return c.json({ error: 'Missing svix headers' }, 400)
  }

  const { CLERK_WEBHOOK_SECRET } = env<{ CLERK_WEBHOOK_SECRET: string }>(c)

  if (!CLERK_WEBHOOK_SECRET) {
    return c.json({ error: 'Missing Webhook Secret' }, 500)
  }

  const wh = new Webhook(CLERK_WEBHOOK_SECRET)

  let evt: any
  try {
    evt = wh.verify(payload, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    })
  } catch (err) {
    return c.json({ error: 'Invalid signature' }, 400)
  }

  const { id } = evt.data
  const eventType = evt.type

  console.log(`Webhook received: ${eventType} with ID ${id}`)

  if (eventType === 'user.created' || eventType === 'user.updated') {
    const { email_addresses, first_name, last_name, image_url } = evt.data
    const email = email_addresses[0].email_address
    const name = `${first_name ?? ''} ${last_name ?? ''}`.trim() || 'User'
    
    // Here we would sync to Neon DB
    console.log(`Syncing user: ${email} (${name})`)
  }

  return c.json({ success: true })
})

export default webhookRoutes
