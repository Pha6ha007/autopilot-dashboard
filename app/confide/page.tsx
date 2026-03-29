import { supabaseAdmin } from '@/lib/supabase'
import Link from 'next/link'
import { formatDistanceToNow, format } from 'date-fns'

export const revalidate = 30

const STAGES = ['idea', 'script', 'voices', 'visuals', 'edit', 'review', 'published'] as const
type Stage = typeof STAGES[number]

const STAGE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  idea:      { label: 'Idea',      color: 'text-gray-500',   bg: 'bg-gray-100' },
  script:    { label: 'Script',    color: 'text-violet-600', bg: 'bg-violet-100' },
  voices:    { label: 'Voices',    color: 'text-blue-600',   bg: 'bg-blue-100' },
  visuals:   { label: 'Visuals',   color: 'text-indigo-600', bg: 'bg-indigo-100' },
  edit:      { label: 'Editing',   color: 'text-amber-600',  bg: 'bg-amber-100' },
  review:    { label: 'Review',    color: 'text-orange-600', bg: 'bg-orange-100' },
  published: { label: 'Published', color: 'text-emerald-600',bg: 'bg-emerald-100' },
  failed:    { label: 'Failed',    color: 'text-red-600',    bg: 'bg-red-100' },
}

function StageProgress({ stage }: { stage: string }) {
  const currentIdx = STAGES.indexOf(stage as Stage)
  return (
    <div className="flex items-center gap-0.5 mt-3">
      {STAGES.map((s, i) => (
        <div key={s} className={`h-1 rounded-full flex-1 transition-all ${
          i < currentIdx  ? 'bg-emerald-400' :
          i === currentIdx ? 'bg-indigo-500' :
          'bg-gray-100'
        }`} />
      ))}
    </div>
  )
}

export default async function ConfideEpisodesPage() {
  const { data: episodes, error } = await supabaseAdmin
    .from('episodes')
    .select('*')
    .eq('product_id', 'confide')
    .order('episode_num', { ascending: false })
    .limit(20)

  // Table doesn't exist yet
  if (error?.code === '42P01') {
    return (
      <div className="space-y-6">
        <div className="fade-up">
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
            <Link href="/" className="hover:text-gray-700 transition-colors">Dashboard</Link>
            <span>›</span>
            <span className="text-gray-700">Confide Episodes</span>
          </div>
          <h1 className="font-display text-[28px] font-semibold text-gray-900 tracking-tight">Episode Pipeline</h1>
        </div>
        <div className="glass rounded-2xl p-8 fade-up">
          <p className="text-amber-600 font-medium mb-3">⚠️ Run this SQL in Supabase to activate episode tracking:</p>
          <a href="https://supabase.com/dashboard/project/lqftehzolxfqjjqquedx/sql/new"
            target="_blank"
            className="btn-glass inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-indigo-600 mb-4">
            Open SQL Editor ↗
          </a>
          <pre className="bg-gray-900 text-emerald-300 text-xs rounded-xl p-5 overflow-auto font-mono leading-6 max-h-64">
{`-- File: supabase/episodes.sql
-- Copy content from /Documents/Autopilot/supabase/episodes.sql`}
          </pre>
        </div>
      </div>
    )
  }

  const inProgress = (episodes || []).filter(e => !['published','failed'].includes(e.stage))
  const published  = (episodes || []).filter(e => e.stage === 'published')
  const totalCost  = (episodes || []).reduce((s: number, e: any) => s + (Number(e.total_cost_usd) || 0), 0)
  const totalViews = (episodes || []).reduce((s: number, e: any) => s + (e.views_count || 0), 0)

  return (
    <div className="space-y-7">

      {/* Header */}
      <div className="fade-up">
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
          <Link href="/" className="hover:text-gray-700 transition-colors">Dashboard</Link>
          <span>›</span>
          <Link href="/products/confide" className="hover:text-gray-700 transition-colors">Confide</Link>
          <span>›</span>
          <span className="text-gray-700">Episodes</span>
        </div>
        <div className="flex items-end justify-between">
          <div>
            <h1 className="font-display text-[28px] font-semibold text-gray-900 tracking-tight">Episode Pipeline</h1>
            <p className="text-gray-400 text-sm mt-1">{(episodes || []).length} episodes tracked</p>
          </div>
          <div className="flex gap-6 text-right">
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wide">Total spend</p>
              <p className="font-display font-semibold text-gray-900 text-xl">${totalCost.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wide">Total views</p>
              <p className="font-display font-semibold text-gray-900 text-xl">{totalViews.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stage legend */}
      <div className="flex flex-wrap gap-2 fade-up">
        {STAGES.map((s, i) => (
          <span key={s} className={`pill border-0 ${STAGE_CONFIG[s].bg} ${STAGE_CONFIG[s].color}`}>
            {i + 1}. {STAGE_CONFIG[s].label}
          </span>
        ))}
      </div>

      {/* In-progress cards */}
      {inProgress.length > 0 && (
        <div className="fade-up">
          <h2 className="font-display font-semibold text-gray-700 text-base mb-3">In Progress</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {inProgress.map((ep: any) => {
              const cfg = STAGE_CONFIG[ep.stage] || STAGE_CONFIG.idea
              return (
                <div key={ep.id} className="glass glass-hover rounded-2xl p-5">
                  <div className="flex items-start justify-between mb-1">
                    <p className="text-gray-400 text-xs font-medium">EP {String(ep.episode_num).padStart(2,'0')}</p>
                    <span className={`pill border-0 text-[11px] ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                  </div>
                  <h3 className="font-display font-semibold text-gray-900 text-[15px]">{ep.title}</h3>
                  {ep.story_type && (
                    <p className="text-gray-400 text-xs mt-0.5 capitalize">{ep.story_type}</p>
                  )}
                  <StageProgress stage={ep.stage} />
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                    <p className="text-gray-400 text-xs">
                      {ep.scheduled_for
                        ? `📅 ${format(new Date(ep.scheduled_for), 'MMM d')}`
                        : 'No date set'}
                    </p>
                    <p className="text-gray-400 text-xs">
                      {ep.total_cost_usd ? `$${Number(ep.total_cost_usd).toFixed(2)}` : '—'}
                    </p>
                  </div>
                  {ep.error_message && (
                    <p className="text-red-400 text-xs mt-2 truncate">{ep.error_message}</p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Published table */}
      {published.length > 0 && (
        <div className="fade-up">
          <h2 className="font-display font-semibold text-gray-700 text-base mb-3">Published</h2>
          <div className="glass rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Ep','Title','Views','Likes','Cost','Published'].map(h => (
                    <th key={h} className="text-left text-gray-400 font-medium text-xs uppercase tracking-wide px-5 py-3.5">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {published.map((ep: any) => (
                  <tr key={ep.id} className="border-b border-gray-50 last:border-0 hover:bg-indigo-50/20 transition-colors">
                    <td className="px-5 py-3.5 text-gray-400 text-xs font-medium">
                      #{String(ep.episode_num).padStart(2,'0')}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <p className="text-gray-800 font-medium text-[13px]">{ep.title}</p>
                        {ep.youtube_url && (
                          <a href={ep.youtube_url} target="_blank" rel="noopener noreferrer"
                            className="text-red-400 hover:text-red-600 transition-colors">▶</a>
                        )}
                      </div>
                      {ep.story_type && (
                        <p className="text-gray-400 text-xs mt-0.5 capitalize">{ep.story_type}</p>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-gray-700 font-semibold text-[13px]">
                      {(ep.views_count || 0).toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 text-[13px]">{ep.likes_count || 0}</td>
                    <td className="px-5 py-3.5 text-gray-500 text-[13px]">
                      {ep.total_cost_usd ? `$${Number(ep.total_cost_usd).toFixed(2)}` : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-gray-400 text-xs">
                      {ep.published_at
                        ? formatDistanceToNow(new Date(ep.published_at), { addSuffix: true })
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {(episodes || []).length === 0 && !error && (
        <div className="glass rounded-2xl p-16 text-center fade-up">
          <p className="text-3xl mb-3">🎬</p>
          <p className="text-gray-500 font-medium">No episodes yet</p>
          <p className="text-gray-400 text-sm mt-1">Run WF-3 to generate the first Confide episode</p>
        </div>
      )}
    </div>
  )
}
