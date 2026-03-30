import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET /api/drafts — list generated content with filters
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') // draft, approved, rejected, published, all
  const product = searchParams.get('product')
  const platform = searchParams.get('platform')
  const limit = parseInt(searchParams.get('limit') || '50')

  let query = supabaseAdmin
    .from('generated_content')
    .select('*, products!inner(name, channels)')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (status && status !== 'all') {
    query = query.eq('status', status)
  }
  if (product) {
    query = query.eq('product_id', product)
  }
  if (platform) {
    query = query.eq('platform', platform)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
