import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'

export const revalidate = 30

export default async function WorkflowsPage() {
  const { data: runs } = await supabase
    .from('workflow_runs')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(50)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Workflow Runs</h1>
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left text-gray-500 font-medium px-4 py-3">Workflow</th>
              <th className="text-left text-gray-500 font-medium px-4 py-3">Product</th>
              <th className="text-left text-gray-500 font-medium px-4 py-3">Status</th>
              <th className="text-left text-gray-500 font-medium px-4 py-3">Duration</th>
              <th className="text-left text-gray-500 font-medium px-4 py-3">Items</th>
              <th className="text-left text-gray-500 font-medium px-4 py-3">Started</th>
            </tr>
          </thead>
          <tbody>
            {(runs || []).length === 0 && (
              <tr><td colSpan={6} className="text-center text-gray-500 py-12">No workflow runs yet</td></tr>
            )}
            {(runs || []).map((run: any) => (
              <tr key={run.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                <td className="px-4 py-3 text-gray-200">{run.workflow_name || run.workflow_id}</td>
                <td className="px-4 py-3 text-gray-400">{run.product_id || '—'}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    run.status === 'success' ? 'bg-emerald-500/10 text-emerald-400' :
                    run.status === 'failed'  ? 'bg-red-500/10 text-red-400' :
                    'bg-yellow-500/10 text-yellow-400'
                  }`}>{run.status}</span>
                </td>
                <td className="px-4 py-3 text-gray-400">
                  {run.duration_ms ? `${(run.duration_ms / 1000).toFixed(1)}s` : '—'}
                </td>
                <td className="px-4 py-3 text-gray-400">{run.items_processed || 0}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {format(new Date(run.started_at), 'MMM dd HH:mm')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
