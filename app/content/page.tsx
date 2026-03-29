import { supabaseAdmin as supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import { ContentPlanRow } from '@/components/ContentPlanRow'

export const revalidate = 30

export default async function ContentPage() {
  const { data: plan } = await supabase
    .from('content_plan')
    .select('*, products(name)')
    .order('scheduled_for', { ascending: true })
    .limit(50)

  // Group by date
  const byDate: Record<string, any[]> = {}
  for (const item of plan || []) {
    const d = item.scheduled_for
    if (!byDate[d]) byDate[d] = []
    byDate[d].push(item)
  }

  const scheduled = (plan || []).filter(i => i.status === 'scheduled').length
  const generating = (plan || []).filter(i => i.status === 'generating').length

  return (
    <div className="space-y-6">
      <div className="fade-up">
        <h1 className="font-display text-[28px] font-semibold text-gray-900 tracking-tight">Content Plan</h1>
        <p className="text-gray-400 text-sm mt-1">
          {scheduled > 0 && <span>{scheduled} scheduled</span>}
          {generating > 0 && <span className="text-amber-500"> · {generating} generating</span>}
          {(plan || []).length === 0 && 'No content scheduled'}
          <span className="text-gray-300"> · click row to expand</span>
        </p>
      </div>

      <div className="space-y-6 fade-up">
        {Object.keys(byDate).length === 0 && (
          <div className="glass rounded-2xl p-16 text-center">
            <p className="text-gray-400">No content scheduled</p>
            <p className="text-gray-300 text-sm mt-1">WF-9 runs every Sunday at 18:00 UTC to generate the next week</p>
          </div>
        )}
        {Object.entries(byDate).map(([date, items]) => (
          <div key={date}>
            {/* Date divider */}
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center flex-shrink-0 shadow-sm shadow-indigo-200">
                <span className="text-white text-xs font-bold leading-none">{format(new Date(date), 'd')}</span>
              </div>
              <p className="text-sm font-semibold text-gray-700">
                {format(new Date(date), 'EEEE, MMMM d')}
              </p>
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-gray-400 text-xs">{items.length} item{items.length !== 1 ? 's' : ''}</span>
            </div>

            <div className="space-y-2 pl-11">
              {items.map((item: any) => (
                <ContentPlanRow key={item.id} item={item} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
