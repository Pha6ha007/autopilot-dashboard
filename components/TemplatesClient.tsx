'use client'
import { useState, useCallback } from 'react'
import { PlatformIcon } from './PlatformIcon'

type Template = {
  id: string
  name: string
  description: string
  structure: string
  example: string
  icon: string
}

type ToneExample = {
  id: string
  product_id: string
  platform: string
  content: string
  is_good: boolean
  notes?: string
  products?: { name: string }
}

type Props = {
  templates: Template[]
  toneExamples: ToneExample[]
  products: { id: string; name: string; channels: string[] }[]
}

export function TemplatesClient({ templates, toneExamples: initialExamples, products }: Props) {
  const [examples, setExamples] = useState(initialExamples)
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null)

  // Add tone example form
  const [showAddExample, setShowAddExample] = useState(false)
  const [newExample, setNewExample] = useState({ product_id: '', platform: '', content: '', is_good: true, notes: '' })
  const [saving, setSaving] = useState(false)
  const [filterProduct, setFilterProduct] = useState('')

  const filteredExamples = filterProduct
    ? examples.filter(e => e.product_id === filterProduct)
    : examples

  const selectedProduct = products.find(p => p.id === newExample.product_id)

  const handleAddExample = useCallback(async () => {
    if (!newExample.product_id || !newExample.platform || !newExample.content.trim()) return
    setSaving(true)
    const resp = await fetch('/api/tone-examples', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newExample),
    })
    if (resp.ok) {
      const { example } = await resp.json()
      example.products = { name: products.find(p => p.id === example.product_id)?.name || '' }
      setExamples(prev => [example, ...prev])
      setNewExample({ product_id: '', platform: '', content: '', is_good: true, notes: '' })
      setShowAddExample(false)
    }
    setSaving(false)
  }, [newExample, products])

  const handleDeleteExample = useCallback(async (id: string) => {
    await fetch('/api/tone-examples', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setExamples(prev => prev.filter(e => e.id !== id))
  }, [])

  return (
    <div className="space-y-8">
      {/* Templates section */}
      <div>
        <h2 className="font-display font-semibold text-gray-800 text-lg mb-3">Content Templates</h2>
        <p className="text-xs text-gray-400 mb-4">Each template defines a content structure. Used in content_plan and by LLM during generation.</p>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {templates.map(t => (
            <div
              key={t.id}
              onClick={() => setExpandedTemplate(expandedTemplate === t.id ? null : t.id)}
              className={`glass rounded-xl p-4 cursor-pointer transition-all hover:shadow-md ${
                expandedTemplate === t.id ? 'ring-2 ring-indigo-300 shadow-md' : ''
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{t.icon}</span>
                <span className="text-sm font-semibold text-gray-800 capitalize">{t.name}</span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">{t.description}</p>

              {expandedTemplate === t.id && (
                <div className="mt-3 pt-3 border-t border-gray-100/80 space-y-2">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-gray-400 font-medium mb-1">Structure</p>
                    <p className="text-xs text-gray-600 leading-relaxed">{t.structure}</p>
                  </div>
                  {t.example && (
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-gray-400 font-medium mb-1">Example</p>
                      <p className="text-xs text-gray-600 leading-relaxed bg-gray-50/50 rounded-lg p-2 border border-gray-100">{t.example}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Tone examples section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-display font-semibold text-gray-800 text-lg">Tone Examples</h2>
            <p className="text-xs text-gray-400 mt-0.5">Posts you like — LLM sees these as reference for style and voice</p>
          </div>
          <div className="flex items-center gap-3">
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
            <button
              onClick={() => setShowAddExample(true)}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors"
            >
              + Add example
            </button>
          </div>
        </div>

        {/* Add example form */}
        {showAddExample && (
          <div className="glass rounded-xl p-4 mb-4 space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="field-label">Product *</label>
                <select
                  value={newExample.product_id}
                  onChange={e => setNewExample(prev => ({ ...prev, product_id: e.target.value, platform: '' }))}
                  className="field-input text-sm"
                >
                  <option value="">Select…</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="field-label">Platform *</label>
                <select
                  value={newExample.platform}
                  onChange={e => setNewExample(prev => ({ ...prev, platform: e.target.value }))}
                  className="field-input text-sm"
                >
                  <option value="">Select…</option>
                  {(selectedProduct?.channels || []).map(ch => (
                    <option key={ch} value={ch}>{ch}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="field-label">Type</label>
                <div className="flex gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setNewExample(prev => ({ ...prev, is_good: true }))}
                    className={`px-3 py-1 rounded-lg text-xs font-medium border transition-all ${
                      newExample.is_good ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'text-gray-400 border-gray-200'
                    }`}
                  >
                    👍 Good example
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewExample(prev => ({ ...prev, is_good: false }))}
                    className={`px-3 py-1 rounded-lg text-xs font-medium border transition-all ${
                      !newExample.is_good ? 'bg-red-50 text-red-500 border-red-200' : 'text-gray-400 border-gray-200'
                    }`}
                  >
                    👎 Bad example
                  </button>
                </div>
              </div>
            </div>
            <div>
              <label className="field-label">Post content *</label>
              <textarea
                value={newExample.content}
                onChange={e => setNewExample(prev => ({ ...prev, content: e.target.value }))}
                rows={4}
                placeholder="Paste a post that represents the tone you want (or don't want)…"
                className="field-input text-sm resize-none"
              />
            </div>
            <div>
              <label className="field-label">Notes (optional)</label>
              <input
                type="text"
                value={newExample.notes}
                onChange={e => setNewExample(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Why this is a good/bad example"
                className="field-input text-sm"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowAddExample(false)}
                className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5"
              >
                Cancel
              </button>
              <button
                onClick={handleAddExample}
                disabled={saving || !newExample.product_id || !newExample.platform || !newExample.content.trim()}
                className="text-sm font-medium text-white bg-indigo-500 hover:bg-indigo-600 px-4 py-1.5 rounded-lg disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save Example'}
              </button>
            </div>
          </div>
        )}

        {/* Examples list */}
        <div className="space-y-2">
          {filteredExamples.length === 0 && (
            <div className="glass rounded-xl p-8 text-center">
              <p className="text-gray-400 text-sm">No tone examples yet</p>
              <p className="text-gray-300 text-xs mt-1">Add posts you like as reference for AI generation</p>
            </div>
          )}
          {filteredExamples.map(ex => (
            <div key={ex.id} className={`glass rounded-xl p-4 border-l-4 ${
              ex.is_good ? 'border-l-emerald-400' : 'border-l-red-400'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold text-gray-700">{ex.products?.name || ex.product_id}</span>
                <PlatformIcon platform={ex.platform} size={14} />
                <span className="text-xs text-gray-400 capitalize">{ex.platform}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  ex.is_good ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
                }`}>
                  {ex.is_good ? '👍 good' : '👎 bad'}
                </span>
                <button
                  onClick={() => handleDeleteExample(ex.id)}
                  className="ml-auto text-gray-300 hover:text-red-500 text-xs"
                >
                  ✕
                </button>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{ex.content}</p>
              {ex.notes && (
                <p className="text-xs text-gray-400 mt-2 italic">{ex.notes}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
