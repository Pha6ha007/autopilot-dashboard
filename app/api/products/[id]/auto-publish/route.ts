import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// PATCH /api/products/[id]/auto-publish  { auto_publish: boolean }
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { auto_publish } = await req.json()

  if (typeof auto_publish !== 'boolean') {
    return NextResponse.json({ error: 'auto_publish must be boolean' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('products')
    .update({ auto_publish })
    .eq('id', id)
    .select('id,name,auto_publish')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, product: data })
}
