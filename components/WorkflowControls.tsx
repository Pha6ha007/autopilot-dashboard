'use client'
import { useState, useCallback } from 'react'

type Workflow = { id: string; name: string; schedule: string }

export function WorkflowControls({ workflows }: { workflows: Workflow[] }) {
  const [loading, setLoading] = useState<Record<string, string>>({}) // id -> action
  const [results, setResults] = useState<Record<string, { ok: boolean; msg: string }>>({})

  const doAction = useCallback(async (wfId: string, action: string) => {
    setLoading(prev => ({ ...prev, [wfId]: action }))
    setResults(prev => ({ ...prev, [wfId]: undefined as any }))
    try {
      const resp = await fetch(`/api/workflows/${wfId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const data = await resp.json()
      setResults(prev => ({
        ...prev,
        [wfId]: { ok: resp.ok, msg: resp.ok ? `${action} ✓` : data.error || 'Failed' },
      }))
    } catch (e) {
      setResults(prev => ({ ...prev, [wfId]: { ok: false, msg: 'Network error' } }))
    }
    setLoading(prev => ({ ...prev, [wfId]: '' }))
    // Clear result after 4s
    setTimeout(() => setResults(prev => ({ ...prev, [wfId]: undefined as any })), 4000)
  }, [])

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 fade-up">
      {workflows.map(wf => {
        const isLoading = !!loading[wf.id]
        const result = results[wf.id]

        return (
          <div key={wf.id} className="glass rounded-xl p-4 flex flex-col gap-2">
            <div>
              <p className="text-sm font-semibold text-gray-800">{wf.name}</p>
              <p className="text-xs text-gray-400">{wf.schedule}</p>
            </div>

            <div className="flex items-center gap-2 mt-auto">
              <button
                onClick={() => doAction(wf.id, 'trigger')}
                disabled={isLoading}
                className="text-xs font-medium px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200 disabled:opacity-50 transition-colors"
              >
                {loading[wf.id] === 'trigger' ? '⏳' : '▶'} Run now
              </button>
              <button
                onClick={() => doAction(wf.id, 'activate')}
                disabled={isLoading}
                className="text-xs px-2 py-1 rounded-lg text-emerald-600 hover:bg-emerald-50 disabled:opacity-50"
              >
                Enable
              </button>
              <button
                onClick={() => doAction(wf.id, 'deactivate')}
                disabled={isLoading}
                className="text-xs px-2 py-1 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 disabled:opacity-50"
              >
                Disable
              </button>
            </div>

            {result && (
              <p className={`text-xs ${result.ok ? 'text-emerald-500' : 'text-red-500'}`}>
                {result.msg}
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}
