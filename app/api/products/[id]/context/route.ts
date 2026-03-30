import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET /api/products/[id]/context — fetch product context
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { data, error } = await supabaseAdmin
    .from('product_contexts')
    .select('*')
    .eq('product_id', id)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// PUT /api/products/[id]/context — upsert product context
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json()

  const row = {
    product_id: id,
    positioning: body.positioning || null,
    target_audience: body.target_audience || null,
    pain_points: body.pain_points || null,
    key_features: body.key_features || [],
    tone_per_platform: body.tone_per_platform || {},
    competitors: body.competitors || null,
    differentiators: body.differentiators || null,
    cta: body.cta || null,
    website_url: body.website_url || null,
    github_repo: body.github_repo || null,
    raw_scrape: body.raw_scrape || null,
  }

  const { data, error } = await supabaseAdmin
    .from('product_contexts')
    .upsert(row, { onConflict: 'product_id' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, context: data })
}
