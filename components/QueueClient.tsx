'use client'
import { useState, useCallback } from 'react'
import { PlatformIcon } from '@/components/PlatformIcon'
import { AutoTierBadge } from '@/components/AutoTierBadge'
import { PLATFORM_BY_ID, PLATFORM_AUTO_TIER } from '@/lib/platforms'

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

function truncate(s: string, n = 60) {
  return s.length > n ? s.slice(0, n) + '…' : s
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

  return (
    <div className={`border-b border-gray-100/80 last:border-0 ${
      item.status === 'rejected' ? 'opacity-40' : ''
    }`}>
      <div
        className="flex items-center gap-3 px-4 py-3 hover:bg-white/40 cursor-pointer transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        {/* Platform / Product label */}
        {showPlatform && (
          <div className="flex items-center gap-1.5 w-36 flex-shrink-0">
            <PlatformIcon platform={item.platform} size={14} />
            <span className="text-sm text-gray-600 truncate capitalize">
              {PLATFORM_BY_ID[item.platform]?.label || item.platform}
            </span>
            <AutoTierBadge platform={item.platform} size="xs" />
          </div>
        )}
        {showProduct && (
          <div className="w-28 flex-shrink-0">
            <span className="text-sm text-gray-600 truncate">{item.products?.name || item.product_id}</span>
          </div>
        )}

        {/* Content preview */}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-800 truncate">{truncate(item.content, 80)}</p>
        </div>

        {/* Date */}
        <div className="text-xs text-gray-400 w-16 flex-shrink-0 text-right">
          {formatDate(item.scheduled_for || item.published_at)}
        </div>

        {/* Status badge */}
        <div className="flex-shrink-0">
          {item.status === 'pending' && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-100">pending</span>
          )}
          {item.status === 'approved' && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">approved</span>
          )}
          {item.status === 'published' && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">published</span>
          )}
          {item.status === 'rejected' && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-400">rejected</span>
          )}
          {item.status === 'failed' && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-500 border border-red-100">failed</span>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
          {isPending && (
            <>
              <button
                title="Approve"
                onClick={() => onAction(item.id, 'approve')}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-emerald-600 hover:bg-emerald-50 transition-colors text-base"
              >✅</button>
              <button
                title="Reject"
                onClick={() => onAction(item.id, 'reject')}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-50 transition-colors text-base"
              >❌</button>
            </>
          )}
          {isApproved && isManual && (
            <button
              title="Mark as published"
              onClick={() => onAction(item.id, 'mark_published')}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-indigo-500 hover:bg-indigo-50 transition-colors text-sm font-bold"
            >✓</button>
          )}
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="px-4 pb-4 pt-1">
          <div className="glass rounded-xl p-4 space-y-3">
            {/* Full content */}
            <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">
              {item.content}
            </pre>

            {/* Manual actions */}
            {(isManual || item.status === 'approved') && (
              <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                <button
                  onClick={copy}
                  className="btn-glass flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium text-gray-600"
                >
                  {copying ? '✓ Copied!' : '📋 Copy'}
                </button>
                {item.platform !== 'telegram' && PLATFORM_BY_ID[item.platform]?.setupUrl && (
                  <a
                    href={PLATFORM_BY_ID[item.platform]?.setupUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-glass flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium text-gray-600"
                  >
                    🔗 Open {PLATFORM_BY_ID[item.platform]?.label}
                  </a>
                )}
                {item.status === 'approved' && isManual && (
                  <button
                    onClick={() => onAction(item.id, 'mark_published')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium bg-emerald-500 hover:bg-emerald-600 text-white transition-colors"
                  >
                    ✅ Mark as published
                  </button>
                )}
              </div>
            )}

            {/* Publish URL */}
            {item.publish_url && (
              <a href={item.publish_url} target="_blank" rel="noopener noreferrer"
                className="text-xs text-indigo-600 underline break-all">
                {item.publish_url}
              </a>
            )}

            {/* Error */}
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
function GroupSection({
  title,
  icon,
  count,
  items,
  groupMode,
  onAction,
}: {
  title: string
  icon?: React.ReactNode
  count: number
  items: QueueItem[]
  groupMode: GroupMode
  onAction: (id: string, action: 'approve' | 'reject' | 'mark_published') => void
}) {
  // For platform grouping — show tier badge next to title
  const platformId = groupMode === 'platform' ? items[0]?.platform : null
  // Determine section type label
  const allManual = items.every(i => i.requires_manual)
  const allAuto   = items.every(i => !i.requires_manual)
  const sectionLabel = allManual ? 'Manual only' : allAuto ? 'Auto-published' : 'Pending approval'

  return (
    <div className="glass rounded-2xl overflow-hidden shadow-sm">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/40 bg-white/20">
        {icon}
        <span className="font-semibold text-gray-800 text-sm">{title}</span>
        <span className="ml-1 text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{count}</span>
        {/* Tier badge for platform grouping */}
        {platformId && (
          <AutoTierBadge platform={platformId} size="xs" />
        )}
        {/* Section type label */}
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
function AutoPublishTable({
  products,
  onToggle,
}: {
  products: { id: string; name: string; channels: string[]; auto_publish: boolean }[]
  onToggle: (id: string, value: boolean) => void
}) {
  return (
    <div className="glass rounded-2xl overflow-hidden">
      <div className="px-4 py-3 border-b border-white/40 bg-white/20">
        <p className="font-semibold text-gray-800 text-sm">Auto-publish settings</p>
        <p className="text-xs text-gray-400 mt-0.5">When ON — generated content publishes immediately without review</p>
      </div>
      <div className="divide-y divide-gray-100/60">
        {products.map(p => (
          <div key={p.id} className="flex items-center gap-3 px-4 py-3">
            <span className="flex-1 text-sm font-medium text-gray-800">{p.name}</span>
            <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full mr-2">active</span>
            {/* Toggle */}
            <button
              onClick={() => onToggle(p.id, !p.auto_publish)}
              className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
                p.auto_publish ? 'bg-indigo-500' : 'bg-gray-200'
              }`}
            >
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                p.auto_publish ? 'translate-x-5' : 'translate-x-0.5'
              }`} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main Queue Client component ──────────────────────────────────────────────
export function QueueClient({
  initialPending,
  initialApproved,
  initialPublished,
  initialProducts,
}: {
  initialPending:   QueueItem[]
  initialApproved:  QueueItem[]
  initialPublished: QueueItem[]
  initialProducts:  { id: string; name: string; channels: string[]; auto_publish: boolean }[]
}) {
  const [tab, setTab]           = useState<'pending' | 'approved' | 'published'>('pending')
  const [groupMode, setGroupMode] = useState<GroupMode>('product')
  const [pending,   setPending]   = useState(initialPending)
  const [approved,  setApproved]  = useState(initialApproved)
  const [published, setPublished] = useState(initialPublished)
  const [products,  setProducts]  = useState(initialProducts)
  const [pubFilter, setPubFilter] = useState<'all'|'week'|'month'>('all')
  const [pubProduct, setPubProduct] = useState('all')
  const [pubPlatform, setPubPlatform] = useState('all')

  // Action handler
  const handleAction = useCallback(async (
    id: string,
    action: 'approve' | 'reject' | 'mark_published'
  ) => {
    const statusMap = { approve: 'approved', reject: 'rejected', mark_published: 'published' }
    const newStatus = statusMap[action]

    const resp = await fetch('/api/queue', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: newStatus }),
    })
    if (!resp.ok) return

    // Move item between lists
    const allItems = [...pending, ...approved, ...published]
    const item = allItems.find(i => i.id === id)
    if (!item) return
    const updated = { ...item, status: newStatus }

    setPending(prev => prev.filter(i => i.id !== id))
    setApproved(prev => {
      const filtered = prev.filter(i => i.id !== id)
      return newStatus === 'approved' ? [...filtered, updated] : filtered
    })
    setPublished(prev => {
      const filtered = prev.filter(i => i.id !== id)
      return newStatus === 'published' ? [...filtered, updated] : filtered
    })

    if (newStatus === 'rejected') {
      setPending(prev => prev.map(i => i.id === id ? updated : i))
    }
  }, [pending, approved, published])

  // Auto-publish toggle
  const handleToggle = useCallback(async (productId: string, value: boolean) => {
    const resp = await fetch(`/api/products/${productId}/auto-publish`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ auto_publish: value }),
    })
    if (!resp.ok) return
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, auto_publish: value } : p))
  }, [])

  // Group items
  function groupBy(items: QueueItem[], mode: GroupMode) {
    const groups: Record<string, QueueItem[]> = {}
    for (const item of items) {
      const key = mode === 'product' ? (item.products?.name || item.product_id) : item.platform
      if (!groups[key]) groups[key] = []
      groups[key].push(item)
    }
    return groups
  }

  // Filter published
  const filteredPublished = published.filter(item => {
    const d = new Date(item.published_at || item.created_at)
    const now = new Date()
    if (pubFilter === 'week' && (now.getTime() - d.getTime()) > 7 * 86400000) return false
    if (pubFilter === 'month' && (now.getTime() - d.getTime()) > 30 * 86400000) return false
    if (pubProduct !== 'all' && item.product_id !== pubProduct) return false
    if (pubPlatform !== 'all' && item.platform !== pubPlatform) return false
    return true
  })

  const activeItems = tab === 'pending' ? pending : tab === 'approved' ? approved : filteredPublished
  const grouped = groupBy(activeItems, groupMode)

  // Counts
  const manualCount = approved.filter(i => i.requires_manual).length
  const autoCount   = approved.filter(i => !i.requires_manual).length

  const uniqueProducts  = [...new Set(published.map(i => i.product_id))]
  const uniquePlatforms = [...new Set(published.map(i => i.platform))]

  return (
    <div className="space-y-6">
      {/* Auto-publish settings */}
      <AutoPublishTable products={products} onToggle={handleToggle} />

      {/* View toggle + Tabs */}
      <div className="flex items-center justify-between">
        {/* Tabs */}
        <div className="flex items-center gap-1 glass rounded-xl p-1">
          {[
            { key: 'pending',  label: 'Pending',  count: pending.length },
            { key: 'approved', label: 'Approved', count: approved.length },
            { key: 'published',label: 'Published',count: published.length },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as typeof tab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === t.key
                  ? 'bg-white shadow-sm text-gray-900'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
              {t.count > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  tab === t.key ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-500'
                }`}>{t.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* Group mode */}
        <div className="flex items-center gap-1 glass rounded-xl p-1">
          {(['product', 'platform'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setGroupMode(mode)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all capitalize ${
                groupMode === mode
                  ? 'bg-white shadow-sm text-gray-900'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              By {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Approved summary bar */}
      {tab === 'approved' && approved.length > 0 && (
        <div className="flex items-center gap-4 glass rounded-xl px-4 py-3 text-sm">
          <span className="text-gray-500">{approved.length} items approved</span>
          {autoCount > 0 && <span className="text-indigo-600">⚡ {autoCount} auto-publish ready</span>}
          {manualCount > 0 && <span className="text-amber-600">✋ {manualCount} require manual posting</span>}
          {autoCount > 0 && (
            <button
              onClick={async () => {
                for (const item of approved.filter(i => !i.requires_manual)) {
                  await handleAction(item.id, 'mark_published')
                }
              }}
              className="ml-auto text-xs bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-1.5 rounded-xl transition-colors"
            >
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
          <select value={pubProduct} onChange={e => setPubProduct(e.target.value)}
            className="field-input !w-auto text-xs py-1.5">
            <option value="all">All products</option>
            {uniqueProducts.map(pid => (
              <option key={pid} value={pid}>{products.find(p => p.id === pid)?.name || pid}</option>
            ))}
          </select>
          <select value={pubPlatform} onChange={e => setPubPlatform(e.target.value)}
            className="field-input !w-auto text-xs py-1.5">
            <option value="all">All platforms</option>
            {uniquePlatforms.map(pl => (
              <option key={pl} value={pl}>{PLATFORM_BY_ID[pl]?.label || pl}</option>
            ))}
          </select>
        </div>
      )}

      {/* Content groups */}
      {Object.keys(grouped).length === 0 ? (
        <div className="glass rounded-2xl py-12 text-center text-gray-400">
          <p className="text-4xl mb-3">
            {tab === 'pending' ? '🎉' : tab === 'approved' ? '✅' : '📭'}
          </p>
          <p className="text-sm">
            {tab === 'pending' ? 'No pending items' : tab === 'approved' ? 'Nothing approved yet' : 'No published posts'}
          </p>
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
