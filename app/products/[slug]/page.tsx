import { supabaseAdmin as supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { formatDistanceToNow, format } from 'date-fns'

export const revalidate = 30

const PLATFORM_ICONS: Record<string, string> = {
  youtube: '▶', telegram: '✈', linkedin: 'in', twitter: 'X',
  instagram: '◈', tiktok: '♪', devto: '{}', hashnode: '#',
  medium: 'M', buffer: '⊡', facebook: 'f', reddit: '◉',
}

const STATUS_COLOR: Record<string, string> = {
  published: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  scheduled:  'bg-blue-500/10 text-blue-400 border-blue-500/20',
  generating: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  failed:     'bg-red-500/10 text-red-400 border-red-500/20',
  skipped:    'bg-gray-500/10 text-gray-400 border-gray-500/20',
  draft:      'bg-gray-500/10 text-gray-400 border-gray-500/20',
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const [{ data: product }, { data: publications }, { data: plan }, { data: platformStats }] =
    await Promise.all([
      supabase.from('products').select('*').eq('id', slug).single(),
      supabase.from('publications').select('*').eq('product_id', slug)
        .order('created_at', { ascending: false }).limit(20),
      supabase.from('content_plan').select('*').eq('product_id', slug)
        .gte('scheduled_for', new Date().toISOString().split('T')[0])
        .order('scheduled_for').limit(10),
      supabase.from('platform_stats').select('*').eq('product_id', slug),
    ])

  if (!product) notFound()

  // Aggregate stats from publications
  const pubs = publications || []
  const s = {
    total_published: pubs.filter((p: any) => p.status === 'published').length,
    published_last_30d: pubs.filter((p: any) => p.status === 'published' && new Date(p.published_at) > new Date(Date.now() - 30 * 86400000)).length,
    published_last_7d: pubs.filter((p: any) => p.status === 'published' && new Date(p.published_at) > new Date(Date.now() - 7 * 86400000)).length,
    total_errors: pubs.filter((p: any) => p.status === 'failed').length,
  }

  return (
    <div className="space-y-8">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/" className="hover:text-white transition-colors">Dashboard</Link>
        <span>›</span>
        <span className="text-white">{product.name}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{product.name}</h1>
          {product.site && (
            <a href={`https://${product.site}`} target="_blank" rel="noopener noreferrer"
              className="text-indigo-400 text-sm hover:underline mt-1 inline-block">
              {product.site} ↗
            </a>
          )}
          {product.one_liner && (
            <p className="text-gray-400 text-sm mt-2 max-w-xl">{product.one_liner}</p>
          )}
        </div>
        {product.cta_link && (
          <a href={product.cta_link} target="_blank" rel="noopener noreferrer"
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-4 py-2 rounded-lg transition-colors">
            {product.cta_text || 'Visit →'}
          </a>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total published', value: s.total_published, color: 'text-white' },
          { label: 'Last 30 days', value: s.published_last_30d, color: 'text-blue-400' },
          { label: 'This week', value: s.published_last_7d, color: 'text-emerald-400' },
          { label: 'Errors', value: s.total_errors, color: 'text-red-400' },
        ].map((st) => (
          <div key={st.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-gray-500 text-xs uppercase tracking-wide">{st.label}</p>
            <p className={`text-3xl font-bold mt-1 ${st.color}`}>{st.value}</p>
          </div>
        ))}
      </div>

      {/* Platforms */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h2 className="text-base font-semibold text-white mb-4">Platforms</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {(product.channels || []).map((ch: string) => {
            const ps = (platformStats || []).find((p: any) => p.platform === ch)
            return (
              <div key={ch} className="bg-gray-800/50 rounded-lg p-3 text-center">
                <div className="text-2xl mb-1">{PLATFORM_ICONS[ch] || '●'}</div>
                <p className="text-gray-300 text-sm font-medium capitalize">{ch}</p>
                <p className="text-emerald-400 text-lg font-bold">{ps?.published_count || 0}</p>
                <p className="text-gray-500 text-xs">published</p>
                {ps?.failed_count > 0 && (
                  <p className="text-red-400 text-xs mt-1">{ps.failed_count} failed</p>
                )}
                {ps?.last_published_at && (
                  <p className="text-gray-600 text-xs mt-1">
                    {formatDistanceToNow(new Date(ps.last_published_at), { addSuffix: true })}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Content plan + Publications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Upcoming content plan */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-base font-semibold text-white mb-4">Content Plan — Upcoming</h2>
          <div className="space-y-2">
            {(plan || []).length === 0 && (
              <p className="text-gray-500 text-sm text-center py-8">No scheduled content</p>
            )}
            {(plan || []).map((item: any) => (
              <div key={item.id} className="flex items-start gap-3 py-2.5 border-b border-gray-800/50 last:border-0">
                <div className="flex-shrink-0 text-center min-w-[40px]">
                  <p className="text-white font-bold text-sm">{format(new Date(item.scheduled_for), 'dd')}</p>
                  <p className="text-gray-500 text-xs">{format(new Date(item.scheduled_for), 'MMM')}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-200 text-sm truncate">{item.topic}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-1.5 py-0.5 rounded border ${STATUS_COLOR[item.status] || STATUS_COLOR.draft}`}>
                      {item.status}
                    </span>
                    <span className="text-gray-500 text-xs">{item.type}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent publications */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-base font-semibold text-white mb-4">Recent Publications</h2>
          <div className="space-y-2">
            {(publications || []).length === 0 && (
              <p className="text-gray-500 text-sm text-center py-8">No publications yet</p>
            )}
            {(publications || []).map((pub: any) => (
              <div key={pub.id} className="flex items-start gap-3 py-2.5 border-b border-gray-800/50 last:border-0">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${
                  pub.status === 'published' ? 'bg-emerald-500' :
                  pub.status === 'failed' ? 'bg-red-500' : 'bg-gray-500'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-gray-200 text-sm truncate">{pub.topic}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-gray-500 text-xs capitalize">{pub.platform}</span>
                    <span className="text-gray-600 text-xs">·</span>
                    <span className="text-gray-500 text-xs">{pub.type}</span>
                    {pub.published_at && (
                      <>
                        <span className="text-gray-600 text-xs">·</span>
                        <span className="text-gray-600 text-xs">
                          {formatDistanceToNow(new Date(pub.published_at), { addSuffix: true })}
                        </span>
                      </>
                    )}
                  </div>
                  {pub.error_details && (
                    <p className="text-red-400 text-xs mt-1 truncate">{pub.error_details}</p>
                  )}
                </div>
                {pub.publish_url && (
                  <a href={pub.publish_url} target="_blank" rel="noopener noreferrer"
                    className="text-gray-500 hover:text-indigo-400 flex-shrink-0">
                    <span className="text-sm">↗</span>
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  )
}
