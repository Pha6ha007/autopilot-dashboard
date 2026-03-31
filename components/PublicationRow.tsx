'use client'
import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { PlatformIcon } from './PlatformIcon'

type Pub = {
  id: number
  product_id: string
  type: string
  topic: string
  platform: string
  status: string
  publish_url: string | null
  error_details: string | null
  published_at: string | null
  scheduled_for: string | null
  content_preview: string | null
  created_at: string
}

const STATUS_CLS: Record<string, string> = {
  published: 'pill-green',
  scheduled: 'pill-blue',
  failed:    'pill-red',
  generating:'pill-yellow',
  skipped:   'pill-gray',
}

const STATUS_DOT: Record<string, string> = {
  published: 'bg-emerald-500',
  scheduled: 'bg-blue-400',
  failed:    'bg-red-500',
  generating:'bg-amber-400',
  skipped:   'bg-gray-300',
}

export function PublicationRow({ pub }: { pub: Pub }) {
  const [open, setOpen] = useState(false)

  return (
    <div
      className={`border-b border-gray-100/80 last:border-0 cursor-pointer transition-colors ${open ? 'bg-indigo-50/20' : 'hover:bg-gray-50/50'} rounded-lg`}
      onClick={() => setOpen(o => !o)}
    >
      {/* Summary */}
      <div className="flex items-center gap-3 py-2.5 px-1">
        <PlatformIcon platform={pub.platform} size={20} />
        <div className="flex-1 min-w-0">
          <p className="text-[13px] text-gray-800 font-medium truncate">{pub.topic}</p>
          <p className="text-xs text-gray-400 mt-0.5" suppressHydrationWarning>
            {pub.product_id} · {pub.platform}
            {pub.published_at && (
              <> · {formatDistanceToNow(new Date(pub.published_at), { addSuffix: true })}</>
            )}
          </p>
        </div>
        {pub.publish_url && (
          <a href={pub.publish_url} target="_blank" rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="text-[10px] text-indigo-500 hover:text-indigo-700 flex-shrink-0">
            View ↗
          </a>
        )}
        <span className={`pill flex-shrink-0 ${STATUS_CLS[pub.status] || 'pill-gray'}`}>
          {pub.status}
        </span>
        <span className={`text-gray-300 text-xs flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
      </div>

      {/* Expanded */}
      {open && (
        <div
          className="px-2 pb-3 pt-1 border-t border-gray-100/60"
          onClick={e => e.stopPropagation()}
        >
          <div className="space-y-2">
            {pub.content_preview && (
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Preview</p>
                <p className="text-gray-600 text-xs leading-relaxed">{pub.content_preview}</p>
              </div>
            )}
            {pub.error_details && (
              <div className="p-2.5 bg-red-50 rounded-lg border border-red-100">
                <p className="text-red-500 text-xs font-medium mb-0.5">Error</p>
                <p className="text-red-700 text-xs">{pub.error_details}</p>
              </div>
            )}
            {pub.publish_url && (
              <a href={pub.publish_url} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-indigo-500 hover:text-indigo-700 text-xs font-medium transition-colors">
                View published post ↗
              </a>
            )}
            {pub.scheduled_for && pub.status === 'scheduled' && (
              <p className="text-gray-400 text-xs">Scheduled for: {pub.scheduled_for}</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
