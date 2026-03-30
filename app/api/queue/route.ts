import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET /api/queue?status=pending|approved|published&product_id=x&platform=x
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const status     = searchParams.get('status')
  const product_id = searchParams.get('product_id')
  const platform   = searchParams.get('platform')

  let query = supabaseAdmin
    .from('content_queue')
    .select('*, products(id,name,channels,auto_publish)')
    .order('scheduled_for', { ascending: true })

  if (status)     query = query.eq('status', status)
  if (product_id) query = query.eq('product_id', product_id)
  if (platform)   query = query.eq('platform', platform)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// PATCH /api/queue  { id, status, publish_url?, error? }
export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { id, status, publish_url, error: errMsg } = body

  if (!id || !status) {
    return NextResponse.json({ error: 'id and status required' }, { status: 400 })
  }

  const update: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  }
  if (status === 'published') update.published_at = new Date().toISOString()
  if (publish_url !== undefined) update.publish_url = publish_url
  if (errMsg !== undefined) update.error = errMsg

  const { data, error } = await supabaseAdmin
    .from('content_queue')
    .update(update)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, item: data })
}

// DELETE /api/queue?id=xxx  (reject)
export async function DELETE(req: NextRequest) {
  const id = new URL(req.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const { error } = await supabaseAdmin
    .from('content_queue')
    .update({ status: 'rejected', updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
