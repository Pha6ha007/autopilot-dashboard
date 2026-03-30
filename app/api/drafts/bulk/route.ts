import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// POST /api/drafts/bulk — bulk approve/reject by topic or IDs
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { action, ids, topic, product_id } = body

  if (!action || !['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'action must be approve or reject' }, { status: 400 })
  }

  const update: Record<string, unknown> = {
    status: action === 'approve' ? 'approved' : 'rejected',
  }
  if (action === 'approve') update.approved_at = new Date().toISOString()
  if (action === 'reject' && body.reason) update.rejection_reason = body.reason

  let query = supabaseAdmin.from('generated_content').update(update)

  if (ids && Array.isArray(ids)) {
    query = query.in('id', ids)
  } else if (topic && product_id) {
    query = query.eq('topic', topic).eq('product_id', product_id).eq('status', 'draft')
  } else {
    return NextResponse.json({ error: 'Provide ids[] or topic+product_id' }, { status: 400 })
  }

  const { data, error, count } = await query.select()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, updated: data?.length || 0, items: data })
}
