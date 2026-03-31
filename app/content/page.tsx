import { supabaseAdmin } from '@/lib/supabase'
import { ContentWorkspace } from '@/components/ContentWorkspace'

export const revalidate = 10

export default async function ContentPage() {
  const [
    { data: drafts },
    { data: plan },
    { data: queue },
    { data: published },
    { data: products },
  ] = await Promise.all([
    supabaseAdmin
      .from('generated_content')
      .select('*, products!inner(name)')
      .in('status', ['draft', 'approved', 'rejected'])
      .order('created_at', { ascending: false })
      .limit(100),
    supabaseAdmin
      .from('content_plan')
      .select('*, products!inner(name)')
      .gte('scheduled_for', new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0])
      .order('scheduled_for')
      .limit(100),
    supabaseAdmin
      .from('content_queue')
      .select('*, products!inner(name)')
      .in('status', ['pending', 'approved'])
      .order('created_at', { ascending: false })
      .limit(50),
    supabaseAdmin
      .from('publications')
      .select('*')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(30),
    supabaseAdmin
      .from('products')
      .select('id, name')
      .eq('archived', false)
      .order('name'),
  ])

  return (
    <ContentWorkspace
      drafts={drafts || []}
      plan={plan || []}
      queue={queue || []}
      published={published || []}
      products={(products || []).map(p => ({ id: p.id, name: p.name }))}
    />
  )
}
