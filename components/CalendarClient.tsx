'use client'
import { useState, useCallback, useMemo } from 'react'
import { PlatformIcon } from './PlatformIcon'

type CalendarItem = {
  id: number
  product_id: string
  topic: string
  type: string
  platforms: string[]
  scheduled_for: string
  status: string
  products?: { name: string }
}

type Props = {
  initialItems: CalendarItem[]
  products: { id: string; name: string }[]
}

const STATUS_COLORS: Record<string, string> = {
  scheduled: 'bg-blue-100 border-blue-300 text-blue-800',
  generating: 'bg-yellow-100 border-yellow-300 text-yellow-800',
  published: 'bg-emerald-100 border-emerald-300 text-emerald-800',
  failed: 'bg-red-100 border-red-300 text-red-700',
  draft: 'bg-gray-100 border-gray-300 text-gray-700',
}

const TYPE_ICONS: Record<string, string> = {
  article: '📄',
  post: '✏️',
  youtube: '🎬',
  short: '📱',
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December']

function getMonday(d: Date): Date {
  const date = new Date(d)
  const day = date.getDay()
  const diff = day === 0 ? -6 : 1 - day
  date.setDate(date.getDate() + diff)
  date.setHours(0, 0, 0, 0)
  return date
}

function dateKey(d: Date): string {
  return d.toISOString().split('T')[0]
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

export function CalendarClient({ initialItems, products }: Props) {
  const [items, setItems] = useState(initialItems)
  const [weekOffset, setWeekOffset] = useState(0)
  const [filterProduct, setFilterProduct] = useState('')
  const [rescheduleId, setRescheduleId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)

  const today = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  const weekStart = useMemo(() => addDays(getMonday(today), weekOffset * 7), [today, weekOffset])

  const days = useMemo(() =>
    Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart])

  const currentMonth = days[3].getMonth()
  const currentYear = days[3].getFullYear()

  // Group items by date
  const byDate = useMemo(() => {
    const map: Record<string, CalendarItem[]> = {}
    for (const item of items) {
      if (filterProduct && item.product_id !== filterProduct) continue
      const key = item.scheduled_for
      if (!map[key]) map[key] = []
      map[key].push(item)
    }
    return map
  }, [items, filterProduct])

  const reschedule = useCallback(async (id: number, newDate: string) => {
    setSaving(true)
    const resp = await fetch('/api/content', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, scheduled_for: newDate }),
    })
    if (resp.ok) {
      setItems(prev => prev.map(i => i.id === id ? { ...i, scheduled_for: newDate } : i))
    }
    setRescheduleId(null)
    setSaving(false)
  }, [])

  return (
    <div>
      {/* Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setWeekOffset(w => w - 1)}
            className="w-8 h-8 rounded-lg glass-hover flex items-center justify-center text-gray-500 hover:text-gray-900"
          >
            ←
          </button>
          <h2 className="font-display font-semibold text-gray-800 text-lg min-w-[200px] text-center">
            {MONTHS[currentMonth]} {currentYear}
          </h2>
          <button
            onClick={() => setWeekOffset(w => w + 1)}
            className="w-8 h-8 rounded-lg glass-hover flex items-center justify-center text-gray-500 hover:text-gray-900"
          >
            →
          </button>
          {weekOffset !== 0 && (
            <button
              onClick={() => setWeekOffset(0)}
              className="text-xs text-indigo-500 hover:text-indigo-700 font-medium ml-2"
            >
              Today
            </button>
          )}
        </div>

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
      </div>

      {/* Calendar grid */}
      <div className="glass rounded-2xl overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-white/30">
          {days.map((day, i) => {
            const isToday = dateKey(day) === dateKey(today)
            return (
              <div key={i} className={`text-center py-2.5 border-r border-white/20 last:border-r-0 ${isToday ? 'bg-indigo-50/50' : ''}`}>
                <p className="text-[10px] uppercase tracking-wider text-gray-400 font-medium">{DAYS[i]}</p>
                <p className={`text-lg font-display font-semibold ${isToday ? 'text-indigo-600' : 'text-gray-800'}`}>
                  {day.getDate()}
                </p>
              </div>
            )
          })}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 min-h-[400px]">
          {days.map((day, i) => {
            const key = dateKey(day)
            const dayItems = byDate[key] || []
            const isToday = key === dateKey(today)
            const isPast = day < today

            return (
              <div
                key={i}
                className={`border-r border-white/20 last:border-r-0 p-1.5 ${
                  isToday ? 'bg-indigo-50/30' : isPast ? 'bg-gray-50/30' : ''
                }`}
              >
                <div className="space-y-1">
                  {dayItems.map(item => (
                    <div
                      key={item.id}
                      onClick={() => {
                        if (rescheduleId === item.id) {
                          setRescheduleId(null)
                        } else {
                          setRescheduleId(item.id)
                        }
                      }}
                      className={`rounded-lg px-2 py-1.5 text-[11px] leading-tight border cursor-pointer transition-all hover:shadow-sm ${
                        rescheduleId === item.id
                          ? 'ring-2 ring-indigo-400 shadow-md'
                          : ''
                      } ${STATUS_COLORS[item.status] || STATUS_COLORS.draft}`}
                    >
                      <div className="flex items-center gap-1 mb-0.5">
                        <span>{TYPE_ICONS[item.type] || '📝'}</span>
                        <span className="font-semibold truncate">{item.products?.name || item.product_id}</span>
                      </div>
                      <p className="text-[10px] truncate opacity-80">{item.topic}</p>
                      {item.platforms && (
                        <div className="flex gap-0.5 mt-1">
                          {item.platforms.slice(0, 3).map(p => (
                            <PlatformIcon key={p} platform={p} size={12} />
                          ))}
                          {item.platforms.length > 3 && (
                            <span className="text-[9px] text-gray-400">+{item.platforms.length - 3}</span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Reschedule bar */}
      {rescheduleId && (
        <div className="glass rounded-xl p-3 mt-3 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
          <span className="text-sm text-gray-600">
            Move <strong>{items.find(i => i.id === rescheduleId)?.topic?.slice(0, 40)}</strong> to:
          </span>
          <div className="flex gap-1">
            {days.map((day, i) => {
              const key = dateKey(day)
              const current = items.find(i => i.id === rescheduleId)
              const isCurrent = current?.scheduled_for === key
              return (
                <button
                  key={i}
                  onClick={() => !isCurrent && reschedule(rescheduleId, key)}
                  disabled={saving || isCurrent}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                    isCurrent
                      ? 'bg-indigo-100 text-indigo-600 cursor-default'
                      : 'bg-white/60 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 border border-gray-200'
                  } disabled:opacity-50`}
                >
                  {DAYS[i]} {day.getDate()}
                </button>
              )
            })}
          </div>
          <button
            onClick={() => setRescheduleId(null)}
            className="text-gray-400 hover:text-gray-600 ml-auto"
          >
            ✕
          </button>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 text-xs text-gray-400">
        {Object.entries(STATUS_COLORS).map(([status, cls]) => (
          <div key={status} className="flex items-center gap-1.5">
            <span className={`w-3 h-3 rounded border ${cls}`} />
            <span className="capitalize">{status}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
