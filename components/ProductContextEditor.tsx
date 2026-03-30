'use client'
import { useState, useEffect, useCallback } from 'react'
import { StepProductContext, EMPTY_CONTEXT, type ProductContextData } from '@/components/add-product/StepProductContext'

export function ProductContextEditor({ productId }: { productId: string }) {
  const [data, setData] = useState<ProductContextData>(EMPTY_CONTEXT)
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/products/${productId}/context`)
      .then(r => r.json())
      .then(ctx => {
        if (ctx && ctx.product_id) {
          setData({
            positioning: ctx.positioning || '',
            target_audience: ctx.target_audience || '',
            pain_points: ctx.pain_points || '',
            key_features: ctx.key_features || [],
            competitors: ctx.competitors || '',
            differentiators: ctx.differentiators || '',
            cta: ctx.cta || '',
            tone_per_platform: ctx.tone_per_platform || {},
            github_repo: ctx.github_repo || '',
            raw_scrape: ctx.raw_scrape || '',
          })
        }
        setLoaded(true)
      })
      .catch(() => setLoaded(true))
  }, [productId])

  const save = useCallback(async () => {
    setSaving(true)
    setError('')
    setSaved(false)
    try {
      const resp = await fetch(`/api/products/${productId}/context`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!resp.ok) {
        const j = await resp.json()
        throw new Error(j.error || 'Save failed')
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setSaving(false)
    }
  }, [productId, data])

  if (!loaded) {
    return <div className="text-gray-400 text-sm py-8 text-center">Loading context…</div>
  }

  return (
    <div>
      <StepProductContext data={data} onChange={setData} />
      <div className="flex items-center gap-3 mt-6">
        <button
          onClick={save}
          disabled={saving}
          className="bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white font-medium text-sm px-5 py-2 rounded-xl transition-colors shadow-md shadow-indigo-100"
        >
          {saving ? 'Saving…' : 'Save Context'}
        </button>
        {saved && <span className="text-emerald-600 text-sm">✓ Saved</span>}
        {error && <span className="text-red-500 text-sm">{error}</span>}
      </div>
    </div>
  )
}
