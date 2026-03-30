import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET /api/metrics — list metrics with filters
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const product = searchParams.get('product')
  const platform = searchParams.get('platform')

  let query = supabaseAdmin
    .from('content_metrics')
    .select('*, publications!inner(title, created_at)')
    .order('created_at', { ascending: false })
    .limit(100)

  if (product) query = query.eq('product_id', product)
  if (platform) query = query.eq('platform', platform)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST /api/metrics — add or update metrics for a publication
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { publication_id, product_id, platform, views, likes, comments, shares, clicks, impressions } = body

  if (!product_id || !platform) {
    return NextResponse.json({ error: 'product_id and platform required' }, { status: 400 })
  }

  const engagement_rate = impressions > 0
    ? Math.round(((likes || 0) + (comments || 0) + (shares || 0)) / impressions * 10000) / 100
    : 0

  const { data, error } = await supabaseAdmin
    .from('content_metrics')
    .insert({
      publication_id: publication_id || null,
      product_id,
      platform,
      views: views || 0,
      likes: likes || 0,
      comments: comments || 0,
      shares: shares || 0,
      clicks: clicks || 0,
      impressions: impressions || 0,
      engagement_rate,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, metric: data })
}
