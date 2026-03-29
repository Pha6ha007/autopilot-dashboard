import { supabase, ProductStats } from '@/lib/supabase'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

const PLATFORM_ICONS: Record<string, string> = {
  youtube: '▶',
  telegram: '✈',
  linkedin: 'in',
  twitter: 'X',
  instagram: '◈',
  tiktok: '♪',
  devto: '{ }',
  hashnode: '#',
  medium: 'M',
  buffer: '⊡',
  facebook: 'f',
  reddit: '◉',
}

const STATUS_DOT: Record<string, string> = {
  published: 'bg-emerald-500',
  scheduled: 'bg-blue-500',
  generating: 'bg-yellow-500',
  failed: 'bg-red-500',
  skipped: 'bg-gray-500',
}

export const revalidate = 60

export default async function DashboardPage() {
  const { data: stats } = await supabase
    .from('products')
    .select('*')
    .eq('active', true)
    .order('name')

  const { data: recentPubs } = await supabase
    .from('publications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10)

  const { data: workflows } = await supabase
    .from('workflow_runs')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(5)

  const productStats = (stats || []) as any[]

  const totalPublished = 0
  const totalErrors = 0
  const totalScheduled = 0
  const publishedThisWeek = 0

  return (
    <div className="space-y-8">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Command Center</h1>
        <p className="text-gray-400 text-sm mt-1">All products · real-time</p>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total published', value: totalPublished, color: 'text-emerald-400' },
          { label: 'This week', value: publishedThisWeek, color: 'text-blue-400' },
          { label: 'Scheduled', value: totalScheduled, color: 'text-yellow-400' },
          { label: 'Errors', value: totalErrors, color: 'text-red-400' },
        ].map((s) => (
          <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-gray-500 text-xs uppercase tracking-wide">{s.label}</p>
            <p className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Products grid */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Products</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {productStats.map((product) => (
            <Link
              key={product.id}
              href={`/products/${product.id}`}
              className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-indigo-500/50 hover:bg-gray-900/80 transition-all group"
            >
              {/* Product header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-white group-hover:text-indigo-400 transition-colors">
                    {product.name}
                  </h3>
                  {product.site && (
                    <p className="text-gray-500 text-xs mt-0.5">{product.site}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 bg-emerald-500/10 text-emerald-400 text-xs px-2 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>
                  active
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-1 gap-2 mb-4">
                <div className="text-center">
                  <p className="text-sm text-gray-400">{product.one_liner}</p>
                </div>
              </div>

              {/* Channels */}
              <div className="flex flex-wrap gap-1.5">
                {(product.channels || []).map((ch: string) => (
                  <span key={ch} className="bg-gray-800 text-gray-400 text-xs px-2 py-0.5 rounded">
                    {PLATFORM_ICONS[ch] || ch} {ch}
                  </span>
                ))}
              </div>

              {/* Last published */}
              {product.site && (
                <p className="text-gray-600 text-xs mt-3">
                  {product.site}
                </p>
              )}
            </Link>
          ))}
        </div>
      </div>

      {/* Bottom row: recent publications + workflows */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Recent publications */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-base font-semibold text-white mb-4">Recent Publications</h2>
          <div className="space-y-2">
            {(recentPubs || []).length === 0 && (
              <p className="text-gray-500 text-sm text-center py-8">No publications yet</p>
            )}
            {(recentPubs || []).map((pub: any) => (
              <div key={pub.id} className="flex items-center gap-3 py-2 border-b border-gray-800/50 last:border-0">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_DOT[pub.status] || 'bg-gray-500'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-200 truncate">{pub.topic}</p>
                  <p className="text-xs text-gray-500">{pub.product_id} · {pub.platform}</p>
                </div>
                {pub.publish_url && (
                  <a href={pub.publish_url} target="_blank" rel="noopener noreferrer"
                    className="text-gray-500 hover:text-indigo-400 text-xs flex-shrink-0">
                    ↗
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Workflow runs */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-base font-semibold text-white mb-4">Workflow Runs</h2>
          <div className="space-y-2">
            {(workflows || []).length === 0 && (
              <p className="text-gray-500 text-sm text-center py-8">No workflow runs yet</p>
            )}
            {(workflows || []).map((run: any) => (
              <div key={run.id} className="flex items-center gap-3 py-2 border-b border-gray-800/50 last:border-0">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  run.status === 'success' ? 'bg-emerald-500' :
                  run.status === 'failed' ? 'bg-red-500' : 'bg-yellow-500'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-200">{run.workflow_name || run.workflow_id}</p>
                  <p className="text-xs text-gray-500">
                    {run.product_id || 'all'} ·
                    {run.duration_ms ? ` ${(run.duration_ms / 1000).toFixed(1)}s` : ''}
                  </p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                  run.status === 'success' ? 'bg-emerald-500/10 text-emerald-400' :
                  run.status === 'failed' ? 'bg-red-500/10 text-red-400' :
                  'bg-yellow-500/10 text-yellow-400'
                }`}>
                  {run.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
