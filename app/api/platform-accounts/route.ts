import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET /api/platform-accounts — list all with filters
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const product = searchParams.get('product')
  const status = searchParams.get('status')

  let query = supabaseAdmin
    .from('platform_accounts')
    .select('*, products!inner(name)')
    .order('product_id')
    .order('priority')

  if (product) query = query.eq('product_id', product)
  if (status && status !== 'all') query = query.eq('status', status)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// PATCH /api/platform-accounts — update account status, credentials, etc.
export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { id, ...updates } = body

  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const allowed = ['status', 'username', 'email_used', 'password_encrypted', 'display_name',
    'bio', 'profile_url', 'website_field', 'has_2fa', 'priority', 'notes',
    'followers_goal', 'api_key', 'api_secret']

  const update: Record<string, unknown> = {}
  for (const key of allowed) {
    if (updates[key] !== undefined) update[key] = updates[key]
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'No valid fields' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('platform_accounts')
    .update(update)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, account: data })
}
