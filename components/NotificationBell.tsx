'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'

type Notification = {
  type: string
  icon: string
  title: string
  href: string
  count: number
  priority: string
  details?: { workflow: string; message: string; time: string }[]
}

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [data, setData] = useState<{ notifications: Notification[]; totalCount: number; hasUrgent: boolean } | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  const fetchNotifications = useCallback(async () => {
    try {
      const resp = await fetch('/api/notifications')
      if (resp.ok) setData(await resp.json())
    } catch {}
  }, [])

  // Poll every 30s
  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  // Click outside to close
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const total = data?.totalCount || 0
  const hasUrgent = data?.hasUrgent || false

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => { setOpen(!open); if (!open) fetchNotifications() }}
        className="relative w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-white/70 transition-all"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
        </svg>
        {total > 0 && (
          <span className={`absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-bold text-white px-1 ${
            hasUrgent ? 'bg-red-500 animate-pulse' : 'bg-indigo-500'
          }`}>
            {total > 99 ? '99+' : total}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-10 w-80 glass rounded-xl shadow-2xl shadow-indigo-100/40 border border-white/40 overflow-hidden z-50">
          <div className="px-4 py-2.5 border-b border-white/30 bg-white/20">
            <p className="text-sm font-semibold text-gray-800">Notifications</p>
          </div>

          {(!data || data.notifications.length === 0) ? (
            <div className="px-4 py-8 text-center">
              <p className="text-gray-400 text-sm">All clear ✓</p>
              <p className="text-gray-300 text-xs mt-0.5">No pending items</p>
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto">
              {data.notifications.map(n => (
                <Link
                  key={n.type}
                  href={n.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-start gap-3 px-4 py-3 border-b border-gray-100/60 hover:bg-white/40 transition-colors ${
                    n.priority === 'high' ? 'bg-red-50/30' : ''
                  }`}
                >
                  <span className="text-lg flex-shrink-0 mt-0.5">{n.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800">{n.title}</p>
                    {n.details && n.details.length > 0 && (
                      <div className="mt-1 space-y-0.5">
                        {n.details.slice(0, 3).map((d, i) => (
                          <p key={i} className="text-[11px] text-gray-400 truncate">
                            {d.workflow}: {d.message}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className={`text-xs font-bold rounded-full px-2 py-0.5 flex-shrink-0 ${
                    n.priority === 'high' ? 'bg-red-100 text-red-600' :
                    n.priority === 'medium' ? 'bg-amber-100 text-amber-600' :
                    'bg-gray-100 text-gray-500'
                  }`}>
                    {n.count}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
