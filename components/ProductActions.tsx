'use client'
import { useState, useCallback } from 'react'

export function ProductActions({ product }: {
  product: { id: string; name: string; paused?: boolean; archived?: boolean }
}) {
  const [paused, setPaused] = useState(product.paused || false)
  const [loading, setLoading] = useState(false)

  const togglePause = useCallback(async () => {
    setLoading(true)
    const resp = await fetch(`/api/products/${product.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paused: !paused }),
    })
    if (resp.ok) setPaused(!paused)
    setLoading(false)
  }, [product.id, paused])

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={togglePause}
        disabled={loading}
        className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all border ${
          paused
            ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100'
            : 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100'
        } disabled:opacity-50`}
      >
        {loading ? '…' : paused ? '▶ Resume' : '⏸ Pause'}
      </button>
      {paused && (
        <span className="text-xs text-amber-500 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
          paused — no content will be generated
        </span>
      )}
    </div>
  )
}
