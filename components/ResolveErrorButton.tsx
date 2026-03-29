'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function ResolveErrorButton({ id }: { id: number }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const resolve = async () => {
    setLoading(true)
    await fetch('/api/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: 'resolved' }),
    })
    setLoading(false)
    router.refresh()
  }

  return (
    <button
      onClick={resolve}
      disabled={loading}
      className="btn-glass text-xs px-3 py-1.5 rounded-lg font-medium text-gray-600 hover:text-emerald-600 disabled:opacity-50 transition-colors"
    >
      {loading ? '...' : 'Resolve'}
    </button>
  )
}
