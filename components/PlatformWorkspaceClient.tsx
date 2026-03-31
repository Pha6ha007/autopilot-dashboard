'use client'
import Link from 'next/link'
import { PlatformIcon } from './PlatformIcon'
import { AutoTierBadge } from './AutoTierBadge'
import { QuickPost } from './QuickPost'
import { getPlatformType } from '@/lib/platform-types'
import { stripHtml } from '@/lib/format-rules'

type Props = {
  product: { id: string; name: string; site: string; channels: string[]; auto_publish: boolean }
  platform: string
  account: { username?: string; profile_url?: string; status: string; email_used?: string; followers_goal?: number; chat_id?: string } | null
  queue: { id: string; content: string; status: string; topic?: string; created_at: string }[]
  published: { id: string; topic?: string; content_preview?: string; platform: string; status: string; published_at?: string; publish_url?: string }[]
  metrics: { views: number; likes: number; comments: number; shares: number; engagement_rate: number; created_at: string }[]
  plan: { id: number; topic: string; type: string; scheduled_for: string; status: string; content_size?: string }[]
}

const BEST_TIMES: Record<string, string> = {
  linkedin: 'Tue–Thu, 8:00–10:00 AM',
  twitter: 'Daily, 12:00–14:00',
  devto: 'Monday morning',
  telegram: 'Any time — async',
  reddit: 'Weekdays 9:00 AM EST',
  instagram: 'Mon/Wed/Fri 11:00 AM',
  hashnode: 'Tuesday morning',
  medium: 'Wednesday morning',
  youtube: 'Fri–Sat 15:00–17:00',
  github: 'Any time',
  producthunt: 'Tuesday 00:01 AM PST',
  facebook: 'Wed–Fri 13:00–16:00',
  tiktok: 'Tue–Thu 19:00–21:00',
}

function formatNum(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
  return String(n)
}

export function PlatformWorkspaceClient({ product, platform, account, queue, published, metrics, plan }: Props) {
  const tier = getPlatformType(platform)
  const totalViews = metrics.reduce((s, m) => s + m.views, 0)
  const totalLikes = metrics.reduce((s, m) => s + m.likes, 0)
  const totalComments = metrics.reduce((s, m) => s + m.comments, 0)
  const avgEngagement = metrics.length > 0
    ? (metrics.reduce((s, m) => s + (m.engagement_rate || 0), 0) / metrics.length).toFixed(2)
    : '0'

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <Link href="/" className="hover:text-gray-700">Dashboard</Link>
        <span>›</span>
        <Link href={`/products/${product.id}`} className="hover:text-gray-700">{product.name}</Link>
        <span>›</span>
        <span className="text-gray-700 font-medium capitalize">{platform}</span>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-[300px_1fr] gap-5">
        {/* Left column — Platform info */}
        <div className="space-y-4">
          {/* Platform card */}
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <PlatformIcon platform={platform} size={32} />
              <div>
                <h1 className="font-display font-bold text-gray-900 text-lg capitalize">{platform}</h1>
                <AutoTierBadge platform={platform} size="sm" />
              </div>
            </div>

            <div className="space-y-3 text-sm">
              {/* Account info */}
              <div>
                <p className="text-[10px] uppercase tracking-wider text-gray-400 font-medium mb-1">Account</p>
                {account ? (
                  <div>
                    {account.username && <p className="text-gray-700 font-mono text-xs">{account.username}</p>}
                    {account.email_used && <p className="text-gray-400 text-xs">{account.email_used}</p>}
                    {account.profile_url && (
                      <a href={account.profile_url} target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:text-indigo-700 text-xs">Profile ↗</a>
                    )}
                    <span className={`inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full ${
                      account.status === 'active' ? 'bg-emerald-50 text-emerald-600' :
                      account.status === 'registered' ? 'bg-blue-50 text-blue-600' :
                      'bg-gray-100 text-gray-500'
                    }`}>{account.status}</span>
                  </div>
                ) : (
                  <p className="text-gray-400 text-xs">Not set up — <Link href="/setup" className="text-indigo-500">Setup →</Link></p>
                )}
              </div>

              {/* Best time */}
              <div>
                <p className="text-[10px] uppercase tracking-wider text-gray-400 font-medium mb-1">Best time to post</p>
                <p className="text-gray-600 text-xs">{BEST_TIMES[platform] || 'Any time'}</p>
              </div>

              {/* Auto-publish status */}
              <div>
                <p className="text-[10px] uppercase tracking-wider text-gray-400 font-medium mb-1">Auto-publish</p>
                <p className="text-xs">{
                  tier === 'auto' && product.auto_publish ? '✅ Active' :
                  tier === 'auto' ? '⏸ Disabled' :
                  tier === 'semi_auto' ? '⚠️ Requires approval' :
                  '✋ Manual only'
                }</p>
              </div>

              {/* Followers goal */}
              {account?.followers_goal && (
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-gray-400 font-medium mb-1">Followers goal</p>
                  <p className="text-gray-600 text-xs font-medium">{formatNum(account.followers_goal)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Post */}
          <QuickPost
            productId={product.id}
            productName={product.name}
            platform={platform}
            chatId={account?.chat_id}
            channelUsername={account?.username}
          />
        </div>

        {/* Right column — Content */}
        <div className="space-y-5">
          {/* Analytics */}
          {metrics.length > 0 && (
            <div className="glass rounded-2xl p-5">
              <h2 className="font-display font-semibold text-gray-800 mb-3">Analytics</h2>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: 'Views', value: formatNum(totalViews), color: 'text-gray-900' },
                  { label: 'Likes', value: formatNum(totalLikes), color: 'text-pink-500' },
                  { label: 'Comments', value: formatNum(totalComments), color: 'text-blue-500' },
                  { label: 'Avg Engagement', value: avgEngagement + '%', color: 'text-amber-500' },
                ].map(s => (
                  <div key={s.label} className="text-center">
                    <p className={`text-xl font-display font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Best post */}
              {metrics.length > 0 && published.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100/80">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Best performing post</p>
                  <p className="text-xs text-gray-700 truncate">{stripHtml(published[0]?.topic || published[0]?.content_preview || 'N/A')}</p>
                </div>
              )}
            </div>
          )}

          {/* Content Plan */}
          <div className="glass rounded-2xl p-5">
            <h2 className="font-display font-semibold text-gray-800 mb-3">Upcoming Content</h2>
            {plan.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">No upcoming content</p>
            ) : (
              <div className="space-y-2">
                {plan.map(p => (
                  <div key={p.id} className="flex items-center gap-3 py-1.5 border-b border-gray-100/60 last:border-0">
                    <span className="text-xs text-gray-500 w-16">{p.scheduled_for}</span>
                    <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-500">{p.type}</span>
                    {p.content_size && (
                      <span className={`text-[9px] font-bold px-1 rounded ${
                        p.content_size === 'short' ? 'bg-sky-50 text-sky-600' :
                        p.content_size === 'long' ? 'bg-violet-50 text-violet-600' :
                        'bg-gray-50 text-gray-400'
                      }`}>{p.content_size === 'short' ? 'S' : p.content_size === 'long' ? 'L' : 'M'}</span>
                    )}
                    <span className="text-xs text-gray-700 flex-1 truncate">{p.topic}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      p.status === 'scheduled' ? 'bg-blue-50 text-blue-600' :
                      p.status === 'published' ? 'bg-emerald-50 text-emerald-600' :
                      'bg-gray-50 text-gray-500'
                    }`}>{p.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Queue / Drafts */}
          <div className="glass rounded-2xl p-5">
            <h2 className="font-display font-semibold text-gray-800 mb-3">Drafts & Queue</h2>
            {queue.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">No pending content</p>
            ) : (
              <div className="space-y-2">
                {queue.map(q => (
                  <Link key={q.id} href={`/content/${q.id}`} className="block py-2 px-3 rounded-lg hover:bg-white/50 transition-colors border-b border-gray-100/60 last:border-0">
                  <p className="text-xs text-gray-700 line-clamp-2">{stripHtml(q.content).slice(0, 120)}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                        q.status === 'draft' ? 'bg-amber-50 text-amber-600' :
                        q.status === 'approved' ? 'bg-emerald-50 text-emerald-600' :
                        'bg-gray-50 text-gray-500'
                      }`}>{q.status}</span>
                      <span className="text-[10px] text-gray-400">{new Date(q.created_at).toLocaleDateString()}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Recent publications */}
          <div className="glass rounded-2xl p-5">
            <h2 className="font-display font-semibold text-gray-800 mb-3">Published</h2>
            {published.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">No publications yet</p>
            ) : (
              <div className="space-y-2">
                {published.map(p => {
                  const preview = stripHtml(p.content_preview || p.topic || '')
                  const displayText = preview.length > 60 ? preview.slice(0, 60) + '…' : preview
                  const date = p.published_at ? new Date(p.published_at).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) : ''
                  return (
                    <div key={p.id} className="flex items-center gap-2 py-1.5 border-b border-gray-100/60 last:border-0">
                      <PlatformIcon platform={p.platform} size={14} />
                      <span className="text-xs text-gray-700 flex-1 truncate">{displayText || '—'}</span>
                      {date && <span className="text-[10px] text-gray-400 shrink-0">{date}</span>}
                      {p.publish_url && (
                        <a href={p.publish_url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-indigo-500 hover:text-indigo-700 shrink-0">↗</a>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
