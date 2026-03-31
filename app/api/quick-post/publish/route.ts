import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { product_id, platform, content, topic, image_url, chat_id, channel_username } = await req.json()

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
          // Convert base64 to Blob and send via native FormData
          const b64 = image_url.split(',')[1]
          const binary = Uint8Array.from(atob(b64), c => c.charCodeAt(0))
          const blob = new Blob([binary], { type: 'image/png' })

          const form = new FormData()
          form.append('chat_id', chat_id)
          form.append('caption', content)
          form.append('parse_mode', 'HTML')
          form.append('photo', blob, 'image.png')

          resp = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
            method: 'POST',
            body: form,
          })
        } else {
          // Text only
          resp = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id, text: content, parse_mode: 'HTML' }),
          })
        }

        if (resp.ok) {
          const d = await resp.json()
          externalId = String(d.result?.message_id || '')
          // Construct publish_url for channels: https://t.me/{username}/{message_id}
          if (externalId && channel_username) {
            const username = channel_username.replace(/^@/, '')
            publishUrl = `https://t.me/${username}/${externalId}`
          }
        } else {
          const errText = await resp.text()
          return NextResponse.json({ error: `Telegram error: ${errText.slice(0, 200)}` }, { status: 502 })
        }
      } catch (e: unknown) {
        return NextResponse.json({ error: `Telegram failed: ${e instanceof Error ? e.message : String(e)}` }, { status: 502 })
      }
    }

    // For non-telegram platforms — just log (no API publishing yet)
    if (platform !== 'telegram') {
      // Save as published anyway
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

    return NextResponse.json({ ok: true, external_id: externalId, publish_url: publishUrl || null, platform })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}
