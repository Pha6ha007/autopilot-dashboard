'use client'
import { useState, useCallback } from 'react'
import { PlatformIcon } from './PlatformIcon'
import { AutoTierBadge } from './AutoTierBadge'

type Draft = {
  id: string
  product_id: string
  platform: string
  content: string
  content_html?: string
  topic?: string
  image_url?: string
  image_type?: string
  template?: string
  status: string
  generation_model?: string
  edit_history?: { edited_at: string; previous_content: string; regenerated?: boolean }[]
  created_at: string
  approved_at?: string
  published_at?: string
  publish_url?: string
  rejection_reason?: string
  products?: { name: string; channels: string[] }
}

type Props = {
  initialDrafts: Draft[]
  products: { id: string; name: string }[]
}

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected: 'bg-red-50 text-red-500 border-red-200',
  published: 'bg-blue-50 text-blue-700 border-blue-200',
  regenerating: 'bg-violet-50 text-violet-700 border-violet-200',
  failed: 'bg-red-50 text-red-600 border-red-300',
}

const CHAR_LIMITS: Record<string, number> = {
  twitter: 280,
  linkedin: 3000,
  telegram: 4096,
  instagram: 2200,
  devto: 8000,
  reddit: 10000,
  facebook: 5000,
  medium: 10000,
  hashnode: 8000,
}

type Tab = 'draft' | 'approved' | 'rejected' | 'all'

export function DraftsClient({ initialDrafts, products }: Props) {
  const [drafts, setDrafts] = useState(initialDrafts)
  const [tab, setTab] = useState<Tab>('draft')
  const [filterProduct, setFilterProduct] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [regenId, setRegenId] = useState<string | null>(null)
  const [regenInstructions, setRegenInstructions] = useState('')
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)
  const filtered = drafts.filter(d => {
    if (tab !== 'all' && d.status !== tab) return false
    if (filterProduct && d.product_id !== filterProduct) return false
    return true
  })

  // Group by topic
  const groups: Record<string, Draft[]> = {}
  for (const d of filtered) {
    const key = `${d.product_id}::${d.topic || 'untitled'}`
    if (!groups[key]) groups[key] = []
    groups[key].push(d)
  }

  const setItemLoading = (id: string, v: boolean) =>
    setLoading(prev => ({ ...prev, [id]: v }))

  const updateDraft = useCallback((id: string, updates: Partial<Draft>) => {
    setDrafts(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d))
  }, [])

  const handleApprove = useCallback(async (id: string) => {
    setItemLoading(id, true)
    const resp = await fetch(`/api/drafts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'approved' }),
    })
    if (resp.ok) {
      const { draft } = await resp.json()
      updateDraft(id, draft)
    }
    setItemLoading(id, false)
  }, [updateDraft])

  const handleReject = useCallback(async (id: string) => {
    setItemLoading(id, true)
    const resp = await fetch(`/api/drafts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'rejected' }),
    })
    if (resp.ok) {
      const { draft } = await resp.json()
      updateDraft(id, draft)
    }
    setItemLoading(id, false)
  }, [updateDraft])

  const handleSaveEdit = useCallback(async (id: string) => {
    setItemLoading(id, true)
    const resp = await fetch(`/api/drafts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: editContent }),
    })
    if (resp.ok) {
      const { draft } = await resp.json()
      updateDraft(id, draft)
      setEditingId(null)
    }
    setItemLoading(id, false)
  }, [editContent, updateDraft])

  const handleRegenerate = useCallback(async (id: string) => {
    setItemLoading(id, true)
    updateDraft(id, { status: 'regenerating' })
    const resp = await fetch(`/api/drafts/${id}/regenerate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ instructions: regenInstructions }),
    })
    if (resp.ok) {
      const { draft } = await resp.json()
      updateDraft(id, draft)
    } else {
      updateDraft(id, { status: 'draft' })
    }
    setRegenId(null)
    setRegenInstructions('')
    setItemLoading(id, false)
  }, [regenInstructions, updateDraft])

  const handleBulkApprove = useCallback(async (topic: string, productId: string) => {
    const ids = drafts
      .filter(d => d.topic === topic && d.product_id === productId && d.status === 'draft')
      .map(d => d.id)
    if (ids.length === 0) return
    setLoading(prev => Object.fromEntries(ids.map(id => [id, true])))
    const resp = await fetch('/api/drafts/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'approve', ids }),
    })
    if (resp.ok) {
      const { items } = await resp.json()
      for (const item of items || []) updateDraft(item.id, item)
    }
    setLoading(prev => Object.fromEntries(ids.map(id => [id, false])))
  }, [drafts, updateDraft])

  const TEMPLATES = ['minimal', 'bold', 'gradient', 'quote'] as const
  const AI_STYLES = [
    { id: 'cinematic', name: '🎬 Cinematic' },
    { id: '3d-render', name: '🧊 3D' },
    { id: 'editorial', name: '📰 Editorial' },
    { id: 'gradient', name: '🌈 Abstract' },
    { id: 'illustration', name: '✏️ Illustration' },
    { id: 'noir', name: '🖤 Noir' },
  ] as const

  const handleGenerateImage = useCallback(async (d: Draft, template: string = 'minimal') => {
    setItemLoading(d.id, true)
    const format = ['instagram', 'tiktok'].includes(d.platform) ? 'instagram' : 'og'
    const resp = await fetch('/api/generate-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        draft_id: d.id,
        product_id: d.product_id,
        topic: d.topic || d.content.slice(0, 80),
        template,
        format,
      }),
    })
    if (resp.ok) {
      const data = await resp.json()
      updateDraft(d.id, { image_url: data.image_url, image_type: 'template' })
    }
    setItemLoading(d.id, false)
  }, [updateDraft])

  const handleGenerateAI = useCallback(async (d: Draft, style?: string) => {
    setItemLoading(d.id, true)
    const resp = await fetch('/api/generate-image/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        draft_id: d.id,
        product_id: d.product_id,
        topic: d.topic || d.content.slice(0, 100),
        platform: d.platform,
        style: style || 'cinematic',
      }),
    })
    if (resp.ok) {
      const data = await resp.json()
      updateDraft(d.id, { image_url: data.image_url, image_type: 'ai' })
    }
    setItemLoading(d.id, false)
  }, [updateDraft])

  return (
    <div>
      {/* Lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm cursor-zoom-out"
          onClick={() => setLightboxUrl(null)}
        >
          <img
            src={lightboxUrl}
            alt="Full size"
            className="max-w-[90vw] max-h-[90vh] rounded-2xl shadow-2xl"
            onClick={e => e.stopPropagation()}
          />
          <button
            onClick={() => setLightboxUrl(null)}
            className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center text-white text-xl transition-colors"
          >
            ×
          </button>
        </div>
      )}
      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex gap-1 glass rounded-xl p-1">
          {(['draft', 'approved', 'rejected', 'all'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all capitalize ${
                tab === t ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t} {t !== 'all' && <span className="text-xs opacity-60">({drafts.filter(d => d.status === t).length})</span>}
            </button>
          ))}
        </div>

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
      </div>

      {/* Groups */}
      <div className="space-y-6">
        {Object.entries(groups).map(([key, items]) => {
          const [productId, topic] = key.split('::')
          const productName = items[0]?.products?.name || productId
          const hasDrafts = items.some(d => d.status === 'draft')

          return (
            <div key={key} className="glass rounded-2xl overflow-hidden">
              {/* Group header */}
              <div className="px-5 py-3 border-b border-white/30 bg-white/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-gray-800">{productName}</span>
                  <span className="text-gray-300">·</span>
                  <span className="text-sm text-gray-600 font-medium">{topic}</span>
                  {items[0]?.template && (
                    <span className="text-[10px] uppercase tracking-wider text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                      {items[0].template}
                    </span>
                  )}
                </div>
                {hasDrafts && (
                  <button
                    onClick={() => handleBulkApprove(topic, productId)}
                    className="text-xs font-medium text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1 rounded-lg transition-colors"
                  >
                    ✓ Approve all
                  </button>
                )}
              </div>

              {/* Platform cards */}
              <div className="divide-y divide-gray-100/60">
                {items.map(d => {
                  const charLimit = CHAR_LIMITS[d.platform] || 5000
                  const charCount = d.content.length
                  const overLimit = charCount > charLimit
                  const isEditing = editingId === d.id
                  const isRegen = regenId === d.id
                  const isLoading = loading[d.id]

                  return (
                    <div key={d.id} className="px-5 py-4">
                      {/* Platform header */}
                      <div className="flex items-center gap-2 mb-2">
                        <PlatformIcon platform={d.platform} size={18} />
                        <span className="text-sm font-semibold text-gray-700 capitalize">{d.platform}</span>
                        <AutoTierBadge platform={d.platform} size="xs" />
                        <span className={`ml-auto text-xs px-2 py-0.5 rounded-full border ${STATUS_STYLES[d.status] || ''}`}>
                          {d.status}
                        </span>
                      </div>

                      {/* Content */}
                      {isEditing ? (
                        <div className="space-y-2">
                          <textarea
                            value={editContent}
                            onChange={e => setEditContent(e.target.value)}
                            rows={6}
                            className="field-input text-sm font-mono resize-none w-full"
                          />
                          <div className="flex items-center justify-between">
                            <span className={`text-xs ${overLimit ? 'text-red-500' : 'text-gray-400'}`}>
                              {editContent.length} / {charLimit}
                            </span>
                            <div className="flex gap-2">
                              <button
                                onClick={() => setEditingId(null)}
                                className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleSaveEdit(d.id)}
                                disabled={isLoading}
                                className="text-xs font-medium text-white bg-indigo-500 hover:bg-indigo-600 px-3 py-1 rounded-lg disabled:opacity-50"
                              >
                                {isLoading ? 'Saving…' : 'Save'}
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div
                          className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap bg-gray-50/50 rounded-xl px-4 py-3 border border-gray-100/80 cursor-text"
                          onClick={() => {
                            if (d.status === 'draft' || d.status === 'rejected') {
                              setEditingId(d.id)
                              setEditContent(d.content)
                            }
                          }}
                        >
                          {d.platform === 'telegram' ? (
                            <div dangerouslySetInnerHTML={{ __html: d.content_html || d.content }} />
                          ) : (
                            d.content
                          )}
                        </div>
                      )}

                      {/* Regen instructions */}
                      {isRegen && (
                        <div className="mt-2 flex gap-2">
                          <input
                            type="text"
                            value={regenInstructions}
                            onChange={e => setRegenInstructions(e.target.value)}
                            placeholder="Instructions: make shorter, more technical, add CTA…"
                            className="field-input flex-1 text-sm"
                          />
                          <button
                            onClick={() => handleRegenerate(d.id)}
                            disabled={isLoading}
                            className="text-xs font-medium text-white bg-violet-500 hover:bg-violet-600 px-3 py-1.5 rounded-lg disabled:opacity-50 whitespace-nowrap"
                          >
                            {isLoading ? '⏳ Generating…' : '🔄 Regenerate'}
                          </button>
                          <button
                            onClick={() => { setRegenId(null); setRegenInstructions('') }}
                            className="text-xs text-gray-400 hover:text-gray-600 px-2"
                          >
                            ✕
                          </button>
                        </div>
                      )}

                      {/* Image preview + generate */}
                      {!isEditing && (
                        <div className="mt-2">
                          {d.image_url ? (
                            <div className="flex items-start gap-3">
                              <img
                                src={d.image_url}
                                alt="Post image"
                                onClick={() => setLightboxUrl(d.image_url!)}
                                className="w-48 h-auto rounded-lg border border-gray-100 shadow-sm cursor-zoom-in hover:shadow-md hover:scale-[1.02] transition-all"
                              />
                              <div className="flex flex-col gap-1.5">
                                <span className="text-[10px] text-gray-400 uppercase tracking-wider">
                                  {d.image_type === 'ai' ? '🎨 AI generated' : '📐 Template'} · click to enlarge
                                </span>
                                <p className="text-[10px] text-gray-400 mb-0.5">AI styles:</p>
                                <div className="flex flex-wrap gap-1">
                                  {AI_STYLES.map(s => (
                                    <button
                                      key={s.id}
                                      onClick={() => handleGenerateAI(d, s.id)}
                                      disabled={!!loading[d.id]}
                                      className="text-[10px] px-2 py-0.5 rounded border border-violet-200 text-violet-500 hover:border-violet-400 hover:text-violet-700 hover:bg-violet-50 disabled:opacity-50"
                                    >
                                      {loading[d.id] ? '⏳' : s.name}
                                    </button>
                                  ))}
                                </div>
                                <details className="mt-1">
                                  <summary className="text-[10px] text-gray-300 cursor-pointer hover:text-gray-500">Text templates (free)</summary>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {TEMPLATES.map(t => (
                                      <button
                                        key={t}
                                        onClick={() => handleGenerateImage(d, t)}
                                        disabled={!!loading[d.id]}
                                        className="text-[10px] px-2 py-0.5 rounded border border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600 disabled:opacity-50 capitalize"
                                      >
                                        {t}
                                      </button>
                                    ))}
                                  </div>
                                </details>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              {AI_STYLES.slice(0, 3).map(s => (
                                <button
                                  key={s.id}
                                  onClick={() => handleGenerateAI(d, s.id)}
                                  disabled={!!loading[d.id]}
                                  className="text-[11px] px-2.5 py-1 rounded-lg border border-violet-200 text-violet-500 hover:border-violet-400 hover:bg-violet-50 disabled:opacity-50"
                                >
                                  {loading[d.id] ? '⏳ Generating…' : `${s.name}`}
                                </button>
                              ))}
                              <button
                                onClick={() => handleGenerateImage(d)}
                                disabled={!!loading[d.id]}
                                className="text-[11px] px-2.5 py-1 rounded-lg border border-gray-200 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                              >
                                📐 Template (free)
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Footer: char count + actions */}
                      {!isEditing && (
                        <div className="flex items-center justify-between mt-2">
                          <span className={`text-xs ${overLimit ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                            {charCount} / {charLimit} chars
                            {d.edit_history && d.edit_history.length > 0 && (
                              <span className="ml-2 text-gray-300">· {d.edit_history.length} edit{d.edit_history.length > 1 ? 's' : ''}</span>
                            )}
                          </span>

                          <div className="flex items-center gap-1">
                            {d.status === 'regenerating' && (
                              <span className="text-xs text-violet-500 animate-pulse mr-2">Regenerating…</span>
                            )}

                            {(d.status === 'draft' || d.status === 'rejected') && !isRegen && (
                              <>
                                <button
                                  onClick={() => { setEditingId(d.id); setEditContent(d.content) }}
                                  className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded-md hover:bg-gray-100/50"
                                  title="Edit"
                                >
                                  ✏️
                                </button>
                                <button
                                  onClick={() => setRegenId(d.id)}
                                  className="text-xs text-violet-500 hover:text-violet-700 px-2 py-1 rounded-md hover:bg-violet-50"
                                  title="Regenerate"
                                >
                                  🔄
                                </button>
                              </>
                            )}

                            {d.status === 'draft' && (
                              <>
                                <button
                                  onClick={() => handleApprove(d.id)}
                                  disabled={isLoading}
                                  className="text-xs font-medium text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg disabled:opacity-50"
                                >
                                  ✓ Approve
                                </button>
                                <button
                                  onClick={() => handleReject(d.id)}
                                  disabled={isLoading}
                                  className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded-md hover:bg-red-50"
                                >
                                  ✕
                                </button>
                              </>
                            )}

                            {d.status === 'approved' && (
                              <span className="text-xs text-emerald-500">✓ Ready to publish</span>
                            )}

                            {d.status === 'published' && d.publish_url && (
                              <a href={d.publish_url} target="_blank" rel="noopener noreferrer"
                                className="text-xs text-blue-500 hover:text-blue-700">
                                View post ↗
                              </a>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}

        {Object.keys(groups).length === 0 && (
          <div className="glass rounded-2xl p-12 text-center">
            <p className="text-gray-400 text-sm">No content to review</p>
            <p className="text-gray-300 text-xs mt-1">Generated posts will appear here after WF-2 runs</p>
          </div>
        )}
      </div>
    </div>
  )
}
