import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// POST /api/platform-accounts/add — add a new platform account to a product
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { product_id, platform, username, email_used, chat_id, notes } = body

  if (!product_id || !platform) {
    return NextResponse.json({ error: 'product_id and platform required' }, { status: 400 })
  }

  // Check if already exists
  const { data: existing } = await supabaseAdmin
    .from('platform_accounts')
    .select('id')
    .eq('product_id', product_id)
    .eq('platform', platform)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'Platform already exists for this product' }, { status: 409 })
  }

  const { data, error } = await supabaseAdmin
    .from('platform_accounts')
    .insert({
      product_id,
      platform,
      username: username || null,
      email_used: email_used || null,
      chat_id: chat_id || null,
      notes: notes || null,
      status: 'not_started',
      priority: 'medium',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, account: data })
}
