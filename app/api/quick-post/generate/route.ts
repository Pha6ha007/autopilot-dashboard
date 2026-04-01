import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSizeLimit, type ContentSize } from '@/lib/content-size'
import { FORMAT_RULES, PLATFORM_GUIDELINES } from '@/lib/format-rules'
import { selectModel, callLLM } from '@/lib/llm'

export async function POST(req: NextRequest) {
  try {
    const { product_id, platform, topic, content_size } = await req.json()

    if (!topic) return NextResponse.json({ error: 'topic required' }, { status: 400 })

    const size: ContentSize = content_size || 'medium'
    const sizeLimit = getSizeLimit(platform || 'default', size)

    let productInfo = ''
    const { data: prod } = await supabaseAdmin.from('products').select('name, one_liner, tone, site').eq('id', product_id).maybeSingle()
    if (prod) productInfo = `Product: ${prod.name} — ${prod.one_liner}. Site: ${prod.site}. Tone: ${prod.tone}.`

    const { data: ctx } = await supabaseAdmin.from('product_contexts').select('positioning, target_audience, cta').eq('product_id', product_id).maybeSingle()
    if (ctx?.positioning) productInfo += ` Positioning: ${ctx.positioning}. Audience: ${ctx.target_audience || ''}. CTA: ${ctx.cta || ''}.`

    const model = selectModel('social-post', platform)
    const guidelines = PLATFORM_GUIDELINES[platform] || 'Write an engaging post.'

    const result = await callLLM({
      model,
      maxTokens: 1024,
      messages: [
        { role: 'system', content: `You are a content writer. ${productInfo}\nPlatform: ${platform}. Guidelines: ${guidelines}\nContent length requirement: ${sizeLimit}. Write exactly within this range — do not write shorter or longer.\n\n${FORMAT_RULES}\n\nWrite ONLY the post text. No JSON, no markdown fences.` },
        { role: 'user', content: `Write a post about: ${topic}` },
      ],
      trace: {
        name: 'quick-post-generate',
        userId: product_id,
        sessionId: platform,
        tags: [platform, product_id, `size:${size}`],
        metadata: { topic, contentSize: size },
      },
    })

    return NextResponse.json({ ok: true, content: result.content, model: result.model })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}
