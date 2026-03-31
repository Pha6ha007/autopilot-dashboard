'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'

type Result = {
  type: 'product' | 'draft' | 'plan' | 'published'
  id: string
  title: string
  subtitle?: string
  href: string
}

const TYPE_ICONS: Record<string, string> = {
  product: '📦',
  draft: '✏️',
  plan: '📅',
  published: '🚀',
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Keyboard shortcut: Cmd+K
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(true)
        setTimeout(() => inputRef.current?.focus(), 50)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  // Click outside
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Search with debounce
  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); return }
    setLoading(true)
    try {
      const resp = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
      if (resp.ok) {
        const data = await resp.json()
        setResults(data.results || [])
      }
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => search(query), 300)
    return () => clearTimeout(timer)
  }, [query, search])

  if (!open) {
    return (
      <button
        onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 50) }}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-gray-400 hover:text-gray-600 hover:bg-white/70 transition-all"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
        </svg>
        <span className="hidden lg:inline text-xs">Search</span>
        <kbd className="hidden lg:inline text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-400 font-mono">⌘K</kbd>
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-[99999] flex items-start justify-center pt-[15vh]" onClick={() => setOpen(false)}>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-md" />
      <div ref={containerRef} className="relative w-full max-w-xl mx-4" onClick={e => e.stopPropagation()}>
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200/50">
          {/* Input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-white/30">
            <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search posts, products, topics…"
              className="flex-1 bg-transparent outline-none text-sm text-gray-800 placeholder-gray-400"
              autoFocus
            />
            {loading && <span className="text-xs text-gray-400 animate-pulse">Searching…</span>}
            <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-400 font-mono">ESC</kbd>
          </div>

          {/* Results */}
          {results.length > 0 && (
            <div className="max-h-80 overflow-y-auto">
              {results.map((r, i) => (
                <Link
                  key={`${r.type}-${r.id}-${i}`}
                  href={r.href}
                  onClick={() => { setOpen(false); setQuery('') }}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
                >
                  <span className="text-base flex-shrink-0">{TYPE_ICONS[r.type] || '📝'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 font-medium truncate">{r.title}</p>
                    {r.subtitle && <p className="text-[11px] text-gray-400 truncate">{r.subtitle}</p>}
                  </div>
                  <span className="text-[10px] text-gray-300 capitalize flex-shrink-0">{r.type}</span>
                </Link>
              ))}
            </div>
          )}

          {query.length >= 2 && results.length === 0 && !loading && (
            <div className="px-4 py-6 text-center">
              <p className="text-sm text-gray-400">No results for &ldquo;{query}&rdquo;</p>
            </div>
          )}

          {query.length < 2 && (
            <div className="px-4 py-4 text-center">
              <p className="text-xs text-gray-400">Type at least 2 characters to search</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
