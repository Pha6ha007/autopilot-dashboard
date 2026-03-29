'use client'
import { useState } from 'react'
import { formatDistanceToNow, format } from 'date-fns'

type WorkflowRun = {
  id: number
  workflow_id: string
  workflow_name: string | null
  product_id: string | null
  status: string
  started_at: string
  finished_at: string | null
  duration_ms: number | null
  items_processed: number
  error_message: string | null
}

const STATUS_CLS: Record<string, string> = {
  success: 'pill-green',
  failed:  'pill-red',
  running: 'pill-yellow',
  skipped: 'pill-gray',
}

const STATUS_DOT: Record<string, string> = {
  success: 'bg-emerald-500 shadow-[0_0_6px_#10b981]',
  failed:  'bg-red-500 shadow-[0_0_6px_#ef4444]',
  running: 'bg-amber-400 shadow-[0_0_6px_#f59e0b] animate-pulse',
  skipped: 'bg-gray-300',
}

export function WorkflowRunRow({ run }: { run: WorkflowRun }) {
  const [open, setOpen] = useState(false)

  return (
    <tr
      className={`border-b border-gray-50 last:border-0 cursor-pointer transition-colors ${open ? 'bg-indigo-50/30' : 'hover:bg-gray-50/50'}`}
      onClick={() => setOpen(o => !o)}
    >
      <td colSpan={6} className="p-0">
        {/* Summary row */}
        <div className="flex items-center gap-3 px-5 py-3.5">
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_DOT[run.status] || STATUS_DOT.skipped}`} />

          <div className="flex-1 min-w-0 grid grid-cols-6 gap-4 items-center">
            {/* Workflow name */}
            <div className="col-span-2 min-w-0">
              <p className="text-gray-800 font-medium text-[13px] truncate">
                {run.workflow_name || run.workflow_id}
              </p>
              {run.error_message && !open && (
                <p className="text-red-400 text-xs truncate mt-0.5">{run.error_message}</p>
              )}
            </div>

            {/* Product */}
            <div>
              <p className="text-gray-500 text-[13px]">{run.product_id || <span className="text-gray-300">—</span>}</p>
            </div>

            {/* Status */}
            <div>
              <span className={`pill ${STATUS_CLS[run.status] || 'pill-gray'}`}>
                {run.status}
              </span>
            </div>

            {/* Duration */}
            <div>
              <p className="text-gray-500 text-[13px]">
                {run.duration_ms ? `${(run.duration_ms / 1000).toFixed(1)}s` : <span className="text-gray-300">—</span>}
              </p>
            </div>

            {/* Time */}
            <div className="flex items-center justify-between gap-2">
              <p className="text-gray-400 text-xs">
                {formatDistanceToNow(new Date(run.started_at), { addSuffix: true })}
              </p>
              <span className={`text-gray-300 text-xs transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
            </div>
          </div>
        </div>

        {/* Expanded detail */}
        {open && (
          <div
            className="px-5 pb-4 pt-2 border-t border-gray-100/80 bg-white/40"
            onClick={e => e.stopPropagation()}
          >
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Workflow ID</p>
                <p className="text-gray-600 font-mono text-xs">{run.workflow_id}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Started</p>
                <p className="text-gray-700">{format(new Date(run.started_at), 'MMM d, HH:mm:ss')}</p>
              </div>
              {run.finished_at && (
                <div>
                  <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Finished</p>
                  <p className="text-gray-700">{format(new Date(run.finished_at), 'MMM d, HH:mm:ss')}</p>
                </div>
              )}
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Items processed</p>
                <p className="text-gray-700 font-semibold">{run.items_processed || 0}</p>
              </div>
            </div>

            {run.error_message && (
              <div className="mt-3 p-3 bg-red-50 rounded-xl border border-red-100">
                <p className="text-red-500 text-xs font-medium mb-1">Error</p>
                <p className="text-red-700 text-sm">{run.error_message}</p>
              </div>
            )}
          </div>
        )}
      </td>
    </tr>
  )
}
