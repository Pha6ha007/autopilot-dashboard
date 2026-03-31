'use client'
import { useState, useCallback } from 'react'

export function ProductActions({ product }: {
  product: { id: string; name: string; paused?: boolean; archived?: boolean }
}) {
  const [paused, setPaused] = useState(product.paused || false)
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState('')

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

  const syncPlatforms = useCallback(async () => {
    setSyncing(true)
    setSyncResult('')
    const resp = await fetch(`/api/products/${product.id}/sync-platforms`, { method: 'POST' })
    const data = await resp.json()
    setSyncResult(data.message || 'Done')
    setSyncing(false)
    setTimeout(() => setSyncResult(''), 5000)
  }, [product.id])

  return (
    <div className="space-y-2">
      {/* Status badge */}
      <span className={`pill ${paused ? 'pill-yellow' : 'pill-green'}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${paused ? 'bg-amber-500' : 'bg-emerald-500'} inline-block`}/>
        {paused ? 'paused' : 'active'}
      </span>

      {/* Action buttons */}
      <div className="flex items-center gap-2 flex-wrap">
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

      <button
        onClick={syncPlatforms}
        disabled={syncing}
        className="px-3 py-1.5 rounded-xl text-sm font-medium transition-all border bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100 disabled:opacity-50"
      >
        {syncing ? '⏳ Syncing…' : '🔄 Sync platforms'}
      </button>

      {paused && (
        <span className="text-xs text-amber-500 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
          paused — no content will be generated
        </span>
      )}
      {syncResult && (
        <span className="text-xs text-blue-500">{syncResult}</span>
      )}
      </div>
    </div>
  )
}
