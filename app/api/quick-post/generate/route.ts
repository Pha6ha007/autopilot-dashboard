import { NextRequest, NextResponse } from 'next/server'
import { selectModel, callLLM } from '@/lib/llm'
import { supabaseAdmin } from '@/lib/supabase'

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
    const { product_id, platform, topic } = await req.json()

    if (!topic) return NextResponse.json({ error: 'topic required' }, { status: 400 })

    let productInfo = ''
    const { data: prod } = await supabaseAdmin.from('products').select('name, one_liner, tone, site').eq('id', product_id).maybeSingle()
    if (prod) productInfo = `Product: ${prod.name} — ${prod.one_liner}. Site: ${prod.site}. Tone: ${prod.tone}.`

    const { data: ctx } = await supabaseAdmin.from('product_contexts').select('positioning, target_audience, cta').eq('product_id', product_id).maybeSingle()
    if (ctx?.positioning) productInfo += ` Positioning: ${ctx.positioning}. Audience: ${ctx.target_audience || ''}. CTA: ${ctx.cta || ''}.`

    const model = selectModel('social-post', platform)
    const guidelines = PLATFORM_GUIDELINES[platform] || 'Write an engaging post.'

    const result = await callLLM({
      model,
      messages: [
        { role: 'system', content: `You are a content writer. ${productInfo}\nPlatform: ${platform}. Guidelines: ${guidelines}\nWrite ONLY the post text. No JSON, no markdown fences.` },
        { role: 'user', content: `Write a post about: ${topic}` },
      ],
    })

    return NextResponse.json({ ok: true, content: result.content, model: result.model })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
