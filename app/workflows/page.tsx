import { supabaseAdmin as supabase } from '@/lib/supabase'
import { WorkflowRunRow } from '@/components/WorkflowRunRow'

export const revalidate = 30

export default async function WorkflowsPage() {
  const { data: runs } = await supabase
    .from('workflow_runs')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(50)

  const successCount = (runs || []).filter(r => r.status === 'success').length
  const failedCount  = (runs || []).filter(r => r.status === 'failed').length

  return (
    <div className="space-y-6">
      <div className="fade-up">
        <h1 className="font-display text-[28px] font-semibold text-gray-900 tracking-tight">Workflow Runs</h1>
        <p className="text-gray-400 text-sm mt-1">
          {(runs || []).length} runs ·{' '}
          <span className="text-emerald-500">{successCount} success</span>
          {failedCount > 0 && <span className="text-red-500"> · {failedCount} failed</span>}
          <span className="text-gray-300"> · click row to expand</span>
        </p>
      </div>

      <div className="glass rounded-2xl overflow-hidden fade-up">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th colSpan={6}>
                <div className="flex items-center gap-4 px-5 py-3.5">
                  <div className="w-2 flex-shrink-0" />
                  <div className="flex-1 grid grid-cols-6 gap-4 text-left">
                    {['Workflow', 'Product', 'Status', 'Duration', 'Time', ''].map(h => (
                      <p key={h} className="text-gray-400 font-medium text-xs uppercase tracking-wide">{h}</p>
                    ))}
                  </div>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {(runs || []).length === 0 && (
              <tr>
                <td colSpan={6} className="text-center text-gray-400 py-16">No workflow runs yet</td>
              </tr>
            )}
            {(runs || []).map((run: any) => (
              <WorkflowRunRow key={run.id} run={run} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
