import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { selectModel, callLLM } from '@/lib/llm'
import { getSizeLimit, type ContentSize } from '@/lib/content-size'
import { FORMAT_RULES, PLATFORM_GUIDELINES as SHARED_GUIDELINES } from '@/lib/format-rules'

// POST /api/drafts/[id]/regenerate — regenerate content via LLM
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const instructions = body.instructions || ''
  const contentSize: ContentSize = body.content_size || 'medium'

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

  const contextBlock = context ? `
Product: ${context.positioning || draft.products?.one_liner || ''}
Audience: ${context.target_audience || ''}
Pain points: ${context.pain_points || ''}
Key features: ${JSON.stringify(context.key_features || [])}
Differentiators: ${context.differentiators || ''}
CTA: ${context.cta || draft.products?.site || ''}` : `
Product: ${draft.products?.name} — ${draft.products?.one_liner || ''}
Site: ${draft.products?.site || ''}`

  const sizeLimit = getSizeLimit(draft.platform, contentSize)

  const systemPrompt = `You are a social media content writer.
${contextBlock}

Platform: ${draft.platform}
Guidelines: ${SHARED_GUIDELINES[draft.platform] || 'Write an engaging post.'}
Tone: ${draft.products?.tone || 'professional'}
Content length requirement: ${sizeLimit}. Write exactly within this range — do not write shorter or longer.

${FORMAT_RULES}

${instructions ? `Special instructions: ${instructions}` : ''}

Write ONLY the post text. No JSON, no explanations, no markdown fences.`

  try {
    // Select model based on platform: short platforms → MODEL_SIMPLE, long → MODEL_COMPLEX
    const model = selectModel('regenerate', draft.platform)
    const result = await callLLM({
      model,
      maxTokens: 2048,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Topic: ${draft.topic}\n\nPrevious version (improve on this):\n${draft.content}` },
      ],
    })

    if (!result.content) throw new Error('Empty response from LLM')

    // Save edit history + new content
    const history = Array.isArray(draft.edit_history) ? draft.edit_history : []
    history.push({
      edited_at: new Date().toISOString(),
      previous_content: draft.content,
      regenerated: true,
      instructions: instructions || null,
      model: result.model,
    })

    const { data: updated, error: updateErr } = await supabaseAdmin
      .from('generated_content')
      .update({
        content: result.content,
        status: 'draft',
        edit_history: history,
        generation_model: result.model,
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
