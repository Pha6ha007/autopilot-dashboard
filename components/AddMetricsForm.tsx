'use client'
import { useState, useCallback } from 'react'
import { PlatformIcon } from './PlatformIcon'

type Publication = {
  id: number
  product_id: string
  platform: string
  title: string
}

type Props = {
  products: { id: string; name: string }[]
  publications: Publication[]
  onSaved?: () => void
}

export function AddMetricsForm({ products, publications, onSaved }: Props) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    product_id: '',
    platform: '',
    publication_id: '',
    views: '',
    likes: '',
    comments: '',
    shares: '',
    clicks: '',
    impressions: '',
  })

  const filteredPubs = publications.filter(p =>
    (!form.product_id || p.product_id === form.product_id) &&
    (!form.platform || p.platform === form.platform)
  )

  const platforms = form.product_id
    ? [...new Set(publications.filter(p => p.product_id === form.product_id).map(p => p.platform))]
    : [...new Set(publications.map(p => p.platform))]

  const handleSave = useCallback(async () => {
    if (!form.product_id || !form.platform) return
    setSaving(true)
    setError('')
    setSaved(false)

    const body: Record<string, unknown> = {
      product_id: form.product_id,
      platform: form.platform,
      views: parseInt(form.views) || 0,
      likes: parseInt(form.likes) || 0,
      comments: parseInt(form.comments) || 0,
      shares: parseInt(form.shares) || 0,
      clicks: parseInt(form.clicks) || 0,
      impressions: parseInt(form.impressions) || 0,
    }
    if (form.publication_id) body.publication_id = parseInt(form.publication_id)

    const resp = await fetch('/api/metrics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (resp.ok) {
      setSaved(true)
      setForm(prev => ({ ...prev, views: '', likes: '', comments: '', shares: '', clicks: '', impressions: '', publication_id: '' }))
      onSaved?.()
      setTimeout(() => setSaved(false), 3000)
    } else {
      const data = await resp.json()
      setError(data.error || 'Failed to save')
    }
    setSaving(false)
  }, [form, onSaved])

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-sm font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors"
      >
        + Add metrics
      </button>
    )
  }

  return (
    <div className="glass rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-800">Add Metrics</p>
        <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 text-xs">✕</button>
      </div>

      {/* Product + Platform + Publication */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="field-label">Product *</label>
          <select
            value={form.product_id}
            onChange={e => setForm(prev => ({ ...prev, product_id: e.target.value, platform: '', publication_id: '' }))}
            className="field-input text-sm"
          >
            <option value="">Select…</option>
            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label className="field-label">Platform *</label>
          <select
            value={form.platform}
            onChange={e => setForm(prev => ({ ...prev, platform: e.target.value, publication_id: '' }))}
            className="field-input text-sm"
          >
            <option value="">Select…</option>
            {platforms.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <label className="field-label">Publication <span className="text-gray-400 font-normal">(optional)</span></label>
          <select
            value={form.publication_id}
            onChange={e => setForm(prev => ({ ...prev, publication_id: e.target.value }))}
            className="field-input text-sm"
          >
            <option value="">General metrics</option>
            {filteredPubs.slice(0, 20).map(p => (
              <option key={p.id} value={String(p.id)}>{p.title?.slice(0, 40) || `#${p.id}`}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Metrics inputs */}
      <div className="grid grid-cols-6 gap-2">
        {(['views', 'likes', 'comments', 'shares', 'clicks', 'impressions'] as const).map(field => (
          <div key={field}>
            <label className="text-[10px] uppercase tracking-wider text-gray-400 font-medium">{field}</label>
            <input
              type="number"
              min="0"
              value={form[field]}
              onChange={e => setForm(prev => ({ ...prev, [field]: e.target.value }))}
              placeholder="0"
              className="field-input text-sm py-1.5 text-center"
            />
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving || !form.product_id || !form.platform}
          className="text-sm font-medium text-white bg-indigo-500 hover:bg-indigo-600 px-4 py-1.5 rounded-lg disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save Metrics'}
        </button>
        <button onClick={() => setOpen(false)} className="text-sm text-gray-500 hover:text-gray-700">Cancel</button>
        {saved && <span className="text-xs text-emerald-500">✓ Saved</span>}
        {error && <span className="text-xs text-red-500">{error}</span>}

        {form.platform && (
          <div className="ml-auto flex items-center gap-1.5 text-xs text-gray-400">
            <PlatformIcon platform={form.platform} size={14} />
            {form.product_id && <span>{products.find(p => p.id === form.product_id)?.name}</span>}
          </div>
        )}
      </div>
    </div>
  )
}
