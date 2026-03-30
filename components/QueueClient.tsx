'use client'
import { useState, useCallback } from 'react'
import { PlatformIcon } from '@/components/PlatformIcon'
import { AutoTierBadge } from '@/components/AutoTierBadge'
import { PLATFORM_BY_ID } from '@/lib/platforms'
import { getPlatformType, TYPE_META, PLATFORM_OPEN_URLS } from '@/lib/platform-types'

type QueueItem = {
  id: string
  product_id: string
  platform: string
  content: string
  status: string
  requires_manual: boolean
  auto_published: boolean
  scheduled_for: string | null
  published_at: string | null
  publish_url: string | null
  error: string | null
  created_at: string
  products: { id: string; name: string; channels: string[]; auto_publish: boolean } | null
}

type GroupMode = 'product' | 'platform'

function formatDate(iso: string | null) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function truncate(s: string, n = 72) {
  return s.length > n ? s.slice(0, n) + '…' : s
}

function StatusBadge({ status }: { status: string }) {
  const cls: Record<string, string> = {
    pending:  'bg-amber-50 text-amber-600 border-amber-100',
    approved: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    published:'bg-emerald-50 text-emerald-600 border-emerald-100',
    rejected: 'bg-gray-100 text-gray-400 border-gray-200',
    failed:   'bg-red-50 text-red-500 border-red-100',
  }
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border whitespace-nowrap ${cls[status] ?? 'bg-gray-100 text-gray-400'}`}>
      {status}
    </span>
  )
}

// ─── Single queue row ─────────────────────────────────────────────────────────
function QueueRow({
  item,
  showProduct,
  showPlatform,
  onAction,
}: {
  item: QueueItem
  showProduct: boolean
  showPlatform: boolean
  onAction: (id: string, action: 'approve' | 'reject' | 'mark_published') => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [copying, setCopying] = useState(false)

  async function copy() {
    await navigator.clipboard.writeText(item.content)
    setCopying(true)
    setTimeout(() => setCopying(false), 1500)
  }

  const isPending  = item.status === 'pending'
  const isApproved = item.status === 'approved'
  const isManual   = item.requires_manual
  const tier       = getPlatformType(item.platform)
  const isSemiAuto = tier === 'semi_auto'
  const openUrl    = PLATFORM_OPEN_URLS[item.platform]
  const platformLabel = PLATFORM_BY_ID[item.platform]?.label || item.platform

  return (
    <div className={`border-b border-gray-100/80 last:border-0 ${item.status === 'rejected' ? 'opacity-40' : ''}`}>
      {/* ── Grid row: [platform 160px] [content 1fr] [date 60px] [status 90px] [actions 72px] ── */}
      <div
        className="grid items-center gap-3 px-4 py-3 hover:bg-white/40 cursor-pointer transition-colors"
        style={{ gridTemplateColumns: '160px 1fr 60px 90px 72px' }}
        onClick={() => setExpanded(e => !e)}
      >
        {/* Platform / Product cell */}
        <div className="min-w-0">
          {showPlatform && (
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-1.5">
                <PlatformIcon platform={item.platform} size={13} />
                <span className="text-sm text-gray-700 font-medium truncate">{platformLabel}</span>
              </div>
              <div className="flex items-center gap-1">
                <AutoTierBadge platform={item.platform} size="xs" />
                {isSemiAuto && (
                  <span className="text-[9px] text-yellow-600 font-medium">manual approval</span>
                )}
              </div>
            </div>
          )}
          {showProduct && (
            <span className="text-sm text-gray-600 truncate block">
              {item.products?.name || item.product_id}
            </span>
          )}
        </div>

        {/* Content preview */}
        <div className="min-w-0">
          <p className="text-sm text-gray-800 truncate">{truncate(item.content)}</p>
        </div>

        {/* Date */}
        <div className="text-xs text-gray-400 text-right">
          {formatDate(item.scheduled_for || item.published_at)}
        </div>

        {/* Status badge */}
        <div>
          <StatusBadge status={item.status} />
        </div>

        {/* Action buttons — fixed 72px, never shift */}
        <div className="flex items-center gap-1 justify-end" onClick={e => e.stopPropagation()}>
          {isManual ? (
            /* Manual platforms: no approve/reject — just expand to copy */
            <span className="text-xs text-gray-400 italic">manual</span>
          ) : isSemiAuto ? (
            /* Semi-auto: approve/reject only */
            isPending ? (
              <>
                <button title="Approve" onClick={() => onAction(item.id, 'approve')}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-emerald-600 hover:bg-emerald-50 transition-colors">✅</button>
                <button title="Reject" onClick={() => onAction(item.id, 'reject')}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-50 transition-colors">❌</button>
              </>
            ) : isApproved ? (
              <button title="Mark published" onClick={() => onAction(item.id, 'mark_published')}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-indigo-500 hover:bg-indigo-50 transition-colors text-sm font-bold">✓</button>
            ) : null
          ) : (
            /* Auto platforms */
            isPending ? (
              <>
                <button title="Approve" onClick={() => onAction(item.id, 'approve')}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-emerald-600 hover:bg-emerald-50 transition-colors">✅</button>
                <button title="Reject" onClick={() => onAction(item.id, 'reject')}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-50 transition-colors">❌</button>
              </>
            ) : isApproved ? (
              <button title="Mark published" onClick={() => onAction(item.id, 'mark_published')}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-indigo-500 hover:bg-indigo-50 transition-colors text-sm font-bold">✓</button>
            ) : null
          )}
        </div>
      </div>

      {/* Expanded content panel */}
      {expanded && (
        <div className="px-4 pb-4 pt-0">
          <div className="glass rounded-xl p-4 space-y-3">
            <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">{item.content}</pre>

            <div className="flex items-center gap-2 pt-2 border-t border-gray-100 flex-wrap">
              {/* Copy — always available */}
              <button onClick={copy}
                className="btn-glass flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium text-gray-600">
                {copying ? '✓ Copied!' : '📋 Copy'}
              </button>

              {/* Open platform link — for manual platforms */}
              {isManual && openUrl && (
                <a href={openUrl} target="_blank" rel="noopener noreferrer"
                  className="btn-glass flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium text-gray-600">
                  🔗 Open {platformLabel}
                </a>
              )}

              {/* Mark as published — manual or approved items */}
              {(isManual || isApproved) && item.status !== 'published' && (
                <button onClick={() => onAction(item.id, 'mark_published')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium bg-emerald-500 hover:bg-emerald-600 text-white transition-colors">
                  ✅ Mark as published
                </button>
              )}

              {/* Semi-auto warning */}
              {isSemiAuto && (
                <span className="text-xs text-yellow-600 bg-yellow-50 border border-yellow-100 px-2 py-1 rounded-lg">
                  ⚠️ Requires manual approval regardless of auto-publish setting
                </span>
              )}
            </div>

            {item.publish_url && (
              <a href={item.publish_url} target="_blank" rel="noopener noreferrer"
                className="text-xs text-indigo-600 underline break-all">{item.publish_url}</a>
            )}
            {item.error && (
              <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{item.error}</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Grouped section ──────────────────────────────────────────────────────────
function GroupSection({ title, icon, count, items, groupMode, onAction }: {
  title: string
  icon?: React.ReactNode
  count: number
  items: QueueItem[]
  groupMode: GroupMode
  onAction: (id: string, action: 'approve' | 'reject' | 'mark_published') => void
}) {
  const platformId = groupMode === 'platform' ? items[0]?.platform : null
  const allManual  = items.every(i => i.requires_manual)
  const allAuto    = items.every(i => !i.requires_manual)
  const sectionLabel = allManual ? 'Manual only' : allAuto ? 'Auto-published' : 'Pending approval'

  return (
    <div className="glass rounded-2xl overflow-hidden shadow-sm">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/40 bg-white/20">
        {icon}
        <span className="font-semibold text-gray-800 text-sm">{title}</span>
        <span className="ml-1 text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{count}</span>
        {platformId && <AutoTierBadge platform={platformId} size="xs" />}
        <span className="ml-auto text-xs text-gray-400">{sectionLabel}</span>
      </div>
      {items.map(item => (
        <QueueRow
          key={item.id}
          item={item}
          showProduct={groupMode === 'platform'}
          showPlatform={groupMode === 'product'}
          onAction={onAction}
        />
      ))}
    </div>
  )
}

// ─── Auto-publish toggles ─────────────────────────────────────────────────────
function AutoPublishTable({ products, onToggle }: {
  products: { id: string; name: string; channels: string[]; auto_publish: boolean }[]
  onToggle: (id: string, value: boolean) => void
}) {
  return (
    <div className="glass rounded-2xl overflow-hidden">
      <div className="px-4 py-3 border-b border-white/40 bg-white/20">
        <p className="font-semibold text-gray-800 text-sm">Auto-publish settings</p>
        <p className="text-xs text-gray-400 mt-0.5">
          When ON — Auto platforms publish immediately · Semi-auto always require approval · Manual always go to Manual Queue
        </p>
      </div>
      <div className="divide-y divide-gray-100/60">
        {products.map(p => (
          <div key={p.id} className="flex items-center gap-3 px-4 py-3">
            <span className="flex-1 text-sm font-medium text-gray-800">{p.name}</span>
            <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full mr-2">active</span>
            <button
              onClick={() => onToggle(p.id, !p.auto_publish)}
              className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${p.auto_publish ? 'bg-indigo-500' : 'bg-gray-200'}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${p.auto_publish ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export function QueueClient({ initialPending, initialApproved, initialPublished, initialProducts }: {
  initialPending:   QueueItem[]
  initialApproved:  QueueItem[]
  initialPublished: QueueItem[]
  initialProducts:  { id: string; name: string; channels: string[]; auto_publish: boolean }[]
}) {
  const [tab, setTab]             = useState<'pending' | 'approved' | 'published'>('pending')
  const [groupMode, setGroupMode] = useState<GroupMode>('product')
  const [pending,   setPending]   = useState(initialPending)
  const [approved,  setApproved]  = useState(initialApproved)
  const [published, setPublished] = useState(initialPublished)
  const [products,  setProducts]  = useState(initialProducts)
  const [pubFilter,   setPubFilter]   = useState<'all'|'week'|'month'>('all')
  const [pubProduct,  setPubProduct]  = useState('all')
  const [pubPlatform, setPubPlatform] = useState('all')

  const handleAction = useCallback(async (id: string, action: 'approve' | 'reject' | 'mark_published') => {
    const statusMap = { approve: 'approved', reject: 'rejected', mark_published: 'published' } as const
    const newStatus = statusMap[action]
    const resp = await fetch('/api/queue', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: newStatus }),
    })
    if (!resp.ok) return

    const allItems = [...pending, ...approved, ...published]
    const item = allItems.find(i => i.id === id)
    if (!item) return
    const updated = { ...item, status: newStatus }

    setPending(prev => newStatus === 'rejected'
      ? prev.map(i => i.id === id ? updated : i)
      : prev.filter(i => i.id !== id)
    )
    setApproved(prev => {
      const f = prev.filter(i => i.id !== id)
      return newStatus === 'approved' ? [...f, updated] : f
    })
    setPublished(prev => {
      const f = prev.filter(i => i.id !== id)
      return newStatus === 'published' ? [...f, updated] : f
    })
  }, [pending, approved, published])

  const handleToggle = useCallback(async (productId: string, value: boolean) => {
    const resp = await fetch(`/api/products/${productId}/auto-publish`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ auto_publish: value }),
    })
    if (!resp.ok) return
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, auto_publish: value } : p))
  }, [])

  function groupBy(items: QueueItem[], mode: GroupMode) {
    const groups: Record<string, QueueItem[]> = {}
    for (const item of items) {
      const key = mode === 'product' ? (item.products?.name || item.product_id) : item.platform
      if (!groups[key]) groups[key] = []
      groups[key].push(item)
    }
    return groups
  }

  const filteredPublished = published.filter(item => {
    const d = new Date(item.published_at || item.created_at)
    const now = new Date()
    if (pubFilter === 'week'  && (now.getTime() - d.getTime()) > 7  * 86400000) return false
    if (pubFilter === 'month' && (now.getTime() - d.getTime()) > 30 * 86400000) return false
    if (pubProduct  !== 'all' && item.product_id !== pubProduct)  return false
    if (pubPlatform !== 'all' && item.platform   !== pubPlatform) return false
    return true
  })

  const activeItems = tab === 'pending' ? pending : tab === 'approved' ? approved : filteredPublished
  const grouped     = groupBy(activeItems, groupMode)
  const manualCount = approved.filter(i => i.requires_manual).length
  const autoCount   = approved.filter(i => !i.requires_manual).length
  const uniqueProducts  = [...new Set(published.map(i => i.product_id))]
  const uniquePlatforms = [...new Set(published.map(i => i.platform))]

  return (
    <div className="space-y-6">
      <AutoPublishTable products={products} onToggle={handleToggle} />

      {/* Tabs + view toggle */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-1 glass rounded-xl p-1">
          {([
            { key: 'pending',  label: 'Pending',   count: pending.length },
            { key: 'approved', label: 'Approved',  count: approved.length },
            { key: 'published',label: 'Published', count: published.length },
          ] as const).map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === t.key ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}>
              {t.label}
              {t.count > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  tab === t.key ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-500'
                }`}>{t.count}</span>
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 glass rounded-xl p-1">
          {(['product', 'platform'] as const).map(mode => (
            <button key={mode} onClick={() => setGroupMode(mode)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all capitalize ${
                groupMode === mode ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}>
              By {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Approved summary bar */}
      {tab === 'approved' && approved.length > 0 && (
        <div className="flex items-center gap-4 glass rounded-xl px-4 py-3 text-sm flex-wrap">
          <span className="text-gray-500">{approved.length} items approved</span>
          {autoCount > 0 && <span className="text-indigo-600">⚡ {autoCount} auto-ready</span>}
          {manualCount > 0 && <span className="text-amber-600">✋ {manualCount} manual</span>}
          {autoCount > 0 && (
            <button
              onClick={async () => {
                for (const item of approved.filter(i => !i.requires_manual)) {
                  await handleAction(item.id, 'mark_published')
                }
              }}
              className="ml-auto text-xs bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-1.5 rounded-xl transition-colors">
              Publish {autoCount} auto-ready
            </button>
          )}
        </div>
      )}

      {/* Published filters */}
      {tab === 'published' && (
        <div className="flex items-center gap-2 flex-wrap">
          {(['all','week','month'] as const).map(f => (
            <button key={f} onClick={() => setPubFilter(f)}
              className={`px-3 py-1.5 rounded-xl text-sm transition-colors ${
                pubFilter === f ? 'bg-indigo-500 text-white' : 'btn-glass text-gray-600'
              }`}>
              {f === 'all' ? 'All time' : f === 'week' ? 'This week' : 'This month'}
            </button>
          ))}
          <select value={pubProduct} onChange={e => setPubProduct(e.target.value)} className="field-input !w-auto text-xs py-1.5">
            <option value="all">All products</option>
            {uniqueProducts.map(pid => <option key={pid} value={pid}>{products.find(p => p.id === pid)?.name || pid}</option>)}
          </select>
          <select value={pubPlatform} onChange={e => setPubPlatform(e.target.value)} className="field-input !w-auto text-xs py-1.5">
            <option value="all">All platforms</option>
            {uniquePlatforms.map(pl => <option key={pl} value={pl}>{PLATFORM_BY_ID[pl]?.label || pl}</option>)}
          </select>
        </div>
      )}

      {/* Groups */}
      {Object.keys(grouped).length === 0 ? (
        <div className="glass rounded-2xl py-12 text-center text-gray-400">
          <p className="text-4xl mb-3">{tab === 'pending' ? '🎉' : tab === 'approved' ? '✅' : '📭'}</p>
          <p className="text-sm">{tab === 'pending' ? 'No pending items' : tab === 'approved' ? 'Nothing approved yet' : 'No published posts'}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([key, items]) => (
            <GroupSection
              key={key}
              title={key}
              icon={groupMode === 'platform' ? <PlatformIcon platform={items[0].platform} size={15} /> : undefined}
              count={items.length}
              items={items}
              groupMode={groupMode}
              onAction={handleAction}
            />
          ))}
        </div>
      )}
    </div>
  )
}
