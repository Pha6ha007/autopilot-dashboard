import { supabaseAdmin as supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import { PlatformIcon } from '@/components/PlatformIcon'

export const revalidate = 30

const STATUS_CLS: Record<string, string> = {
  scheduled: 'pill-blue',
  generating: 'pill-yellow',
  published: 'pill-green',
  failed: 'pill-red',
  draft: 'pill-gray',
}

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

  return (
    <div className="space-y-6">
      <div className="fade-up">
        <h1 className="font-display text-[28px] font-semibold text-gray-900 tracking-tight">Content Plan</h1>
        <p className="text-gray-400 text-sm mt-1">{(plan || []).length} items scheduled</p>
      </div>

      <div className="space-y-6 fade-up">
        {Object.keys(byDate).length === 0 && (
          <div className="glass rounded-2xl p-16 text-center">
            <p className="text-gray-400">No content scheduled</p>
          </div>
        )}
        {Object.entries(byDate).map(([date, items]) => (
          <div key={date}>
            <p className="text-sm font-semibold text-gray-500 mb-2 flex items-center gap-2">
              <span className="w-6 h-px bg-gray-200 inline-block"/>
              {format(new Date(date), 'EEEE, MMMM d')}
              <span className="w-6 h-px bg-gray-200 inline-block"/>
            </p>
            <div className="space-y-2">
              {items.map((item: any) => (
                <div key={item.id} className="glass glass-hover rounded-xl p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`pill ${STATUS_CLS[item.status] || 'pill-gray'}`}>{item.status}</span>
                        <span className="text-gray-400 text-xs">{item.type}</span>
                        {item.products?.name && (
                          <span className="pill pill-violet">{item.products.name}</span>
                        )}
                      </div>
                      <p className="text-gray-800 font-medium text-[14px]">{item.topic}</p>
                      {item.notes && <p className="text-gray-400 text-xs mt-1">{item.notes}</p>}
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0">
                      {(item.platforms || []).map((p: string) => (
                        <PlatformIcon key={p} platform={p} size={20}/>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
