import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET /api/search?q=query — search across content, products, topics
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim()
  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] })
  }

  const pattern = `%${q}%`

  const [{ data: drafts }, { data: plans }, { data: pubs }, { data: products }] = await Promise.all([
    supabaseAdmin
      .from('generated_content')
      .select('id, product_id, platform, topic, content, status, created_at')
      .or(`topic.ilike.${pattern},content.ilike.${pattern}`)
      .order('created_at', { ascending: false })
      .limit(10),
    supabaseAdmin
      .from('content_plan')
      .select('id, product_id, topic, type, status, scheduled_for')
      .ilike('topic', pattern)
      .order('scheduled_for', { ascending: false })
      .limit(5),
    supabaseAdmin
      .from('publications')
      .select('id, product_id, platform, title, status, published_at')
      .or(`title.ilike.${pattern},topic.ilike.${pattern}`)
      .order('created_at', { ascending: false })
      .limit(5),
    supabaseAdmin
      .from('products')
      .select('id, name, one_liner')
      .or(`name.ilike.${pattern},one_liner.ilike.${pattern}`)
      .limit(5),
  ])

  const results = [
    ...(products || []).map(p => ({ type: 'product' as const, id: p.id, title: p.name, subtitle: p.one_liner, href: `/products/${p.id}` })),
    ...(drafts || []).map(d => ({ type: 'draft' as const, id: d.id, title: d.topic || d.content.slice(0, 60), subtitle: `${d.platform} · ${d.status}`, href: `/content/${d.id}` })),
    ...(plans || []).map(p => ({ type: 'plan' as const, id: String(p.id), title: p.topic, subtitle: `${p.type} · ${p.status} · ${p.scheduled_for}`, href: `/content` })),
    ...(pubs || []).map(p => ({ type: 'published' as const, id: String(p.id), title: p.title, subtitle: `${p.platform} · published`, href: '#' })),
  ]

  return NextResponse.json({ results, query: q })
}
