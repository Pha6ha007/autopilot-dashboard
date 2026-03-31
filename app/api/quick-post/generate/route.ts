import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSizeLimit, type ContentSize } from '@/lib/content-size'

const PLATFORM_GUIDELINES: Record<string, string> = {
  linkedin: 'Professional tone. Up to 3000 chars. 3-5 hashtags at the end.',
  twitter: 'Max 280 chars. 2-3 hashtags. Punchy.',
  telegram: 'Casual tone. Emojis OK. HTML format (<b>, <i>). Link at end. Max 500 chars.',
  devto: 'Technical markdown. Developer-focused.',
  reddit: 'Conversational. No direct promo. Value-first.',
  instagram: 'Short punchy caption. Hashtags at end. Max 2200 chars.',
  facebook: 'Conversational. Question hooks.',
  hashnode: 'Technical blog style. Markdown.',
  medium: 'Thoughtful long-form.',
}

export async function POST(req: NextRequest) {
  try {
    const { product_id, platform, topic, content_size } = await req.json()

    if (!topic) return NextResponse.json({ error: 'topic required' }, { status: 400 })

    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'OPENROUTER_API_KEY not set' }, { status: 500 })

    const size: ContentSize = content_size || 'medium'
    const sizeLimit = getSizeLimit(platform || 'default', size)

    let productInfo = ''
    const { data: prod } = await supabaseAdmin.from('products').select('name, one_liner, tone, site').eq('id', product_id).maybeSingle()
    if (prod) productInfo = `Product: ${prod.name} — ${prod.one_liner}. Site: ${prod.site}. Tone: ${prod.tone}.`

    const { data: ctx } = await supabaseAdmin.from('product_contexts').select('positioning, target_audience, cta').eq('product_id', product_id).maybeSingle()
    if (ctx?.positioning) productInfo += ` Positioning: ${ctx.positioning}. Audience: ${ctx.target_audience || ''}. CTA: ${ctx.cta || ''}.`

    const model = (process.env.MODEL_SIMPLE || 'google/gemini-2.0-flash-001').trim()
    const guidelines = PLATFORM_GUIDELINES[platform] || 'Write an engaging post.'

    const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        max_tokens: 1024,
        messages: [
          { role: 'system', content: `You are a content writer. ${productInfo}\nPlatform: ${platform}. Guidelines: ${guidelines}\nContent length requirement: ${sizeLimit}. Write exactly within this range — do not write shorter or longer.\nWrite ONLY the post text. No JSON, no markdown fences.` },
          { role: 'user', content: `Write a post about: ${topic}` },
        ],
      }),
      signal: AbortSignal.timeout(30000),
    })

    if (!resp.ok) {
      const errText = await resp.text()
      return NextResponse.json({ error: `LLM ${resp.status}: ${errText.slice(0, 200)}` }, { status: 502 })
    }

    const data = await resp.json()
    const content = data.choices?.[0]?.message?.content?.trim() || ''

    if (!content) {
      return NextResponse.json({ error: 'Empty response from LLM' }, { status: 502 })
    }

    return NextResponse.json({ ok: true, content, model: data.model || model })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}
