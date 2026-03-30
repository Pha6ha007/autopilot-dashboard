import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET /api/tone-examples?product_id=x&platform=y
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const product_id = searchParams.get('product_id')
  const platform = searchParams.get('platform')

  let query = supabaseAdmin.from('tone_examples').select('*').order('created_at', { ascending: false })
  if (product_id) query = query.eq('product_id', product_id)
  if (platform) query = query.eq('platform', platform)

  const { data, error } = await query.limit(50)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST /api/tone-examples — add example
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { product_id, platform, content, is_good, notes } = body

  if (!product_id || !platform || !content) {
    return NextResponse.json({ error: 'product_id, platform, content required' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('tone_examples')
    .insert({ product_id, platform, content, is_good: is_good !== false, notes })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, example: data })
}

// DELETE /api/tone-examples
export async function DELETE(req: NextRequest) {
  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const { error } = await supabaseAdmin.from('tone_examples').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
