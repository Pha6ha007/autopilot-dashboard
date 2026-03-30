import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { product_id, topic, type, platforms, scheduled_for, notes, keywords } = body

  if (!product_id || !topic || !scheduled_for) {
    return NextResponse.json({ error: 'product_id, topic, scheduled_for required' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('content_plan')
    .insert({
      product_id,
      topic,
      type: type || 'post',
      platforms: platforms || [],
      scheduled_for,
      status: 'scheduled',
      notes: notes || null,
      keywords: keywords?.length ? keywords : null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, item: data })
}

export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { id, ...updates } = body

  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const allowed = ['scheduled_for', 'topic', 'type', 'platforms', 'status', 'notes', 'keywords']
  const update: Record<string, unknown> = {}
  for (const key of allowed) {
    if (updates[key] !== undefined) update[key] = updates[key]
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('content_plan')
    .update(update)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, item: data })
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const { error } = await supabaseAdmin
    .from('content_plan')
    .delete()
    .eq('id', id)
    .in('status', ['scheduled', 'draft']) // only delete non-published

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
