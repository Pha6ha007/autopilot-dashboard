'use client'
import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { PlatformIcon } from './PlatformIcon'
import { AutoTierBadge } from './AutoTierBadge'
import { getPlatformType, PLATFORM_OPEN_URLS } from '@/lib/platform-types'
import { CONTENT_SIZES, ALWAYS_SHORT, type ContentSize } from '@/lib/content-size'

type ContentItem = {
  id: string
  product_id: string
  platform: string
  content: string
  content_html?: string
  topic?: string
  template?: string
  status: string
  image_url?: string
  image_type?: string
  generation_model?: string
  created_at: string
  approved_at?: string
  published_at?: string
  publish_url?: string
  products?: { name: string; site: string; tone: string; auto_publish: boolean; channels: string[] }
}

type Version = { id: string; version_number: number; content: string; created_at: string; created_by: string }
type Media = { id: string; image_url: string; prompt?: string; style?: string; selected: boolean; created_at: string }
type Context = { positioning?: string; target_audience?: string; pain_points?: string; key_features?: unknown[]; cta?: string }

type Props = {
  item: ContentItem
  source: string
  context: Context | null
  versions: Version[]
  media: Media[]
}

const STATUS_STYLES: Record<string, { bg: string; label: string }> = {
  draft: { bg: 'bg-amber-50 text-amber-700 border-amber-200', label: '📝 Draft' },
  approved: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: '✅ Approved' },
  rejected: { bg: 'bg-red-50 text-red-500 border-red-200', label: '❌ Rejected' },
  published: { bg: 'bg-blue-50 text-blue-700 border-blue-200', label: '🚀 Published' },
  pending: { bg: 'bg-amber-50 text-amber-600 border-amber-200', label: '⏳ Pending' },
  failed: { bg: 'bg-red-50 text-red-600 border-red-300', label: '💥 Failed' },
  regenerating: { bg: 'bg-violet-50 text-violet-600 border-violet-200', label: '🔄 Regenerating' },
}

const CHAR_LIMITS: Record<string, number> = {
  twitter: 280, linkedin: 3000, telegram: 4096, instagram: 2200,
  devto: 8000, reddit: 10000, facebook: 5000, medium: 10000, hashnode: 8000,
}

const PLATFORM_GUIDELINES: Record<string, string> = {
  linkedin: 'Professional tone. Up to 3000 chars. 3-5 hashtags at the end.',
  twitter: 'Max 280 chars. 2-3 hashtags. Emojis OK.',
  devto: 'Markdown format. Include code blocks if relevant. SEO title.',
  telegram: 'Casual tone. Emojis encouraged. Link at the end.',
  reddit: 'Conversational. No direct promo. Value-first approach.',
  hashnode: 'Technical blog style. Markdown. Cover image needed.',
  medium: 'Long-form. Storytelling approach.',
  instagram: 'Visual-first. Short punchy caption. Hashtags at end.',
  facebook: 'Conversational. Question hooks. Link in comments.',
}

const AI_STYLES = [
  { id: 'cinematic', name: '🎬 Cinematic' },
  { id: '3d-render', name: '🧊 3D' },
  { id: 'editorial', name: '📰 Editorial' },
  { id: 'gradient', name: '🌈 Abstract' },
  { id: 'illustration', name: '✏️ Illustration' },
  { id: 'noir', name: '🖤 Noir' },
]

export function ContentCardClient({ item: initialItem, source, context, versions: initialVersions, media: initialMedia }: Props) {
  const router = useRouter()
  const [item, setItem] = useState(initialItem)
  const [versions, setVersions] = useState(initialVersions)
  const [media, setMedia] = useState(initialMedia)

  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState(item.content)
  const [saving, setSaving] = useState(false)
  const [regenOpen, setRegenOpen] = useState(false)
  const [regenPrompt, setRegenPrompt] = useState('')
  const [regenSize, setRegenSize] = useState<ContentSize>((initialItem as { content_size?: ContentSize }).content_size || 'medium')
  const [adaptPlatform, setAdaptPlatform] = useState('')
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)
  const [imageLoading, setImageLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const productName = item.products?.name || item.product_id
  const tier = getPlatformType(item.platform)
  const charLimit = CHAR_LIMITS[item.platform] || 5000
  const st = STATUS_STYLES[item.status] || STATUS_STYLES.draft

  // Save edited content
  const handleSave = useCallback(async () => {
    setSaving(true)
    const resp = await fetch(`/api/content-card/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: editText }),
    })
    if (resp.ok) {
      const { item: updated } = await resp.json()
      setItem(prev => ({ ...prev, ...updated }))
      setVersions(prev => [{ id: crypto.randomUUID(), version_number: prev.length + 1, content: item.content, created_at: new Date().toISOString(), created_by: 'user' }, ...prev])
      setEditing(false)
    }
    setSaving(false)
  }, [item.id, item.content, editText])

  // Update status
  const updateStatus = useCallback(async (status: string) => {
    setSaving(true)
    const resp = await fetch(`/api/content-card/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (resp.ok) {
      const { item: updated } = await resp.json()
      setItem(prev => ({ ...prev, ...updated }))
    }
    setSaving(false)
  }, [item.id])

  // Regenerate
  const handleRegenerate = useCallback(async () => {
    setSaving(true)
    setItem(prev => ({ ...prev, status: 'regenerating' }))
    const resp = await fetch(`/api/drafts/${item.id}/regenerate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ instructions: regenPrompt, content_size: regenSize }),
    })
    if (resp.ok) {
      const { draft } = await resp.json()
      setVersions(prev => [{ id: crypto.randomUUID(), version_number: prev.length + 1, content: item.content, created_at: new Date().toISOString(), created_by: 'ai_regenerate' }, ...prev])
      setItem(prev => ({ ...prev, ...draft }))
      setEditText(draft.content)
    } else {
      setItem(prev => ({ ...prev, status: 'draft' }))
    }
    setRegenOpen(false)
    setRegenPrompt('')
    setSaving(false)
  }, [item.id, item.content, regenPrompt])

  // Cross-platform adapt
  const handleAdapt = useCallback(async () => {
    if (!adaptPlatform) return
    setSaving(true)
    const resp = await fetch(`/api/drafts/${item.id}/regenerate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ instructions: `Adapt this content for ${adaptPlatform}. ${PLATFORM_GUIDELINES[adaptPlatform] || ''}` }),
    })
    // TODO: create new queue item for adapted platform
    setSaving(false)
    setAdaptPlatform('')
  }, [item.id, adaptPlatform])

  // Generate image
  const handleGenerateImage = useCallback(async (style: string) => {
    setImageLoading(true)
    const resp = await fetch('/api/generate-image/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ draft_id: item.id, product_id: item.product_id, topic: item.topic || item.content.slice(0, 100), platform: item.platform, style }),
    })
    if (resp.ok) {
      const data = await resp.json()
      setItem(prev => ({ ...prev, image_url: data.image_url, image_type: 'ai' }))
      setMedia(prev => [{ id: crypto.randomUUID(), image_url: data.image_url, prompt: item.topic, style, selected: true, created_at: new Date().toISOString() }, ...prev])
    }
    setImageLoading(false)
  }, [item.id, item.product_id, item.topic, item.content, item.platform])

  // Copy text
  const copyText = () => {
    navigator.clipboard.writeText(item.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Restore version
  const restoreVersion = useCallback(async (v: Version) => {
    setEditText(v.content)
    setEditing(true)
  }, [])

  // Publish
  const handlePublish = useCallback(async () => {
    if (source === 'generated_content') {
      await fetch(`/api/drafts/${item.id}/publish`, { method: 'POST' })
    }
    await updateStatus('published')
  }, [item.id, source, updateStatus])

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Lightbox */}
      {lightboxUrl && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm cursor-zoom-out" onClick={() => setLightboxUrl(null)}>
          <img src={lightboxUrl} alt="Full size" className="max-w-[90vw] max-h-[90vh] rounded-2xl shadow-2xl" onClick={e => e.stopPropagation()} />
          <button onClick={() => setLightboxUrl(null)} className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center text-white text-xl">×</button>
        </div>
      )}

      {/* SECTION 1: Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
          <button onClick={() => router.back()} className="hover:text-gray-700 transition-colors">← Back</button>
          <span>·</span>
          <Link href={`/products/${item.product_id}`} className="hover:text-gray-700">{productName}</Link>
          <span>·</span>
          <span className="capitalize">{item.platform}</span>
        </div>

        <div className="glass rounded-2xl p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <PlatformIcon platform={item.platform} size={32} />
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-display font-bold text-gray-900 text-xl">{productName}</h1>
                  <span className="text-gray-400">·</span>
                  <span className="text-gray-600 capitalize font-medium">{item.platform}</span>
                  <AutoTierBadge platform={item.platform} size="sm" />
                </div>
                {item.topic && <p className="text-sm text-gray-500 mt-0.5">{item.topic}</p>}
              </div>
            </div>
            <div className={`px-3 py-1.5 rounded-xl border text-sm font-medium ${st.bg}`}>{st.label}</div>
          </div>

          <div className="flex items-center gap-4 mt-4 text-xs text-gray-400">
            {item.created_at && <span>Created {new Date(item.created_at).toLocaleDateString()}</span>}
            {item.generation_model && <span>Model: {item.generation_model}</span>}
            {item.template && <span className="bg-gray-100 px-2 py-0.5 rounded-full capitalize">{item.template}</span>}
          </div>
        </div>
      </div>

      {/* SECTION 2: Content */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display font-semibold text-gray-800">Content</h2>
          <div className="flex items-center gap-2">
            {!editing && (
              <>
                <button onClick={() => { setEditing(true); setEditText(item.content) }} className="text-xs px-2.5 py-1 rounded-lg border border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50">✏️ Edit</button>
                <button onClick={copyText} className="text-xs px-2.5 py-1 rounded-lg border border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50">{copied ? '✅ Copied' : '📋 Copy'}</button>
                <button onClick={() => setRegenOpen(!regenOpen)} className="text-xs px-2.5 py-1 rounded-lg border border-violet-200 text-violet-500 hover:text-violet-700 hover:bg-violet-50">🔄 Regenerate</button>
              </>
            )}
          </div>
        </div>

        {editing ? (
          <div>
            <textarea value={editText} onChange={e => setEditText(e.target.value)} rows={8} className="field-input text-sm font-mono resize-none w-full" />
            <div className="flex items-center justify-between mt-2">
              <span className={`text-xs ${editText.length > charLimit ? 'text-red-500 font-medium' : 'text-gray-400'}`}>{editText.length} / {charLimit}</span>
              <div className="flex gap-2">
                <button onClick={() => setEditing(false)} className="text-xs text-gray-500 px-3 py-1.5">❌ Cancel</button>
                <button onClick={handleSave} disabled={saving} className="text-xs font-medium text-white bg-indigo-500 hover:bg-indigo-600 px-4 py-1.5 rounded-lg disabled:opacity-50">💾 {saving ? 'Saving…' : 'Save'}</button>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap bg-gray-50/50 rounded-xl px-5 py-4 border border-gray-100/80">
              {item.content}
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className={`text-xs ${item.content.length > charLimit ? 'text-red-500 font-medium' : 'text-gray-400'}`}>{item.content.length} / {charLimit} characters</span>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 4: Regenerate */}
      {regenOpen && (
        <div className="glass rounded-2xl p-6">
          <h2 className="font-display font-semibold text-gray-800 mb-3">🔄 Regenerate Content</h2>
          <textarea value={regenPrompt} onChange={e => setRegenPrompt(e.target.value)} rows={3} placeholder="Make it more technical and add specific metrics..." className="field-input text-sm resize-none w-full mb-3" />
          {!ALWAYS_SHORT.includes(item.platform) && (
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs text-gray-500">Content size:</span>
              <select value={regenSize} onChange={e => setRegenSize(e.target.value as ContentSize)}
                className="field-input w-auto text-xs py-1">
                {(['short', 'medium', 'long'] as ContentSize[]).map(s => (
                  <option key={s} value={s}>{CONTENT_SIZES[s].label} — {CONTENT_SIZES[s].description}</option>
                ))}
              </select>
            </div>
          )}
          <div className="flex items-center gap-3">
            <button onClick={handleRegenerate} disabled={saving} className="text-sm font-medium text-white bg-violet-500 hover:bg-violet-600 px-4 py-2 rounded-xl disabled:opacity-50">{saving ? '⏳ Generating…' : '🔄 Generate new version'}</button>
            <button onClick={() => setRegenOpen(false)} className="text-sm text-gray-500">Cancel</button>
          </div>
          <p className="text-[10px] text-gray-400 mt-2">Platform: {PLATFORM_GUIDELINES[item.platform] || 'General guidelines apply.'}</p>
        </div>
      )}

      {/* SECTION 3: Version History */}
      {versions.length > 0 && (
        <div className="glass rounded-2xl p-6">
          <h2 className="font-display font-semibold text-gray-800 mb-3">📜 Version History</h2>
          <div className="space-y-2">
            {versions.slice(0, 5).map(v => (
              <div key={v.id} className="flex items-start gap-3 py-2 border-b border-gray-100/60 last:border-0">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">v{v.version_number}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-600 line-clamp-2">{v.content.slice(0, 150)}…</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-gray-400">{new Date(v.created_at).toLocaleString()}</span>
                    <span className="text-[10px] text-gray-300">·</span>
                    <span className="text-[10px] text-gray-400 capitalize">{v.created_by.replace('_', ' ')}</span>
                  </div>
                </div>
                <button onClick={() => restoreVersion(v)} className="text-[10px] text-indigo-500 hover:text-indigo-700 flex-shrink-0">↩️ Restore</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 5: Cross-platform Adapt */}
      <div className="glass rounded-2xl p-6">
        <h2 className="font-display font-semibold text-gray-800 mb-3">🔀 Adapt for another platform</h2>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">{item.platform}</span>
          <span className="text-gray-300">→</span>
          <select value={adaptPlatform} onChange={e => setAdaptPlatform(e.target.value)} className="field-input w-auto text-sm py-1.5">
            <option value="">Select platform…</option>
            {(item.products?.channels || []).filter(ch => ch !== item.platform).map(ch => (
              <option key={ch} value={ch}>{ch}</option>
            ))}
          </select>
          <button onClick={handleAdapt} disabled={saving || !adaptPlatform} className="text-sm font-medium text-white bg-indigo-500 hover:bg-indigo-600 px-4 py-1.5 rounded-xl disabled:opacity-50">⚡ Adapt</button>
        </div>
      </div>

      {/* SECTION 6: Media */}
      <div className="glass rounded-2xl p-6">
        <h2 className="font-display font-semibold text-gray-800 mb-3">🎨 Media</h2>

        {/* Current image */}
        {item.image_url && (
          <div className="mb-4">
            <img src={item.image_url} alt="Post image" onClick={() => setLightboxUrl(item.image_url!)} className="max-w-xs rounded-xl border border-gray-100 shadow-sm cursor-zoom-in hover:shadow-md transition-all" />
          </div>
        )}

        {/* AI Style buttons */}
        <div className="flex flex-wrap gap-2 mb-3">
          {AI_STYLES.map(s => (
            <button key={s.id} onClick={() => handleGenerateImage(s.id)} disabled={imageLoading} className="text-xs px-3 py-1.5 rounded-lg border border-violet-200 text-violet-500 hover:border-violet-400 hover:bg-violet-50 disabled:opacity-50">
              {imageLoading ? '⏳' : s.name}
            </button>
          ))}
        </div>

        {/* Gallery */}
        {media.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {media.map(m => (
              <img key={m.id} src={m.image_url} alt="" onClick={() => setLightboxUrl(m.image_url)} className={`w-24 h-24 object-cover rounded-lg cursor-zoom-in border-2 ${m.selected ? 'border-indigo-400' : 'border-transparent'} hover:border-indigo-300 transition-all`} />
            ))}
          </div>
        )}
      </div>

      {/* SECTION 7: Publish */}
      <div className="glass rounded-2xl p-6">
        <h2 className="font-display font-semibold text-gray-800 mb-3">
          {tier === 'auto' ? '🚀 Publish' : tier === 'semi_auto' ? '⚠️ Semi-auto Publish' : '✋ Manual Publish'}
        </h2>

        {tier === 'auto' && item.status !== 'published' && (
          <div className="space-y-3">
            <button onClick={handlePublish} disabled={saving} className="text-sm font-medium text-white bg-indigo-500 hover:bg-indigo-600 px-5 py-2.5 rounded-xl disabled:opacity-50 shadow-md shadow-indigo-100">
              {saving ? '⏳ Publishing…' : '🚀 Publish now'}
            </button>
            {item.status === 'draft' && <p className="text-xs text-gray-400">This will approve and queue for immediate publishing via WF-10.</p>}
          </div>
        )}

        {tier === 'semi_auto' && item.status !== 'published' && (
          <div className="space-y-3 bg-amber-50/50 rounded-xl p-4 border border-amber-200/50">
            <p className="text-xs text-amber-600">⚠️ Rate limits apply. Post manually to avoid bans.</p>
            <div className="flex gap-2">
              <button onClick={copyText} className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">{copied ? '✅ Copied' : '📋 Copy text'}</button>
              {PLATFORM_OPEN_URLS[item.platform] && (
                <a href={PLATFORM_OPEN_URLS[item.platform]} target="_blank" rel="noopener noreferrer" className="text-xs px-3 py-1.5 rounded-lg border border-indigo-200 text-indigo-600 hover:bg-indigo-50">🔗 Open {item.platform}</a>
              )}
              <button onClick={() => updateStatus('published')} disabled={saving} className="text-xs px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100 disabled:opacity-50">✅ Mark as published</button>
            </div>
          </div>
        )}

        {tier === 'manual' && item.status !== 'published' && (
          <div className="space-y-3 bg-gray-50/50 rounded-xl p-4 border border-gray-200/50">
            <p className="text-xs text-gray-500">✋ Manual platform — copy content and publish directly.</p>
            <div className="flex gap-2">
              <button onClick={copyText} className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">{copied ? '✅ Copied' : '📋 Copy text'}</button>
              {PLATFORM_OPEN_URLS[item.platform] && (
                <a href={PLATFORM_OPEN_URLS[item.platform]} target="_blank" rel="noopener noreferrer" className="text-xs px-3 py-1.5 rounded-lg border border-indigo-200 text-indigo-600 hover:bg-indigo-50">🔗 Open {item.platform}</a>
              )}
              <button onClick={() => updateStatus('published')} disabled={saving} className="text-xs px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100 disabled:opacity-50">✅ Mark as published</button>
            </div>
          </div>
        )}

        {item.status === 'published' && (
          <div className="bg-emerald-50/50 rounded-xl p-4 border border-emerald-200/50">
            <p className="text-sm text-emerald-700 font-medium">✅ Published</p>
            {item.published_at && <p className="text-xs text-emerald-500 mt-1">{new Date(item.published_at).toLocaleString()}</p>}
            {item.publish_url && <a href={item.publish_url} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-500 hover:text-indigo-700 mt-1 block">View post ↗</a>}
          </div>
        )}
      </div>
    </div>
  )
}
