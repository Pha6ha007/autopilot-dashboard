import { supabaseAdmin as supabase } from '@/lib/supabase'
import { format } from 'date-fns'

export const revalidate = 30

export default async function ErrorsPage() {
  const { data: errors } = await supabase
    .from('errors')
    .select('*')
    .order('occurred_at', { ascending: false })
    .limit(50)

  const openCount = (errors || []).filter((e: any) => e.status === 'open').length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Errors</h1>
        {openCount > 0 && (
          <span className="bg-red-500/10 text-red-400 border border-red-500/20 text-sm px-3 py-1 rounded-full">
            {openCount} open
          </span>
        )}
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left text-gray-500 font-medium px-4 py-3">Workflow</th>
              <th className="text-left text-gray-500 font-medium px-4 py-3">Node</th>
              <th className="text-left text-gray-500 font-medium px-4 py-3">Error</th>
              <th className="text-left text-gray-500 font-medium px-4 py-3">Status</th>
              <th className="text-left text-gray-500 font-medium px-4 py-3">Time</th>
            </tr>
          </thead>
          <tbody>
            {(errors || []).length === 0 && (
              <tr><td colSpan={5} className="text-center text-gray-500 py-12">✅ No errors logged</td></tr>
            )}
            {(errors || []).map((err: any) => (
              <tr key={err.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                <td className="px-4 py-3 text-gray-300">{err.workflow_name || err.workflow_id || '—'}</td>
                <td className="px-4 py-3 text-gray-400">{err.node_name || '—'}</td>
                <td className="px-4 py-3 text-red-400 max-w-sm truncate">{err.error_message}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    err.status === 'resolved'
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'bg-red-500/10 text-red-400'
                  }`}>{err.status}</span>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {format(new Date(err.occurred_at), 'MMM dd HH:mm')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
