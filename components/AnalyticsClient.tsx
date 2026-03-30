'use client'
import { useState, useMemo } from 'react'
import { PlatformIcon } from './PlatformIcon'

type Metric = {
  id: string
  publication_id: number
  product_id: string
  platform: string
  views: number
  likes: number
  comments: number
  shares: number
  clicks: number
  impressions: number
  engagement_rate: number
  created_at: string
  publications?: { title: string; created_at: string }
}

type Publication = {
  id: number
  product_id: string
  platform: string
  title: string
  status: string
  created_at: string
  published_at?: string
}

type Props = {
  metrics: Metric[]
  products: { id: string; name: string }[]
  publications: Publication[]
}

function formatNum(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
  return String(n)
}

export function AnalyticsClient({ metrics, products, publications }: Props) {
  const [filterProduct, setFilterProduct] = useState('')

  const filtered = filterProduct
    ? metrics.filter(m => m.product_id === filterProduct)
    : metrics

  // Aggregate stats
  const totals = useMemo(() => {
    const t = { views: 0, likes: 0, comments: 0, shares: 0, clicks: 0, impressions: 0 }
    for (const m of filtered) {
      t.views += m.views
      t.likes += m.likes
      t.comments += m.comments
      t.shares += m.shares
      t.clicks += m.clicks
      t.impressions += m.impressions
    }
    return t
  }, [filtered])

  const avgEngagement = useMemo(() => {
    if (filtered.length === 0) return 0
    return filtered.reduce((s, m) => s + (m.engagement_rate || 0), 0) / filtered.length
  }, [filtered])

  // By platform
  const byPlatform = useMemo(() => {
    const map: Record<string, { views: number; likes: number; comments: number; shares: number; clicks: number; count: number; engagement: number }> = {}
    for (const m of filtered) {
      if (!map[m.platform]) map[m.platform] = { views: 0, likes: 0, comments: 0, shares: 0, clicks: 0, count: 0, engagement: 0 }
      map[m.platform].views += m.views
      map[m.platform].likes += m.likes
      map[m.platform].comments += m.comments
      map[m.platform].shares += m.shares
      map[m.platform].clicks += m.clicks
      map[m.platform].count++
      map[m.platform].engagement += m.engagement_rate || 0
    }
    return Object.entries(map)
      .map(([platform, data]) => ({
        platform,
        ...data,
        avgEngagement: data.count > 0 ? (data.engagement / data.count).toFixed(2) : '0',
      }))
      .sort((a, b) => b.views - a.views)
  }, [filtered])

  // By product
  const byProduct = useMemo(() => {
    const map: Record<string, { views: number; likes: number; comments: number; posts: number; engagement: number }> = {}
    for (const m of filtered) {
      if (!map[m.product_id]) map[m.product_id] = { views: 0, likes: 0, comments: 0, posts: 0, engagement: 0 }
      map[m.product_id].views += m.views
      map[m.product_id].likes += m.likes
      map[m.product_id].comments += m.comments
      map[m.product_id].posts++
      map[m.product_id].engagement += m.engagement_rate || 0
    }
    return Object.entries(map)
      .map(([id, data]) => ({
        id,
        name: products.find(p => p.id === id)?.name || id,
        ...data,
        avgEngagement: data.posts > 0 ? (data.engagement / data.posts).toFixed(2) : '0',
      }))
      .sort((a, b) => b.views - a.views)
  }, [filtered, products])

  // Top posts
  const topPosts = useMemo(() =>
    [...filtered]
      .sort((a, b) => (b.likes + b.comments + b.shares) - (a.likes + a.comments + a.shares))
      .slice(0, 10),
  [filtered])

  return (
    <div className="space-y-6">
      {/* Filter */}
      <div className="flex items-center gap-4">
        <select
          value={filterProduct}
          onChange={e => setFilterProduct(e.target.value)}
          className="field-input w-auto text-sm py-1.5"
        >
          <option value="">All products</option>
          {products.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <span className="text-xs text-gray-400">{filtered.length} data points</span>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total Views', value: formatNum(totals.views), color: 'text-gray-900' },
          { label: 'Likes', value: formatNum(totals.likes), color: 'text-pink-500' },
          { label: 'Comments', value: formatNum(totals.comments), color: 'text-blue-500' },
          { label: 'Shares', value: formatNum(totals.shares), color: 'text-emerald-500' },
          { label: 'Clicks', value: formatNum(totals.clicks), color: 'text-indigo-500' },
          { label: 'Avg Engagement', value: avgEngagement.toFixed(2) + '%', color: 'text-amber-500' },
        ].map(s => (
          <div key={s.label} className="glass rounded-xl p-4 stat-card">
            <p className="text-gray-400 text-[10px] uppercase tracking-wider font-medium">{s.label}</p>
            <p className={`text-2xl font-display font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* By Platform */}
        <div className="glass rounded-2xl p-5">
          <h2 className="font-display font-semibold text-gray-800 mb-4">By Platform</h2>
          <div className="space-y-2">
            {byPlatform.map(p => {
              const maxViews = byPlatform[0]?.views || 1
              const pct = (p.views / maxViews) * 100
              return (
                <div key={p.platform} className="flex items-center gap-3">
                  <PlatformIcon platform={p.platform} size={20} />
                  <span className="text-sm font-medium text-gray-700 capitalize w-20">{p.platform}</span>
                  <div className="flex-1 h-6 bg-gray-100/60 rounded-full overflow-hidden relative">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-400 to-violet-400 rounded-full transition-all"
                      style={{ width: `${Math.max(pct, 2)}%` }}
                    />
                    <span className="absolute inset-0 flex items-center justify-end pr-2 text-[10px] font-medium text-gray-500">
                      {formatNum(p.views)} views
                    </span>
                  </div>
                  <div className="text-right w-16">
                    <p className="text-xs font-medium text-gray-700">{p.avgEngagement}%</p>
                    <p className="text-[10px] text-gray-400">eng.</p>
                  </div>
                </div>
              )
            })}
            {byPlatform.length === 0 && <p className="text-gray-400 text-sm text-center py-6">No data</p>}
          </div>
        </div>

        {/* By Product */}
        <div className="glass rounded-2xl p-5">
          <h2 className="font-display font-semibold text-gray-800 mb-4">By Product</h2>
          <div className="space-y-3">
            {byProduct.map(p => {
              const maxViews = byProduct[0]?.views || 1
              const pct = (p.views / maxViews) * 100
              return (
                <div key={p.id}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{p.name}</span>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span>{p.posts} posts</span>
                      <span>{formatNum(p.views)} views</span>
                      <span className="text-amber-500 font-medium">{p.avgEngagement}% eng</span>
                    </div>
                  </div>
                  <div className="h-2 bg-gray-100/60 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full transition-all"
                      style={{ width: `${Math.max(pct, 2)}%` }}
                    />
                  </div>
                </div>
              )
            })}
            {byProduct.length === 0 && <p className="text-gray-400 text-sm text-center py-6">No data</p>}
          </div>
        </div>
      </div>

      {/* Top performing posts */}
      <div className="glass rounded-2xl p-5">
        <h2 className="font-display font-semibold text-gray-800 mb-4">Top Performing Posts</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 text-[10px] uppercase tracking-wider text-gray-400 font-medium">Post</th>
                <th className="text-left py-2 text-[10px] uppercase tracking-wider text-gray-400 font-medium w-20">Platform</th>
                <th className="text-right py-2 text-[10px] uppercase tracking-wider text-gray-400 font-medium w-16">Views</th>
                <th className="text-right py-2 text-[10px] uppercase tracking-wider text-gray-400 font-medium w-14">Likes</th>
                <th className="text-right py-2 text-[10px] uppercase tracking-wider text-gray-400 font-medium w-20">Comments</th>
                <th className="text-right py-2 text-[10px] uppercase tracking-wider text-gray-400 font-medium w-16">Shares</th>
                <th className="text-right py-2 text-[10px] uppercase tracking-wider text-gray-400 font-medium w-14">Eng%</th>
              </tr>
            </thead>
            <tbody>
              {topPosts.map(m => {
                const productName = products.find(p => p.id === m.product_id)?.name || m.product_id
                return (
                  <tr key={m.id} className="border-b border-gray-50 hover:bg-white/30">
                    <td className="py-2.5">
                      <p className="text-gray-800 font-medium truncate max-w-[300px]">
                        {m.publications?.title || `${productName} post`}
                      </p>
                      <p className="text-xs text-gray-400">{productName}</p>
                    </td>
                    <td className="py-2.5">
                      <div className="flex items-center gap-1.5">
                        <PlatformIcon platform={m.platform} size={14} />
                        <span className="text-xs text-gray-500 capitalize">{m.platform}</span>
                      </div>
                    </td>
                    <td className="py-2.5 text-right text-gray-700">{formatNum(m.views)}</td>
                    <td className="py-2.5 text-right text-pink-500">{m.likes}</td>
                    <td className="py-2.5 text-right text-blue-500">{m.comments}</td>
                    <td className="py-2.5 text-right text-emerald-500">{m.shares}</td>
                    <td className="py-2.5 text-right font-medium text-amber-500">{m.engagement_rate}%</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {topPosts.length === 0 && <p className="text-gray-400 text-sm text-center py-8">No metrics data yet</p>}
        </div>
      </div>
    </div>
  )
}
