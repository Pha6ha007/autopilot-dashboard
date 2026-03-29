import { supabaseAdmin as supabase } from '@/lib/supabase'
import { format, formatDistanceToNow } from 'date-fns'

export const revalidate = 30

export default async function WorkflowsPage() {
  const { data: runs } = await supabase
    .from('workflow_runs')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(50)

  return (
    <div className="space-y-6">
      <div className="fade-up">
        <h1 className="font-display text-[28px] font-semibold text-gray-900 tracking-tight">Workflow Runs</h1>
        <p className="text-gray-400 text-sm mt-1">{(runs || []).length} recent executions</p>
      </div>

      <div className="glass rounded-2xl overflow-hidden fade-up">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left text-gray-400 font-medium text-xs uppercase tracking-wide px-5 py-3.5">Workflow</th>
              <th className="text-left text-gray-400 font-medium text-xs uppercase tracking-wide px-5 py-3.5">Product</th>
              <th className="text-left text-gray-400 font-medium text-xs uppercase tracking-wide px-5 py-3.5">Status</th>
              <th className="text-left text-gray-400 font-medium text-xs uppercase tracking-wide px-5 py-3.5">Duration</th>
              <th className="text-left text-gray-400 font-medium text-xs uppercase tracking-wide px-5 py-3.5">Items</th>
              <th className="text-left text-gray-400 font-medium text-xs uppercase tracking-wide px-5 py-3.5">Started</th>
            </tr>
          </thead>
          <tbody>
            {(runs || []).length === 0 && (
              <tr><td colSpan={6} className="text-center text-gray-400 py-16">No workflow runs yet</td></tr>
            )}
            {(runs || []).map((run: any) => (
              <tr key={run.id} className="border-b border-gray-50 last:border-0 hover:bg-indigo-50/30 transition-colors">
                <td className="px-5 py-3.5">
                  <p className="text-gray-800 font-medium text-[13px]">{run.workflow_name || run.workflow_id}</p>
                  {run.error_message && (
                    <p className="text-red-400 text-xs mt-0.5 truncate max-w-xs">{run.error_message}</p>
                  )}
                </td>
                <td className="px-5 py-3.5 text-gray-500 text-[13px]">{run.product_id || <span className="text-gray-300">—</span>}</td>
                <td className="px-5 py-3.5">
                  <span className={`pill ${
                    run.status === 'success' ? 'pill-green' :
                    run.status === 'failed'  ? 'pill-red' :
                    run.status === 'running' ? 'pill-yellow' : 'pill-gray'
                  }`}>
                    {run.status === 'success' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"/>}
                    {run.status === 'failed'  && <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block"/>}
                    {run.status}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-gray-500 text-[13px]">
                  {run.duration_ms ? `${(run.duration_ms / 1000).toFixed(1)}s` : <span className="text-gray-300">—</span>}
                </td>
                <td className="px-5 py-3.5 text-gray-500 text-[13px]">
                  {run.items_processed || <span className="text-gray-300">0</span>}
                </td>
                <td className="px-5 py-3.5 text-gray-400 text-xs">
                  {formatDistanceToNow(new Date(run.started_at), { addSuffix: true })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
