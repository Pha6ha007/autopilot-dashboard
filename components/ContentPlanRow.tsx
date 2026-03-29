'use client'
import { useState } from 'react'
import { format } from 'date-fns'
import { PlatformIcon } from './PlatformIcon'

type ContentItem = {
  id: number
  product_id: string
  type: string
  topic: string
  platforms: string[]
  status: string
  scheduled_for: string
  notes: string | null
  keywords: string[] | null
  products?: { name: string } | null
}

const STATUS_CLS: Record<string, string> = {
  scheduled:  'pill-blue',
  generating: 'pill-yellow',
  published:  'pill-green',
  failed:     'pill-red',
  draft:      'pill-gray',
}

const TYPE_ICON: Record<string, string> = {
  youtube:  '🎬',
  article:  '📝',
  post:     '✍️',
  video:    '🎥',
  reel:     '📱',
  thread:   '🧵',
}

export function ContentPlanRow({ item }: { item: ContentItem }) {
  const [open, setOpen] = useState(false)

  return (
    <div
      className={`glass glass-hover rounded-xl overflow-hidden transition-all ${open ? 'ring-1 ring-indigo-200' : ''}`}
      onClick={() => setOpen(o => !o)}
    >
      {/* Row */}
      <div className="flex items-center gap-4 p-4 cursor-pointer select-none">
        {/* Type icon */}
        <span className="text-xl flex-shrink-0 w-7 text-center">
          {TYPE_ICON[item.type] || '📄'}
        </span>

        {/* Main info */}
        <div className="flex-1 min-w-0">
          <p className="text-gray-800 font-medium text-[14px] truncate">{item.topic}</p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className={`pill ${STATUS_CLS[item.status] || 'pill-gray'}`}>{item.status}</span>
            <span className="text-gray-400 text-xs">{item.type}</span>
            {item.products?.name && (
              <span className="pill pill-violet">{item.products.name}</span>
            )}
          </div>
        </div>

        {/* Platform icons */}
        <div className="flex gap-1.5 flex-shrink-0">
          {(item.platforms || []).slice(0, 4).map(p => (
            <PlatformIcon key={p} platform={p} size={20} />
          ))}
          {(item.platforms || []).length > 4 && (
            <span className="text-gray-400 text-xs self-center">+{item.platforms.length - 4}</span>
          )}
        </div>

        {/* Chevron */}
        <span className={`text-gray-300 text-sm flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}>
          ▾
        </span>
      </div>

      {/* Expanded detail */}
      {open && (
        <div
          className="px-5 pb-4 pt-1 border-t border-gray-100/80 bg-white/30"
          onClick={e => e.stopPropagation()}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Left */}
            <div className="space-y-3">
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Topic</p>
                <p className="text-gray-800 text-sm font-medium">{item.topic}</p>
              </div>

              {item.notes && (
                <div>
                  <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Notes</p>
                  <p className="text-gray-600 text-sm">{item.notes}</p>
                </div>
              )}

              {item.keywords && item.keywords.length > 0 && (
                <div>
                  <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Keywords</p>
                  <div className="flex flex-wrap gap-1">
                    {item.keywords.map(k => (
                      <span key={k} className="pill pill-gray text-[11px]">{k}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right */}
            <div className="space-y-3">
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Scheduled</p>
                <p className="text-gray-800 text-sm font-medium">
                  {format(new Date(item.scheduled_for), 'EEEE, MMMM d, yyyy')}
                </p>
              </div>

              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Platforms</p>
                <div className="flex gap-2 flex-wrap">
                  {(item.platforms || []).map(p => (
                    <span key={p} className="platform-pill">
                      <PlatformIcon platform={p} size={13} />
                      <span className="capitalize">{p}</span>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Type</p>
                <span className="text-gray-700 text-sm capitalize">
                  {TYPE_ICON[item.type]} {item.type}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
