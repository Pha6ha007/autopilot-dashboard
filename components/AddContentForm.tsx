'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PlatformIcon } from './PlatformIcon'

const PRODUCTS = [
  { id: 'confide',        name: 'Confide' },
  { id: 'tracehawk',      name: 'TraceHawk' },
  { id: 'complyance',     name: 'Complyance' },
  { id: 'outlix',         name: 'Outlix' },
  { id: 'prepwise',       name: 'PrepWISE' },
  { id: 'personal-brand', name: 'Personal Brand' },
  { id: 'cash-engine',    name: 'Cash-Engine' },
  { id: 'storagecompare', name: 'StorageCompare' },
]

const PLATFORM_OPTIONS = [
  'youtube', 'telegram', 'linkedin', 'twitter',
  'instagram', 'tiktok', 'devto', 'hashnode', 'medium', 'facebook',
]

const TYPE_OPTIONS = [
  { value: 'post',    label: '✍️ Post' },
  { value: 'article', label: '📝 Article' },
  { value: 'youtube', label: '🎬 YouTube' },
  { value: 'reel',    label: '📱 Reel' },
  { value: 'thread',  label: '🧵 Thread' },
]

export function AddContentForm({ onClose }: { onClose?: () => void }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Tomorrow as default date
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]

  const [form, setForm] = useState({
    product_id:    '',
    topic:         '',
    type:          'post',
    platforms:     [] as string[],
    scheduled_for: tomorrow,
    notes:         '',
    keywords:      '',
  })

  const togglePlatform = (p: string) => {
    setForm(f => ({
      ...f,
      platforms: f.platforms.includes(p)
        ? f.platforms.filter(x => x !== p)
        : [...f.platforms, p]
    }))
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.product_id) { setError('Select a product'); return }
    if (!form.topic.trim()) { setError('Enter a topic'); return }
    if (form.platforms.length === 0) { setError('Select at least one platform'); return }

    setLoading(true)
    setError('')

    const resp = await fetch('/api/content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        keywords: form.keywords ? form.keywords.split(',').map(k => k.trim()).filter(Boolean) : [],
      }),
    })

    const data = await resp.json()
    setLoading(false)

    if (!resp.ok) {
      setError(data.error || 'Failed to save')
      return
    }

    router.refresh()
    onClose?.()
  }

  return (
    <form onSubmit={submit} className="space-y-3">

      {/* Product + Type + Date in one row */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-gray-500 text-xs font-medium uppercase tracking-wide block mb-1">Product</label>
          <select
            value={form.product_id}
            onChange={e => setForm(f => ({ ...f, product_id: e.target.value }))}
            className="w-full bg-white/70 border border-gray-200 rounded-xl px-3 py-2 text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300">
            <option value="">Select...</option>
            {PRODUCTS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-gray-500 text-xs font-medium uppercase tracking-wide block mb-1">Type</label>
          <select
            value={form.type}
            onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
            className="w-full bg-white/70 border border-gray-200 rounded-xl px-3 py-2 text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300">
            {TYPE_OPTIONS.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-gray-500 text-xs font-medium uppercase tracking-wide block mb-1">Date</label>
          <input
            type="date"
            value={form.scheduled_for}
            onChange={e => setForm(f => ({ ...f, scheduled_for: e.target.value }))}
            className="w-full bg-white/70 border border-gray-200 rounded-xl px-3 py-2 text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
        </div>
      </div>

      {/* Topic */}
      <div>
        <label className="text-gray-500 text-xs font-medium uppercase tracking-wide block mb-1">Topic</label>
        <input
          type="text"
          value={form.topic}
          onChange={e => setForm(f => ({ ...f, topic: e.target.value }))}
          placeholder="e.g. Why AI agents fail silently in production"
          className="w-full bg-white/70 border border-gray-200 rounded-xl px-4 py-2 text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 placeholder:text-gray-300"
        />
      </div>

      {/* Platforms */}
      <div>
        <label className="text-gray-500 text-xs font-medium uppercase tracking-wide block mb-1.5">Platforms</label>
        <div className="flex flex-wrap gap-2">
          {PLATFORM_OPTIONS.map(p => (
            <button type="button" key={p}
              onClick={() => togglePlatform(p)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all border ${
                form.platforms.includes(p)
                  ? 'bg-indigo-50 text-indigo-600 border-indigo-200'
                  : 'bg-white/60 text-gray-500 border-gray-200 hover:border-gray-300'
              }`}>
              <PlatformIcon platform={p} size={14} />
              <span className="capitalize">{p}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Notes + Keywords */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-gray-500 text-xs font-medium uppercase tracking-wide block mb-1.5">Notes <span className="text-gray-300 normal-case">(optional)</span></label>
          <textarea
            value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            placeholder="Angle, context, tone notes..."
            rows={2}
            className="w-full bg-white/70 border border-gray-200 rounded-xl px-3 py-2 text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none placeholder:text-gray-300"
          />
        </div>
        <div>
          <label className="text-gray-500 text-xs font-medium uppercase tracking-wide block mb-1.5">Keywords <span className="text-gray-300 normal-case">(comma separated)</span></label>
          <textarea
            value={form.keywords}
            onChange={e => setForm(f => ({ ...f, keywords: e.target.value }))}
            placeholder="AI, observability, LLM..."
            rows={2}
            className="w-full bg-white/70 border border-gray-200 rounded-xl px-3 py-2 text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none placeholder:text-gray-300"
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <p className="text-red-500 text-sm bg-red-50 rounded-xl px-3 py-2 border border-red-100">{error}</p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 pt-1">
        <button type="submit" disabled={loading}
          className="flex-1 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white font-medium text-sm py-2.5 rounded-xl transition-colors shadow-md shadow-indigo-100">
          {loading ? 'Saving...' : 'Add to Content Plan'}
        </button>
        {onClose && (
          <button type="button" onClick={onClose}
            className="btn-glass px-4 py-2.5 rounded-xl text-sm font-medium text-gray-500">
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}
