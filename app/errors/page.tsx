import { supabaseAdmin as supabase } from '@/lib/supabase'
import { formatDistanceToNow } from 'date-fns'
import { ResolveErrorButton } from '@/components/ResolveErrorButton'

export const revalidate = 30

export default async function ErrorsPage() {
  const { data: errors } = await supabase
    .from('errors')
    .select('*')
    .order('occurred_at', { ascending: false })
    .limit(50)

  const openCount = (errors || []).filter((e: any) => e.status === 'open').length
  const resolvedCount = (errors || []).filter((e: any) => e.status === 'resolved').length

  return (
    <div className="space-y-6">
      <div className="fade-up flex items-end justify-between">
        <div>
          <h1 className="font-display text-[28px] font-semibold text-gray-900 tracking-tight">Errors</h1>
          <p className="text-gray-400 text-sm mt-1">
            {openCount > 0
              ? <span className="text-red-500 font-medium">{openCount} open</span>
              : <span className="text-emerald-500 font-medium">All clear</span>}
            {resolvedCount > 0 && <span className="text-gray-400"> · {resolvedCount} resolved</span>}
          </p>
        </div>
      </div>

      {(errors || []).length === 0 ? (
        <div className="glass rounded-2xl p-16 text-center fade-up">
          <p className="text-5xl mb-4">✅</p>
          <p className="text-gray-600 font-medium text-lg">No errors recorded</p>
          <p className="text-gray-400 text-sm mt-1">All workflows running healthy</p>
        </div>
      ) : (
        <div className="space-y-3 fade-up">
          {(errors || []).map((err: any) => (
            <div key={err.id} className={`glass rounded-2xl p-5 border-l-4 transition-opacity ${
              err.status === 'resolved' ? 'opacity-60 border-l-emerald-300' :
              err.status === 'open'     ? 'border-l-red-400' : 'border-l-gray-300'
            }`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <span className={`pill ${err.status === 'open' ? 'pill-red' : 'pill-green'}`}>
                      {err.status === 'open' && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse inline-block"/>}
                      {err.status}
                    </span>
                    <span className="text-gray-500 text-xs font-medium">{err.workflow_name || err.workflow_id}</span>
                    {err.node_name && <span className="text-gray-400 text-xs">→ {err.node_name}</span>}
                    {err.product_id && <span className="pill pill-violet">{err.product_id}</span>}
                  </div>
                  <p className="text-gray-800 text-sm font-medium leading-relaxed">{err.error_message}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <p className="text-gray-400 text-xs whitespace-nowrap">
                    {formatDistanceToNow(new Date(err.occurred_at), { addSuffix: true })}
                  </p>
                  {err.status === 'open' && <ResolveErrorButton id={err.id} />}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
