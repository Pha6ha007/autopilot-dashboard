import { supabaseAdmin as supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { formatDistanceToNow, format } from 'date-fns'
import { PlatformIcon } from '@/components/PlatformIcon'
import { AutoTierBadge } from '@/components/AutoTierBadge'
import { PublicationRow } from '@/components/PublicationRow'
import { ProductContextEditor } from '@/components/ProductContextEditor'
import { ProductActions } from '@/components/ProductActions'

export const revalidate = 30

const STATUS_CLS: Record<string, string> = {
  published: 'pill-green',
  scheduled:  'pill-blue',
  generating: 'pill-yellow',
  failed:     'pill-red',
  skipped:    'pill-gray',
  draft:      'pill-gray',
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const [{ data: product }, { data: publications }, { data: plan }] = await Promise.all([
    supabase.from('products').select('*').eq('id', slug).single(),
    supabase.from('publications').select('*').eq('product_id', slug)
      .order('created_at', { ascending: false }).limit(20),
    supabase.from('content_plan').select('*').eq('product_id', slug)
      .gte('scheduled_for', new Date().toISOString().split('T')[0])
      .order('scheduled_for').limit(10),
  ])

  if (!product) notFound()

  const pubs = publications || []
  const s = {
    total:   pubs.filter((p: any) => p.status === 'published').length,
    last30:  pubs.filter((p: any) => p.status === 'published' && new Date(p.published_at) > new Date(Date.now() - 30 * 86400000)).length,
    last7:   pubs.filter((p: any) => p.status === 'published' && new Date(p.published_at) > new Date(Date.now() - 7 * 86400000)).length,
    errors:  pubs.filter((p: any) => p.status === 'failed').length,
  }

  // Platform breakdown
  const platformMap: Record<string, { published: number; failed: number; last?: string }> = {}
  for (const pub of pubs) {
    if (!platformMap[pub.platform]) platformMap[pub.platform] = { published: 0, failed: 0 }
    if (pub.status === 'published') {
      platformMap[pub.platform].published++
      if (!platformMap[pub.platform].last || pub.published_at > platformMap[pub.platform].last!) {
        platformMap[pub.platform].last = pub.published_at
      }
    }
    if (pub.status === 'failed') platformMap[pub.platform].failed++
  }

  return (
    <div className="space-y-7">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400 fade-up">
        <Link href="/" className="hover:text-gray-700 transition-colors">Dashboard</Link>
        <span>›</span>
        <span className="text-gray-700 font-medium">{product.name}</span>
      </div>

      {/* Hero header */}
      <div className="glass rounded-2xl p-6 fade-up">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="font-display text-2xl font-semibold text-gray-900">{product.name}</h1>
              <span className="pill pill-green">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"/>
                active
              </span>
            </div>
            {product.site && (
              <a href={`https://${product.site}`} target="_blank" rel="noopener noreferrer"
                className="text-indigo-500 text-sm hover:text-indigo-700 transition-colors font-medium">
                {product.site} ↗
              </a>
            )}
            {product.one_liner && (
              <p className="text-gray-500 text-sm mt-2 max-w-2xl leading-relaxed">{product.one_liner}</p>
            )}
          </div>
          {product.cta_link && (
            <a href={product.cta_link} target="_blank" rel="noopener noreferrer"
              className="btn-glass flex-shrink-0 text-sm px-4 py-2 rounded-xl font-medium text-gray-700">
              Visit site ↗
            </a>
          )}
        </div>
        <ProductActions product={{ id: product.id, name: product.name, paused: product.paused, archived: product.archived }} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 fade-up">
        {[
          { label: 'Total Published', value: s.total, cls: 'text-gray-900', href: `/products/${slug}#published` },
          { label: 'Pending',         value: pubs.filter((p: any) => p.status !== 'published' && p.status !== 'failed').length, cls: 'text-blue-600', href: '/drafts' },
          { label: 'This Week',       value: s.last7,  cls: 'text-emerald-600', href: '/calendar' },
          { label: 'Errors',          value: s.errors, cls: 'text-red-500', href: '/errors' },
        ].map((st) => (
          <Link key={st.label} href={st.href} className="glass rounded-2xl p-4 stat-card hover:shadow-md transition-all">
            <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">{st.label}</p>
            <p className={`text-3xl font-display font-semibold mt-1 ${st.cls}`}>{st.value}</p>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="flex items-center gap-3 fade-up">
        <Link href={`/content?product=${slug}`} className="glass-hover rounded-xl px-4 py-2.5 text-sm font-medium text-indigo-600 hover:shadow-md transition-all">
          + Create content
        </Link>
        <Link href={`/calendar`} className="glass-hover rounded-xl px-4 py-2.5 text-sm font-medium text-gray-600 hover:shadow-md transition-all">
          📅 Calendar
        </Link>
        <Link href={`/analytics`} className="glass-hover rounded-xl px-4 py-2.5 text-sm font-medium text-gray-600 hover:shadow-md transition-all">
          📊 Analytics
        </Link>
        <Link href={`/drafts`} className="glass-hover rounded-xl px-4 py-2.5 text-sm font-medium text-gray-600 hover:shadow-md transition-all">
          ✏️ Drafts
        </Link>
      </div>

      {/* Platform breakdown */}
      <div className="glass rounded-2xl p-5 fade-up">
        <h2 className="font-display font-semibold text-gray-800 mb-4">Platforms</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {(product.channels || []).map((ch: string) => {
            const ps = platformMap[ch] || { published: 0, failed: 0 }
            return (
              <Link key={ch} href={`/products/${slug}/platforms/${ch}`} className="glass-hover rounded-xl p-3.5 text-center border border-gray-100/80 bg-white/50 hover:shadow-md transition-all cursor-pointer">
                <div className="flex justify-center mb-2">
                  <PlatformIcon platform={ch} size={28}/>
                </div>
                <p className="text-gray-700 text-xs font-semibold capitalize mb-1.5">{ch}</p>
                <div className="flex justify-center mb-2">
                  <AutoTierBadge platform={ch} size="xs" />
                </div>
                <p className="text-2xl font-display font-semibold text-gray-900">{ps.published}</p>
                <p className="text-gray-400 text-[11px]">published</p>
                {ps.failed > 0 && (
                  <p className="text-red-400 text-[11px] mt-0.5">{ps.failed} failed</p>
                )}
                {ps.last && (
                  <p className="text-gray-400 text-[10px] mt-1 truncate">
                    {formatDistanceToNow(new Date(ps.last), { addSuffix: true })}
                  </p>
                )}
              </Link>
            )
          })}
        </div>
      </div>

      {/* Product Context */}
      <div className="glass rounded-2xl p-5 fade-up">
        <h2 className="font-display font-semibold text-gray-800 mb-4">Product Context</h2>
        <p className="text-xs text-gray-400 mb-4">Content knowledge — used by AI to generate platform-specific posts and articles</p>
        <ProductContextEditor productId={slug} />
      </div>

      {/* Content plan + Publications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 fade-up">

        {/* Upcoming content */}
        <div className="glass rounded-2xl p-5">
          <h2 className="font-display font-semibold text-gray-800 mb-4">Upcoming Content</h2>
          <div className="space-y-0.5">
            {(plan || []).length === 0 && (
              <p className="text-gray-400 text-sm text-center py-10">No scheduled content</p>
            )}
            {(plan || []).map((item: any) => (
              <div key={item.id} className="flex items-start gap-3 py-2.5 border-b border-gray-100/80 last:border-0 row-hover rounded-lg px-1">
                <div className="flex-shrink-0 w-9 text-center">
                  <p className="text-gray-900 font-display font-semibold text-sm">{format(new Date(item.scheduled_for), 'dd')}</p>
                  <p className="text-gray-400 text-[10px] uppercase">{format(new Date(item.scheduled_for), 'MMM')}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-gray-800 font-medium truncate">{item.topic}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`pill ${STATUS_CLS[item.status] || 'pill-gray'}`}>{item.status}</span>
                    <span className="text-gray-400 text-xs">{item.type}</span>
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  {(item.platforms || []).slice(0, 3).map((p: string) => (
                    <PlatformIcon key={p} platform={p} size={16}/>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent publications */}
        <div className="glass rounded-2xl p-5">
          <h2 className="font-display font-semibold text-gray-800 mb-4">Recent Publications</h2>
          <div className="space-y-0">
            {pubs.length === 0 && (
              <p className="text-gray-400 text-sm text-center py-10">No publications yet</p>
            )}
            {pubs.map((pub: any) => (
              <PublicationRow key={pub.id} pub={pub} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
