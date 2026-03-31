import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// POST /api/quick-post/publish — publish directly to platform + log
export async function POST(req: NextRequest) {
  const { product_id, platform, content, topic, image_url, chat_id } = await req.json()

  if (!product_id || !platform || !content) {
    return NextResponse.json({ error: 'product_id, platform, content required' }, { status: 400 })
  }

  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
  let externalId = ''
  let publishUrl = ''

  // Publish to Telegram
  if (platform === 'telegram' && BOT_TOKEN && chat_id) {
    try {
      let resp
      if (image_url && image_url.startsWith('data:image')) {
        // Photo + caption via multipart
        const b64 = image_url.split(',')[1]
        const binary = Buffer.from(b64, 'base64')
        const FormData = (await import('form-data')).default
        const form = new FormData()
        form.append('chat_id', chat_id)
        form.append('caption', content)
        form.append('parse_mode', 'HTML')
        form.append('photo', binary, { filename: 'image.png', contentType: 'image/png' })
        resp = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
          method: 'POST',
          // @ts-expect-error form-data types
          body: form,
          headers: form.getHeaders(),
        })
      } else {
        resp = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id, text: content, parse_mode: 'HTML' }),
        })
      }

      if (resp.ok) {
        const d = await resp.json()
        externalId = String(d.result?.message_id || '')
      } else {
        const err = await resp.text()
        return NextResponse.json({ error: `Telegram error: ${err.slice(0, 200)}` }, { status: 502 })
      }
    } catch (e: unknown) {
      return NextResponse.json({ error: `Telegram failed: ${e instanceof Error ? e.message : String(e)}` }, { status: 502 })
    }
  }

  // Notify owner
  if (BOT_TOKEN && process.env.TELEGRAM_OWNER_CHAT_ID) {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: process.env.TELEGRAM_OWNER_CHAT_ID,
        text: `✅ Quick Post published!\n${product_id} → ${platform}\n${content.slice(0, 100)}`,
        disable_notification: true,
      }),
    }).catch(() => {})
  }

  // Save to generated_content
  await supabaseAdmin.from('generated_content').insert({
    product_id, platform, content, topic: topic || content.slice(0, 80),
    status: 'published', published_at: new Date().toISOString(),
    image_url: image_url || null, image_type: image_url ? 'ai' : null,
  })

  // Log to publications
  await supabaseAdmin.from('publications').insert({
    product_id, platform, type: 'post',
    topic: topic || content.slice(0, 80),
    content_preview: content.slice(0, 200),
    status: 'published',
    published_at: new Date().toISOString(),
    external_id: externalId || null,
    publish_url: publishUrl || null,
  })

  return NextResponse.json({ ok: true, external_id: externalId, platform })
}
