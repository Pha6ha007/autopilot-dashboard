import { supabaseAdmin as supabase } from '@/lib/supabase'
import { formatDistanceToNow } from 'date-fns'

export const revalidate = 30

export default async function ErrorsPage() {
  const { data: errors } = await supabase
    .from('errors')
    .select('*')
    .order('occurred_at', { ascending: false })
    .limit(50)

  return (
    <div className="space-y-6">
      <div className="fade-up">
        <h1 className="font-display text-[28px] font-semibold text-gray-900 tracking-tight">Errors</h1>
        <p className="text-gray-400 text-sm mt-1">
          {(errors || []).filter((e: any) => e.status === 'open').length} open issues
        </p>
      </div>

      <div className="space-y-3 fade-up">
        {(errors || []).length === 0 && (
          <div className="glass rounded-2xl p-16 text-center">
            <p className="text-4xl mb-3">✅</p>
            <p className="text-gray-500 font-medium">No errors — all workflows healthy</p>
          </div>
        )}
        {(errors || []).map((err: any) => (
          <div key={err.id} className={`glass rounded-2xl p-5 border-l-4 ${
            err.status === 'open' ? 'border-l-red-400' :
            err.status === 'resolved' ? 'border-l-emerald-400' : 'border-l-gray-300'
          }`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`pill ${err.status === 'open' ? 'pill-red' : 'pill-green'}`}>
                    {err.status}
                  </span>
                  <span className="text-gray-400 text-xs">{err.workflow_name || err.workflow_id}</span>
                  {err.node_name && <span className="text-gray-300 text-xs">→ {err.node_name}</span>}
                  {err.product_id && <span className="pill pill-violet">{err.product_id}</span>}
                </div>
                <p className="text-gray-800 text-[13px] font-medium">{err.error_message}</p>
              </div>
              <p className="text-gray-400 text-xs flex-shrink-0">
                {formatDistanceToNow(new Date(err.occurred_at), { addSuffix: true })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
