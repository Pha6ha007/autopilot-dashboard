import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getPlatformType } from '@/lib/platform-types'

// POST /api/drafts/[id]/publish — move approved draft to content_queue for WF-10
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  // Get the draft
  const { data: draft, error: draftErr } = await supabaseAdmin
    .from('generated_content')
    .select('*, products!inner(name, auto_publish)')
    .eq('id', id)
    .single()

  if (draftErr || !draft) {
    return NextResponse.json({ error: 'Draft not found' }, { status: 404 })
  }

  if (draft.status !== 'approved') {
    return NextResponse.json({ error: 'Draft must be approved before publishing' }, { status: 400 })
  }

  // Determine if manual
  const tier = getPlatformType(draft.platform)
  const requiresManual = tier === 'manual'

  // Insert into content_queue
  const { error: queueErr } = await supabaseAdmin
    .from('content_queue')
    .insert({
      product_id: draft.product_id,
      platform: draft.platform,
      content: draft.content,
      status: 'approved', // already approved from drafts
      requires_manual: requiresManual,
      auto_published: false,
      scheduled_for: new Date().toISOString(),
    })

  if (queueErr) {
    return NextResponse.json({ error: queueErr.message }, { status: 500 })
  }

  // Update draft status to published
  await supabaseAdmin
    .from('generated_content')
    .update({ status: 'published' })
    .eq('id', id)

  return NextResponse.json({ ok: true, queued: true, platform: draft.platform })
}
