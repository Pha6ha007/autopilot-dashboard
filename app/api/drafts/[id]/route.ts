import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// PATCH /api/drafts/[id] — update draft (edit content, approve, reject)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json()

  // Validate status transitions
  const validStatuses = ['draft', 'approved', 'rejected', 'published', 'failed', 'regenerating']
  if (body.status && !validStatuses.includes(body.status)) {
    return NextResponse.json({ error: `Invalid status: ${body.status}` }, { status: 400 })
  }

  // Build update object
  const update: Record<string, unknown> = {}

  if (body.content !== undefined) {
    // Track edit history
    const { data: current } = await supabaseAdmin
      .from('generated_content')
      .select('content, edit_history')
      .eq('id', id)
      .single()

    if (current && body.content !== current.content) {
      const history = Array.isArray(current.edit_history) ? current.edit_history : []
      history.push({
        edited_at: new Date().toISOString(),
        previous_content: current.content,
      })
      update.edit_history = history
    }
    update.content = body.content
  }

  if (body.status) {
    update.status = body.status
    if (body.status === 'approved') update.approved_at = new Date().toISOString()
    if (body.status === 'published') update.published_at = new Date().toISOString()
  }

  if (body.rejection_reason !== undefined) update.rejection_reason = body.rejection_reason
  if (body.publish_url !== undefined) update.publish_url = body.publish_url

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('generated_content')
    .update(update)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, draft: data })
}

// DELETE /api/drafts/[id] — delete a draft
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { error } = await supabaseAdmin
    .from('generated_content')
    .delete()
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
