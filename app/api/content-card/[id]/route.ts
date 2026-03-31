import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET /api/content-card/[id] — full content card data
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  // Try generated_content first, then content_queue
  let item = null
  let source: 'generated_content' | 'content_queue' = 'generated_content'

  const { data: gc } = await supabaseAdmin
    .from('generated_content')
    .select('*, products!inner(name, site, tone, auto_publish, channels)')
    .eq('id', id)
    .maybeSingle()

  if (gc) {
    item = gc
  } else {
    const { data: cq } = await supabaseAdmin
      .from('content_queue')
      .select('*, products!inner(name, site, tone, auto_publish, channels)')
      .eq('id', id)
      .maybeSingle()
    if (cq) {
      item = cq
      source = 'content_queue'
    }
  }

  if (!item) {
    return NextResponse.json({ error: 'Content not found' }, { status: 404 })
  }

  // Get product context
  const { data: context } = await supabaseAdmin
    .from('product_contexts')
    .select('*')
    .eq('product_id', item.product_id)
    .maybeSingle()

  // Get versions
  const { data: versions } = await supabaseAdmin
    .from('content_versions')
    .select('*')
    .eq('content_id', id)
    .order('version_number', { ascending: false })
    .limit(10)

  // Get media
  const { data: media } = await supabaseAdmin
    .from('content_media')
    .select('*')
    .eq('content_id', id)
    .order('created_at', { ascending: false })

  return NextResponse.json({
    item,
    source,
    context,
    versions: versions || [],
    media: media || [],
  })
}

// PATCH /api/content-card/[id] — update content, status, etc.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json()

  // Determine source table
  const { data: gc } = await supabaseAdmin
    .from('generated_content')
    .select('id, content, status')
    .eq('id', id)
    .maybeSingle()

  const table = gc ? 'generated_content' : 'content_queue'

  // If editing content, save version first
  if (body.content && gc) {
    const { data: latestVersion } = await supabaseAdmin
      .from('content_versions')
      .select('version_number')
      .eq('content_id', id)
      .order('version_number', { ascending: false })
      .limit(1)
      .maybeSingle()

    const nextVersion = (latestVersion?.version_number || 0) + 1

    await supabaseAdmin.from('content_versions').insert({
      content_id: id,
      version_number: nextVersion,
      content: gc.content, // save OLD content as version
      created_by: body.created_by || 'user',
    })
  }

  // Build update
  const allowed = ['content', 'status', 'publish_url', 'published_at', 'image_url', 'image_type']
  const update: Record<string, unknown> = {}
  for (const key of allowed) {
    if (body[key] !== undefined) update[key] = body[key]
  }

  if (body.status === 'approved') update.approved_at = new Date().toISOString()
  if (body.status === 'published') update.published_at = new Date().toISOString()

  const { data, error } = await supabaseAdmin
    .from(table)
    .update(update)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, item: data })
}
