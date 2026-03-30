import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// POST /api/drafts/[id]/regenerate — regenerate content via LLM
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const instructions = body.instructions || '' // optional: "make it shorter", "more technical"

  const apiKey = process.env.OPENROUTER_API_KEY
  const model = process.env.MODEL_COMPLEX || 'minimax/minimax-m2.5'
  if (!apiKey) return NextResponse.json({ error: 'OPENROUTER_API_KEY not configured' }, { status: 500 })

  // Get current draft + product context
  const { data: draft, error: draftErr } = await supabaseAdmin
    .from('generated_content')
    .select('*, products!inner(name, one_liner, tone, site)')
    .eq('id', id)
    .single()

  if (draftErr || !draft) {
    return NextResponse.json({ error: 'Draft not found' }, { status: 404 })
  }

  // Get product context
  const { data: context } = await supabaseAdmin
    .from('product_contexts')
    .select('*')
    .eq('product_id', draft.product_id)
    .maybeSingle()

  // Mark as regenerating
  await supabaseAdmin
    .from('generated_content')
    .update({ status: 'regenerating' })
    .eq('id', id)

  // Build prompt
  const platformGuidelines: Record<string, string> = {
    twitter: 'Max 280 chars. Punchy, 1-2 hashtags. Include URL.',
    linkedin: 'Max 1500 chars. Professional thought-leadership. Include URL.',
    telegram: 'Max 500 chars. HTML format (<b>, <i>, <a>). Include URL.',
    devto: 'Max 800 chars. Developer-focused, technical but accessible.',
    reddit: 'Max 500 chars. Conversational, value-first, no self-promo feel.',
    instagram: 'Max 2200 chars. Engaging story angle. Hashtags at end. Mention link in bio.',
    medium: 'Max 1000 chars. Thoughtful, long-form style excerpt.',
    hashnode: 'Max 800 chars. Developer community tone.',
    facebook: 'Max 500 chars. Casual, engaging. Include URL.',
  }

  const contextBlock = context ? `
Product: ${context.positioning || draft.products?.one_liner || ''}
Audience: ${context.target_audience || ''}
Pain points: ${context.pain_points || ''}
Key features: ${JSON.stringify(context.key_features || [])}
Differentiators: ${context.differentiators || ''}
CTA: ${context.cta || draft.products?.site || ''}` : `
Product: ${draft.products?.name} — ${draft.products?.one_liner || ''}
Site: ${draft.products?.site || ''}`

  const systemPrompt = `You are a social media content writer.
${contextBlock}

Platform: ${draft.platform}
Guidelines: ${platformGuidelines[draft.platform] || 'Write an engaging post.'}
Tone: ${draft.products?.tone || 'professional'}

${instructions ? `Special instructions: ${instructions}` : ''}

Write ONLY the post text. No JSON, no explanations, no markdown fences.`

  try {
    const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        max_tokens: 2048,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Topic: ${draft.topic}\n\nPrevious version (improve on this):\n${draft.content}` },
        ],
      }),
      signal: AbortSignal.timeout(60000),
    })

    if (!resp.ok) throw new Error(`OpenRouter ${resp.status}`)
    const data = await resp.json()
    const newContent = data.choices?.[0]?.message?.content?.trim() || ''

    if (!newContent) throw new Error('Empty response from LLM')

    // Save edit history + new content
    const history = Array.isArray(draft.edit_history) ? draft.edit_history : []
    history.push({
      edited_at: new Date().toISOString(),
      previous_content: draft.content,
      regenerated: true,
      instructions: instructions || null,
    })

    const { data: updated, error: updateErr } = await supabaseAdmin
      .from('generated_content')
      .update({
        content: newContent,
        status: 'draft',
        edit_history: history,
        generation_model: model,
      })
      .eq('id', id)
      .select()
      .single()

    if (updateErr) throw updateErr

    return NextResponse.json({ ok: true, draft: updated })
  } catch (e: unknown) {
    // Revert status on failure
    await supabaseAdmin
      .from('generated_content')
      .update({ status: 'draft' })
      .eq('id', id)

    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: `Regeneration failed: ${msg}` }, { status: 500 })
  }
}
