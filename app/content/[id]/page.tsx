import { supabaseAdmin } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import { ContentCardClient } from '@/components/ContentCardClient'

export const revalidate = 10

export default async function ContentCardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  // Try generated_content first
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
    if (cq) { item = cq; source = 'content_queue' }
  }

  if (!item) notFound()

  const [{ data: context }, { data: versions }, { data: media }] = await Promise.all([
    supabaseAdmin.from('product_contexts').select('*').eq('product_id', item.product_id).maybeSingle(),
    supabaseAdmin.from('content_versions').select('*').eq('content_id', id).order('version_number', { ascending: false }).limit(10),
    supabaseAdmin.from('content_media').select('*').eq('content_id', id).order('created_at', { ascending: false }),
  ])

  return (
    <ContentCardClient
      item={item}
      source={source}
      context={context}
      versions={versions || []}
      media={media || []}
    />
  )
}
