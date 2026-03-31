import { supabaseAdmin } from '@/lib/supabase'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { PlatformIcon } from '@/components/PlatformIcon'
import { RealtimeRefresher } from '@/components/RealtimeRefresher'
import { PublicationTrendChart } from '@/components/PublicationTrendChart'
import { PublicationRow } from '@/components/PublicationRow'

export const revalidate = 60

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  published: { label: 'published', cls: 'pill-green' },
  scheduled:  { label: 'scheduled', cls: 'pill-blue' },
  generating: { label: 'generating', cls: 'pill-yellow' },
  failed:     { label: 'failed', cls: 'pill-red' },
  skipped:    { label: 'skipped', cls: 'pill-gray' },
  success:    { label: 'success', cls: 'pill-green' },
  running:    { label: 'running', cls: 'pill-yellow' },
}

export default async function DashboardPage() {
  const [
    { data: products },
    { data: allPubs },
    { data: workflows },
    { data: scheduled },
    { data: openErrors },
    { data: pendingDrafts },
    { data: pendingQueue },
  ] = await Promise.all([
    supabaseAdmin.from('products').select('*').neq('archived', true).order('name'),
    supabaseAdmin.from('publications').select('id,product_id,platform,status,topic,publish_url,published_at,created_at').order('created_at', { ascending: false }).limit(50),
    supabaseAdmin.from('workflow_runs').select('*').order('started_at', { ascending: false }).limit(6),
    supabaseAdmin.from('content_plan').select('id').eq('status', 'scheduled'),
    supabaseAdmin.from('errors').select('id').eq('status', 'open'),
    supabaseAdmin.from('generated_content').select('id,product_id,platform,topic,created_at').eq('status', 'draft').order('created_at', { ascending: false }).limit(5),
    supabaseAdmin.from('content_queue').select('id,product_id,platform').eq('status', 'pending').limit(5),
  ])

  const pubs = allPubs || []
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const totalPublished = pubs.filter(p => p.status === 'published').length
  const publishedThisWeek = pubs.filter(p => p.status === 'published' && p.published_at && p.published_at > weekAgo).length
  const totalScheduled = (scheduled || []).length
  const totalErrors = (openErrors || []).length

  const recentPubs = pubs.slice(0, 8)

  // Build 14-day trend
  const trendMap: Record<string, number> = {}
  for (let i = 13; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000)
    trendMap[d.toISOString().split('T')[0]] = 0
  }
  for (const p of pubs) {
    if (p.status === 'published' && p.published_at) {
      const day = p.published_at.split('T')[0]
      if (day in trendMap) trendMap[day]++
    }
  }
  const trendData = Object.entries(trendMap).map(([date, count]) => ({
    date: date.slice(5), // MM-DD
    count,
  }))

  const statsCards = [
    { label: 'Total Published', value: totalPublished, sub: 'all time', gradient: 'from-emerald-400 to-teal-500', bg: 'from-emerald-50 to-teal-50' },
    { label: 'This Week', value: publishedThisWeek, sub: 'last 7 days', gradient: 'from-blue-400 to-indigo-500', bg: 'from-blue-50 to-indigo-50' },
    { label: 'Scheduled', value: totalScheduled, sub: 'upcoming', gradient: 'from-violet-400 to-purple-500', bg: 'from-violet-50 to-purple-50' },
    { label: 'Open Errors', value: totalErrors, sub: 'need attention', gradient: 'from-rose-400 to-red-500', bg: 'from-rose-50 to-red-50' },
  ]

  return (
    <div className="space-y-8">

      {/* Page header */}
      <div className="fade-up flex items-end justify-between">
        <div>
          <h1 className="font-display text-[28px] font-semibold text-gray-900 tracking-tight">Command Center</h1>
          <p className="text-gray-400 text-sm mt-1 flex items-center gap-2">
            All products ·&nbsp;<RealtimeRefresher />
          </p>
        </div>
        <div className="hidden lg:block">
          <p className="text-xs text-gray-400 mb-1">Publications — 14 days</p>
          <div className="w-64">
            <PublicationTrendChart data={trendData} />
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((s, i) => (
          <div key={s.label} className={`glass rounded-2xl p-5 stat-card fade-up delay-${i + 1}`}>
            <div className={`inline-flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br ${s.gradient} mb-3 shadow-sm`}>
              <span className="text-white text-base font-bold">{s.value < 10 ? s.value : '✓'}</span>
            </div>
            <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">{s.label}</p>
            <p className="text-3xl font-display font-semibold text-gray-900 mt-0.5">{s.value}</p>
            <p className="text-gray-400 text-xs mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Today's Tasks */}
      {((pendingDrafts || []).length > 0 || totalErrors > 0 || (pendingQueue || []).length > 0) && (
        <div className="glass rounded-2xl p-5 fade-up">
          <h2 className="font-display font-semibold text-gray-800 mb-3">📋 Today&apos;s Tasks</h2>
          <div className="space-y-2">
            {(pendingDrafts || []).length > 0 && (
              <Link href="/drafts" className="flex items-center gap-3 py-2 px-3 rounded-xl hover:bg-white/50 transition-colors group">
                <span className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-500 font-bold text-sm">{(pendingDrafts || []).length}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800 group-hover:text-indigo-600 transition-colors">Drafts to review</p>
                  <p className="text-xs text-gray-400">
                    {(pendingDrafts || []).slice(0, 2).map(d => d.topic || d.platform).join(', ')}
                    {(pendingDrafts || []).length > 2 && ` +${(pendingDrafts || []).length - 2} more`}
                  </p>
                </div>
                <span className="text-xs text-gray-300 group-hover:text-indigo-400">Review →</span>
              </Link>
            )}
            {(pendingQueue || []).length > 0 && (
              <Link href="/queue" className="flex items-center gap-3 py-2 px-3 rounded-xl hover:bg-white/50 transition-colors group">
                <span className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500 font-bold text-sm">{(pendingQueue || []).length}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800 group-hover:text-indigo-600 transition-colors">Queue items pending</p>
                  <p className="text-xs text-gray-400">Waiting for approval or publishing</p>
                </div>
                <span className="text-xs text-gray-300 group-hover:text-indigo-400">View →</span>
              </Link>
            )}
            {totalErrors > 0 && (
              <Link href="/errors" className="flex items-center gap-3 py-2 px-3 rounded-xl hover:bg-white/50 transition-colors group">
                <span className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-500 font-bold text-sm">{totalErrors}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800 group-hover:text-red-600 transition-colors">Unresolved errors</p>
                  <p className="text-xs text-gray-400">Workflow failures need attention</p>
                </div>
                <span className="text-xs text-gray-300 group-hover:text-red-400">Fix →</span>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="glass rounded-2xl p-5 fade-up">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display font-semibold text-gray-800">Recent Activity</h2>
          <Link href="/content" className="text-xs text-indigo-500 hover:text-indigo-700">View all →</Link>
        </div>
        <div className="space-y-1.5">
          {recentPubs.slice(0, 6).map((pub: any) => (
            <a key={pub.id}
              href={pub.publish_url || `/products/${pub.product_id}`}
              target={pub.publish_url ? '_blank' : undefined}
              rel={pub.publish_url ? 'noopener noreferrer' : undefined}
              className="flex items-center gap-3 py-1.5 px-2 rounded-lg hover:bg-white/40 transition-colors group">
              <PlatformIcon platform={pub.platform} size={16} />
              <span className="text-xs text-gray-700 flex-1 truncate group-hover:text-indigo-600">{pub.topic || 'Post published'}</span>
              <span className="text-[10px] text-gray-400">{pub.product_id}</span>
              {pub.publish_url && <span className="text-[10px] text-indigo-400 opacity-0 group-hover:opacity-100">↗</span>}
              <span className={`w-1.5 h-1.5 rounded-full ${pub.status === 'published' ? 'bg-emerald-400' : pub.status === 'failed' ? 'bg-red-400' : 'bg-gray-300'}`} />
            </a>
          ))}
          {recentPubs.length === 0 && <p className="text-xs text-gray-400 text-center py-3">No recent activity</p>}
        </div>
      </div>

      {/* Products grid */}
      <div className="fade-up">
        <h2 className="font-display text-lg font-semibold text-gray-800 mb-4">Products</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {(products || []).map((product) => {
            const productPubs = pubs.filter(p => p.product_id === product.id)
            const pubCount = productPubs.filter(p => p.status === 'published').length
            const weekCount = productPubs.filter(p => p.status === 'published' && p.published_at && p.published_at > weekAgo).length
            return (
              <Link key={product.id} href={`/products/${product.id}`}
                className="glass glass-hover rounded-2xl p-5 block group">

                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-display font-semibold text-gray-900 text-[15px] group-hover:text-indigo-600 transition-colors">
                      {product.name}
                    </h3>
                    {product.site && (
                      <p className="text-gray-400 text-xs mt-0.5">{product.site}</p>
                    )}
                  </div>
                  <span className={`pill ${product.paused ? 'pill-yellow' : 'pill-green'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${product.paused ? 'bg-amber-500' : 'bg-emerald-500'} inline-block`}/>
                    {product.paused ? 'paused' : 'active'}
                  </span>
                </div>

                {/* Description */}
                {product.one_liner && (
                  <p className="text-gray-500 text-sm mb-3 leading-relaxed line-clamp-2">{product.one_liner}</p>
                )}

                {/* Mini stats */}
                {pubCount > 0 && (
                  <div className="flex gap-3 mb-3">
                    <span className="text-xs text-gray-500">
                      <span className="font-semibold text-emerald-600">{pubCount}</span> published
                    </span>
                    {weekCount > 0 && (
                      <span className="text-xs text-gray-500">
                        <span className="font-semibold text-blue-600">{weekCount}</span> this week
                      </span>
                    )}
                  </div>
                )}

                {/* Platform icons */}
                <div className="flex flex-wrap gap-1.5">
                  {(product.channels || []).map((ch: string) => (
                    <span key={ch} className="platform-pill">
                      <PlatformIcon platform={ch} size={13}/>
                      <span className="capitalize">{ch}</span>
                    </span>
                  ))}
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 fade-up">

        {/* Recent publications */}
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-gray-800 text-base">Recent Publications</h2>
            <span className="text-xs text-gray-400">{recentPubs.length} items</span>
          </div>
          <div className="space-y-0">
            {recentPubs.length === 0 && (
              <p className="text-gray-400 text-sm text-center py-10">No publications yet</p>
            )}
            {recentPubs.map((pub: any) => (
              <PublicationRow key={pub.id} pub={pub} />
            ))}
          </div>
        </div>

        {/* Workflow runs */}
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-gray-800 text-base">Workflow Runs</h2>
            <Link href="/workflows" className="text-xs text-indigo-500 hover:text-indigo-700 transition-colors">View all →</Link>
          </div>
          <div className="space-y-0.5">
            {(workflows || []).length === 0 && (
              <p className="text-gray-400 text-sm text-center py-10">No runs yet</p>
            )}
            {(workflows || []).map((run: any) => (
              <div key={run.id} className="flex items-center gap-3 py-2.5 border-b border-gray-100/80 last:border-0 row-hover rounded-lg px-1">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  run.status === 'success' ? 'bg-emerald-500 shadow-[0_0_6px_#10b981]' :
                  run.status === 'failed'  ? 'bg-red-500 shadow-[0_0_6px_#ef4444]' :
                  'bg-amber-400 shadow-[0_0_6px_#f59e0b]'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-gray-800 font-medium">{run.workflow_name || run.workflow_id}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {run.product_id || 'all products'}
                    {run.duration_ms && <> · {(run.duration_ms / 1000).toFixed(1)}s</>}
                    {run.items_processed > 0 && <> · {run.items_processed} items</>}
                  </p>
                </div>
                <span className={`pill flex-shrink-0 ${STATUS_CONFIG[run.status]?.cls || 'pill-gray'}`}>
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
