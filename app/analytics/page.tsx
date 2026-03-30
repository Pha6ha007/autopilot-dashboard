import { supabaseAdmin } from '@/lib/supabase'
import { AnalyticsClient } from '@/components/AnalyticsClient'

export const revalidate = 30

export default async function AnalyticsPage() {
  const [{ data: metrics }, { data: products }, { data: publications }] = await Promise.all([
    supabaseAdmin
      .from('content_metrics')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200),
    supabaseAdmin
      .from('products')
      .select('id, name')
      .eq('archived', false)
      .order('name'),
    supabaseAdmin
      .from('publications')
      .select('id, product_id, platform, title, status, created_at, published_at')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(100),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-gray-900 text-3xl">Analytics</h1>
        <p className="text-gray-500 text-sm mt-1">Content performance across products and platforms</p>
      </div>
      <AnalyticsClient
        metrics={metrics || []}
        products={(products || []).map(p => ({ id: p.id, name: p.name }))}
        publications={publications || []}
      />
    </div>
  )
}
