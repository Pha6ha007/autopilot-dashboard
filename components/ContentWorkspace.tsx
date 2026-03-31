'use client'
import { useState, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { PlatformIcon } from './PlatformIcon'
import { AutoTierBadge } from './AutoTierBadge'
import { DateStr } from './DateDisplay'
import { getPlatformType, PLATFORM_OPEN_URLS } from '@/lib/platform-types'
import { stripHtml } from '@/lib/format-rules'

// ── Types ──

type ContentItem = {
  id: string
  product_id: string
  platform: string
  content: string
  topic?: string
  template?: string
  status: string
  image_url?: string
  content_size?: string
  created_at: string
  approved_at?: string
  published_at?: string
  publish_url?: string
  generation_model?: string
  products?: { name: string }
}

type PlanItem = {
  id: number
  product_id: string
  topic: string
  type: string
  platforms: string[]
  scheduled_for: string
  status: string
  content_size?: string
  products?: { name: string }
}

type QueueItem = {
  id: string
  product_id: string
  platform: string
  content: string
  status: string
  requires_manual: boolean
  created_at: string
  products?: { name: string }
}

type Publication = {
  id: number
  product_id: string
  platform: string
  topic?: string
  content_preview?: string
  status: string
  published_at?: string
  publish_url?: string
}

type Props = {
  drafts: ContentItem[]
  plan: PlanItem[]
  queue: QueueItem[]
  published: Publication[]
  products: { id: string; name: string }[]
}

type Tab = 'review' | 'calendar' | 'queue' | 'published'

// ── Char limits ──
const CHAR_LIMITS: Record<string, number> = {
  twitter: 280, linkedin: 3000, telegram: 4096, instagram: 2200,
  devto: 8000, reddit: 10000, facebook: 5000,
}

const STATUS_DOT: Record<string, string> = {
  draft: 'bg-amber-400',
  approved: 'bg-emerald-400',
  rejected: 'bg-red-400',
  published: 'bg-blue-400',
  pending: 'bg-amber-400',
  scheduled: 'bg-blue-400',
  failed: 'bg-red-400',
}

// ── Days helpers ──
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function getMonday(d: Date): Date {
  const date = new Date(d); const day = date.getDay()
  date.setDate(date.getDate() - (day === 0 ? 6 : day - 1))
  date.setHours(0, 0, 0, 0); return date
}
function addDays(d: Date, n: number) { const r = new Date(d); r.setDate(r.getDate() + n); return r }
function dateKey(d: Date) { return d.toISOString().split('T')[0] }

// ── Component ──

export function ContentWorkspace({ drafts: initialDrafts, plan, queue: initialQueue, published, products }: Props) {
  const [tab, setTab] = useState<Tab>('review')
  const [filterProduct, setFilterProduct] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [weekOffset, setWeekOffset] = useState(0)

  // Mutable state
  const [drafts, setDrafts] = useState(initialDrafts)
  const [queue, setQueue] = useState(initialQueue)
  const [panelContent, setPanelContent] = useState('')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)

  const selectedDraft = drafts.find(d => d.id === selectedId)
  const selectedQueue = queue.find(q => q.id === selectedId)
  const selected = selectedDraft || selectedQueue

  // Calendar
  const today = useMemo(() => { const d = new Date(); d.setHours(0,0,0,0); return d }, [])
  const weekStart = useMemo(() => addDays(getMonday(today), weekOffset * 7), [today, weekOffset])
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart])

  const planByDate = useMemo(() => {
    const map: Record<string, PlanItem[]> = {}
    for (const p of plan) {
      if (filterProduct && p.product_id !== filterProduct) continue
      if (!map[p.scheduled_for]) map[p.scheduled_for] = []
      map[p.scheduled_for].push(p)
    }
    return map
  }, [plan, filterProduct])

  // Drafts grouped by created date for calendar overlay
  const draftsByDate = useMemo(() => {
    const map: Record<string, number> = {}
    for (const d of drafts) {
      if (filterProduct && d.product_id !== filterProduct) continue
      const day = d.created_at.split('T')[0]
      map[day] = (map[day] || 0) + 1
    }
    return map
  }, [drafts, filterProduct])

  // Counts
  const counts = useMemo(() => ({
    review: drafts.filter(d => d.status === 'draft').length,
    queue: queue.filter(q => q.status === 'pending' || q.status === 'approved').length,
    published: published.length,
  }), [drafts, queue, published])

  // ── Actions ──

  const approve = useCallback(async (id: string) => {
    setSaving(true)
    const resp = await fetch(`/api/drafts/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'approved' }),
    })
    if (resp.ok) {
      setDrafts(prev => prev.map(d => d.id === id ? { ...d, status: 'approved' } : d))
    }
    setSaving(false)
  }, [])

  const reject = useCallback(async (id: string) => {
    setSaving(true)
    await fetch(`/api/drafts/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'rejected' }),
    })
    setDrafts(prev => prev.map(d => d.id === id ? { ...d, status: 'rejected' } : d))
    setSaving(false)
  }, [])

  const saveEdit = useCallback(async () => {
    if (!selectedId) return
    setSaving(true)
    const resp = await fetch(`/api/content-card/${selectedId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: panelContent }),
    })
    if (resp.ok) {
      setDrafts(prev => prev.map(d => d.id === selectedId ? { ...d, content: panelContent } : d))
      setEditing(false)
    }
    setSaving(false)
  }, [selectedId, panelContent])

  const copyText = useCallback(() => {
    if (selected) navigator.clipboard.writeText(selected.content)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }, [selected])

  const markPublished = useCallback(async (id: string) => {
    setSaving(true)
    await fetch(`/api/content-card/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'published' }),
    })
    setQueue(prev => prev.map(q => q.id === id ? { ...q, status: 'published' } : q))
    setSaving(false)
  }, [])

  const openPanel = (item: ContentItem | QueueItem) => {
    setSelectedId(item.id)
    setPanelContent(item.content)
    setEditing(false)
  }

  // ── Filtered lists ──
  const filteredDrafts = filterProduct ? drafts.filter(d => d.product_id === filterProduct) : drafts
  const filteredQueue = filterProduct ? queue.filter(q => q.product_id === filterProduct) : queue
  const filteredPublished = filterProduct ? published.filter(p => p.product_id === filterProduct) : published

  const reviewDrafts = filteredDrafts.filter(d => d.status === 'draft')
  const approvedDrafts = filteredDrafts.filter(d => d.status === 'approved')

  return (
    <div className="flex gap-0 h-[calc(100vh-7rem)]">

      {/* ── Left: List/Calendar ── */}
      <div className={`flex-1 flex flex-col min-w-0 ${selected ? 'hidden lg:flex' : ''}`}>

        {/* Header + Tabs */}
        <div className="flex items-center justify-between mb-5 flex-shrink-0">
          <div className="flex items-center gap-1 glass rounded-xl p-1">
            {([
              { key: 'review' as Tab, label: '✏️ Review', count: counts.review },
              { key: 'calendar' as Tab, label: '📅 Calendar', count: 0 },
              { key: 'queue' as Tab, label: '📬 Queue', count: counts.queue },
              { key: 'published' as Tab, label: '✅ Published', count: counts.published },
            ]).map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  tab === t.key ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
                }`}>
                {t.label} {t.count > 0 && <span className="text-xs opacity-60 ml-0.5">({t.count})</span>}
              </button>
            ))}
          </div>

          <select value={filterProduct} onChange={e => setFilterProduct(e.target.value)}
            className="field-input w-48 text-xs py-1.5">
            <option value="">All products</option>
            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        {/* ── Tab: Review ── */}
        {tab === 'review' && (
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
            {reviewDrafts.length === 0 && approvedDrafts.length === 0 && (
              <div className="glass rounded-xl p-8 text-center">
                <p className="text-2xl mb-2">✅</p>
                <p className="text-gray-500 text-sm">All caught up — no drafts to review</p>
              </div>
            )}

            {reviewDrafts.length > 0 && <p className="text-[10px] uppercase tracking-wider text-gray-400 font-medium px-1">Needs review ({reviewDrafts.length})</p>}
            {reviewDrafts.map(d => (
              <div key={d.id} onClick={() => openPanel(d)}
                className={`glass rounded-xl p-3 cursor-pointer hover:shadow-md transition-all ${selectedId === d.id ? 'ring-2 ring-indigo-300' : ''}`}>
                <div className="flex items-center gap-2 mb-1.5">
                  <PlatformIcon platform={d.platform} size={16} />
                  <span className="text-xs font-semibold text-gray-700">{d.products?.name || d.product_id}</span>
                  <span className="text-xs text-gray-400 capitalize">{d.platform}</span>
                  {d.content_size && d.content_size !== 'medium' && (
                    <span className={`text-[9px] font-bold px-1 rounded ${
                      d.content_size === 'short' ? 'bg-sky-50 text-sky-600' : 'bg-violet-50 text-violet-600'
                    }`}>{d.content_size === 'short' ? 'S' : 'L'}</span>
                  )}
                  <span className={`ml-auto w-2 h-2 rounded-full ${STATUS_DOT[d.status]}`} />
                </div>
                <p className="text-xs text-gray-600 line-clamp-2">{stripHtml(d.content).slice(0, 120)}</p>
                <div className="flex items-center gap-2 mt-2">
                  <button onClick={e => { e.stopPropagation(); approve(d.id) }} disabled={saving}
                    className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md hover:bg-emerald-100 disabled:opacity-50">✓ Approve</button>
                  <button onClick={e => { e.stopPropagation(); reject(d.id) }} disabled={saving}
                    className="text-[10px] text-red-400 hover:text-red-600 px-1">✕</button>
                  {d.topic && <span className="text-[10px] text-gray-300 ml-auto truncate max-w-[120px]">{d.topic}</span>}
                </div>
              </div>
            ))}

            {approvedDrafts.length > 0 && <p className="text-[10px] uppercase tracking-wider text-gray-400 font-medium px-1 mt-3">Approved ({approvedDrafts.length})</p>}
            {approvedDrafts.map(d => (
              <div key={d.id} onClick={() => openPanel(d)}
                className={`glass rounded-xl p-3 cursor-pointer hover:shadow-md transition-all opacity-70 ${selectedId === d.id ? 'ring-2 ring-indigo-300 opacity-100' : ''}`}>
                <div className="flex items-center gap-2">
                  <PlatformIcon platform={d.platform} size={14} />
                  <span className="text-xs text-gray-600">{d.products?.name}</span>
                  <span className="text-xs text-gray-400">{d.platform}</span>
                  <span className="ml-auto text-[10px] text-emerald-500">✓ approved</span>
                </div>
                <p className="text-[11px] text-gray-500 line-clamp-1 mt-1">{stripHtml(d.content).slice(0, 80)}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── Tab: Calendar ── */}
        {tab === 'calendar' && (
          <div className="flex-1 overflow-y-auto">
            <div className="flex items-center gap-3 mb-3">
              <button onClick={() => setWeekOffset(w => w - 1)} className="w-7 h-7 rounded-lg glass-hover flex items-center justify-center text-gray-500">←</button>
              <span className="text-sm font-medium text-gray-700 min-w-[140px] text-center">
                {weekStart.toLocaleDateString('en', { month: 'short', day: 'numeric' })} — {addDays(weekStart, 6).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
              </span>
              <button onClick={() => setWeekOffset(w => w + 1)} className="w-7 h-7 rounded-lg glass-hover flex items-center justify-center text-gray-500">→</button>
              {weekOffset !== 0 && <button onClick={() => setWeekOffset(0)} className="text-xs text-indigo-500">Today</button>}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {days.map((day, i) => {
                const key = dateKey(day)
                const items = planByDate[key] || []
                const draftCount = draftsByDate[key] || 0
                const isToday = key === dateKey(today)
                return (
                  <div key={i} className={`rounded-xl p-2 min-h-[120px] ${isToday ? 'bg-indigo-50/50 border border-indigo-200/50' : 'bg-white/30 border border-gray-100/50'}`}>
                    <div className="flex items-center justify-between mb-1">
                      <p className={`text-[10px] font-medium ${isToday ? 'text-indigo-600' : 'text-gray-400'}`}>{DAYS[i]} {day.getDate()}</p>
                      {draftCount > 0 && <span className="text-[9px] bg-amber-100 text-amber-600 px-1 rounded">{draftCount} drafts</span>}
                    </div>
                    {items.map(p => (
                      <div key={p.id} className={`rounded-md px-1.5 py-1 mb-0.5 text-[10px] border ${
                        p.status === 'published' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                        p.status === 'scheduled' ? 'bg-blue-50 border-blue-200 text-blue-700' :
                        'bg-gray-50 border-gray-200 text-gray-600'
                      }`}>
                        <div className="flex items-center gap-1">
                          <p className="font-medium truncate flex-1">{p.products?.name}</p>
                          {p.content_size && (
                            <span className={`shrink-0 w-3.5 h-3.5 rounded text-[8px] font-bold flex items-center justify-center ${
                              p.content_size === 'short' ? 'bg-sky-100 text-sky-600' :
                              p.content_size === 'long' ? 'bg-violet-100 text-violet-600' :
                              'bg-gray-100 text-gray-500'
                            }`}>{p.content_size === 'short' ? 'S' : p.content_size === 'long' ? 'L' : 'M'}</span>
                          )}
                        </div>
                        <p className="truncate opacity-70">{p.topic}</p>
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Tab: Queue ── */}
        {tab === 'queue' && (
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
            {filteredQueue.filter(q => q.status !== 'published').length === 0 && (
              <div className="glass rounded-xl p-8 text-center">
                <p className="text-gray-400 text-sm">Queue is empty</p>
              </div>
            )}
            {filteredQueue.filter(q => q.status !== 'published').map(q => (
              <div key={q.id} onClick={() => openPanel(q)}
                className={`glass rounded-xl p-3 cursor-pointer hover:shadow-md transition-all ${selectedId === q.id ? 'ring-2 ring-indigo-300' : ''}`}>
                <div className="flex items-center gap-2 mb-1">
                  <PlatformIcon platform={q.platform} size={16} />
                  <span className="text-xs font-semibold text-gray-700">{q.products?.name || q.product_id}</span>
                  <AutoTierBadge platform={q.platform} size="xs" />
                  <span className={`ml-auto w-2 h-2 rounded-full ${STATUS_DOT[q.status]}`} />
                </div>
                <p className="text-xs text-gray-600 line-clamp-2">{stripHtml(q.content).slice(0, 100)}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── Tab: Published ── */}
        {tab === 'published' && (
          <div className="flex-1 overflow-y-auto space-y-1 pr-1">
            {filteredPublished.length === 0 && (
              <div className="glass rounded-xl p-8 text-center">
                <p className="text-gray-400 text-sm">No publications yet</p>
              </div>
            )}
            {filteredPublished.map(p => (
              <div key={p.id} className="glass rounded-xl p-3">
                <div className="flex items-center gap-2">
                  <PlatformIcon platform={p.platform} size={16} />
                  <span className="text-xs font-medium text-gray-700">{p.product_id}</span>
                  <span className="text-xs text-gray-400 capitalize">{p.platform}</span>
                  <span className="flex-1" />
                  {p.published_at && <span className="text-[10px] text-gray-400"><DateStr date={p.published_at} /></span>}
                  {p.publish_url && <a href={p.publish_url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-indigo-500">↗</a>}
                </div>
                {(p.topic || p.content_preview) && (
                  <p className="text-xs text-gray-500 mt-1.5 line-clamp-2">{stripHtml(p.topic || p.content_preview || '')}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Right: Side Panel ── */}
      {selected && (
        <div className="w-full lg:w-[440px] lg:ml-4 flex-shrink-0 flex flex-col glass rounded-2xl overflow-hidden">
          {/* Panel header */}
          <div className="px-4 py-3 border-b border-white/30 bg-white/20 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <PlatformIcon platform={selected.platform} size={20} />
              <span className="text-sm font-semibold text-gray-800 truncate">{(selected as ContentItem).products?.name || selected.product_id}</span>
              <span className="text-xs text-gray-400 capitalize">{selected.platform}</span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Link href={`/content/${selected.id}`} className="text-[10px] text-indigo-500 hover:text-indigo-700">Full page →</Link>
              <button onClick={() => setSelectedId(null)} className="text-gray-400 hover:text-gray-600 w-6 h-6 flex items-center justify-center">✕</button>
            </div>
          </div>

          {/* Panel content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Topic */}
            {(selected as ContentItem).topic && (
              <p className="text-xs text-gray-500">{(selected as ContentItem).topic}</p>
            )}

            {/* Content */}
            {editing ? (
              <div>
                <textarea value={panelContent} onChange={e => setPanelContent(e.target.value)}
                  rows={8} className="field-input text-sm font-mono resize-none w-full" />
                <div className="flex items-center justify-between mt-2">
                  <span className={`text-xs ${panelContent.length > (CHAR_LIMITS[selected.platform] || 5000) ? 'text-red-500' : 'text-gray-400'}`}>
                    {panelContent.length} / {CHAR_LIMITS[selected.platform] || '∞'}
                  </span>
                  <div className="flex gap-2">
                    <button onClick={() => setEditing(false)} className="text-xs text-gray-500">Cancel</button>
                    <button onClick={saveEdit} disabled={saving} className="text-xs font-medium text-white bg-indigo-500 px-3 py-1 rounded-lg disabled:opacity-50">
                      {saving ? 'Saving…' : 'Save'}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap bg-gray-50/50 rounded-xl px-4 py-3 border border-gray-100/80">
                  {selected.content}
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-400">{selected.content.length} / {CHAR_LIMITS[selected.platform] || '∞'} chars</span>
                  <div className="flex gap-1">
                    <button onClick={() => { setEditing(true); setPanelContent(selected.content) }}
                      className="text-xs px-2 py-1 rounded-md text-gray-500 hover:bg-gray-100/50">✏️</button>
                    <button onClick={copyText}
                      className="text-xs px-2 py-1 rounded-md text-gray-500 hover:bg-gray-100/50">{copied ? '✅' : '📋'}</button>
                  </div>
                </div>
              </div>
            )}

            {/* Image */}
            {(selected as ContentItem).image_url && (
              <img src={(selected as ContentItem).image_url!} alt="" className="rounded-xl border border-gray-100 w-full" />
            )}

            {/* Actions */}
            <div className="space-y-2">
              {selected.status === 'draft' && (
                <div className="flex gap-2">
                  <button onClick={() => approve(selected.id)} disabled={saving}
                    className="flex-1 text-sm font-medium text-white bg-emerald-500 hover:bg-emerald-600 py-2 rounded-xl disabled:opacity-50">
                    ✓ Approve
                  </button>
                  <button onClick={() => reject(selected.id)} disabled={saving}
                    className="text-sm text-red-400 hover:text-red-600 px-4 py-2 rounded-xl hover:bg-red-50">
                    ✕ Reject
                  </button>
                </div>
              )}

              {(selected.status === 'approved' || selected.status === 'pending') && (
                <div>
                  {getPlatformType(selected.platform) === 'auto' ? (
                    <p className="text-xs text-emerald-500">✅ Queued for auto-publish</p>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={copyText} className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">
                        {copied ? '✅ Copied' : '📋 Copy'}
                      </button>
                      {PLATFORM_OPEN_URLS[selected.platform] && (
                        <a href={PLATFORM_OPEN_URLS[selected.platform]} target="_blank" rel="noopener noreferrer"
                          className="text-xs px-3 py-1.5 rounded-lg border border-indigo-200 text-indigo-600 hover:bg-indigo-50">
                          🔗 Open {selected.platform}
                        </a>
                      )}
                      <button onClick={() => markPublished(selected.id)} disabled={saving}
                        className="text-xs px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100 disabled:opacity-50">
                        ✅ Published
                      </button>
                    </div>
                  )}
                </div>
              )}

              {selected.status === 'published' && (
                <p className="text-xs text-blue-500">🚀 Published{(selected as ContentItem).published_at ? ` · ${'published'}` : ''}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
