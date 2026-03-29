import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const TELEGRAM_OWNER_CHAT_ID = process.env.TELEGRAM_OWNER_CHAT_ID || '140079463'

// Platform metadata — status defaults
const MANUAL_ONLY = new Set(['producthunt', 'indiehackers', 'hackernews', 'tiktok'])

function platformStatus(platform: string, creds: Record<string, string>): 'ready' | 'needs_setup' | 'manual_only' {
  if (MANUAL_ONLY.has(platform)) return 'manual_only'
  const vals = Object.values(creds).filter(v => v && v.trim())
  return vals.length > 0 ? 'ready' : 'needs_setup'
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { product, platforms } = body

    // Validate required fields
    if (!product.name?.trim()) {
      return NextResponse.json({ error: 'Product name is required' }, { status: 400 })
    }
    if (!product.id?.trim()) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
    }

    // Build product row — extend existing schema non-destructively
    const productRow = {
      id:               product.id.toLowerCase().replace(/\s+/g, '-'),
      name:             product.name.trim(),
      site:             product.domain?.trim() || null,
      one_liner:        product.description?.trim() || null,
      tone:             product.tone || 'professional',
      cta_link:         product.domain ? `https://${product.domain.replace(/^https?:\/\//, '')}` : null,
      cta_text:         product.name,
      channels:         platforms.map((p: { platform: string }) => p.platform),
      active:           true,
      domain:           product.domain?.trim() || null,
      primary_language: product.primary_language || 'en',
      content_types:    product.content_types || 'both',
      frequency:        product.frequency || 'daily',
    }

    // Insert product
    const { error: productError } = await supabaseAdmin
      .from('products')
      .insert(productRow)

    if (productError) {
      if (productError.code === '23505') {
        return NextResponse.json({ error: `Product ID "${productRow.id}" already exists` }, { status: 409 })
      }
      return NextResponse.json({ error: productError.message }, { status: 500 })
    }

    // Insert platform rows
    const platformRows = platforms.map((p: { platform: string; credentials: Record<string, string>; subreddits?: string[] }) => ({
      product_id:  productRow.id,
      platform:    p.platform,
      status:      platformStatus(p.platform, p.credentials || {}),
      credentials: p.credentials || {},
      subreddits:  p.subreddits || [],
    }))

    if (platformRows.length > 0) {
      const { error: platformError } = await supabaseAdmin
        .from('product_platforms')
        .insert(platformRows)

      if (platformError) {
        // Rollback product
        await supabaseAdmin.from('products').delete().eq('id', productRow.id)
        return NextResponse.json({ error: platformError.message }, { status: 500 })
      }
    }

    // Count by status for notification
    const ready       = platformRows.filter((p: {status: string}) => p.status === 'ready').length
    const needsSetup  = platformRows.filter((p: {status: string}) => p.status === 'needs_setup').length
    const manualOnly  = platformRows.filter((p: {status: string}) => p.status === 'manual_only').length

    // Send Telegram notification
    if (TELEGRAM_BOT_TOKEN) {
      const msg = [
        `🚀 New product added: *${productRow.name}*`,
        `🌐 ${productRow.site || 'no domain'}`,
        ``,
        `✅ Ready: ${ready} platform${ready !== 1 ? 's' : ''}`,
        `⚙️ Needs setup: ${needsSetup}`,
        `✋ Manual only: ${manualOnly}`,
      ].join('\n')

      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id:    TELEGRAM_OWNER_CHAT_ID,
          text:       msg,
          parse_mode: 'Markdown',
        }),
      }).catch(() => {}) // non-fatal
    }

    return NextResponse.json({
      ok: true,
      product: productRow,
      platforms: platformRows,
      summary: { ready, needsSetup, manualOnly },
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
