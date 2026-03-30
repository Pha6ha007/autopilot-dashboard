import { supabaseAdmin } from '@/lib/supabase'
import { CalendarClient } from '@/components/CalendarClient'

export const revalidate = 15

export default async function CalendarPage() {
  // Fetch 60 days of content plan
  const today = new Date()
  const start = new Date(today)
  start.setDate(start.getDate() - 7) // 1 week back
  const end = new Date(today)
  end.setDate(end.getDate() + 53) // ~8 weeks forward

  const [{ data: items }, { data: products }] = await Promise.all([
    supabaseAdmin
      .from('content_plan')
      .select('*, products!inner(name)')
      .gte('scheduled_for', start.toISOString().split('T')[0])
      .lte('scheduled_for', end.toISOString().split('T')[0])
      .order('scheduled_for'),
    supabaseAdmin
      .from('products')
      .select('id, name')
      .eq('archived', false)
      .order('name'),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-gray-900 text-3xl">Calendar</h1>
        <p className="text-gray-500 text-sm mt-1">Visual content schedule — click dates to add, click items to edit</p>
      </div>
      <CalendarClient
        initialItems={items || []}
        products={(products || []).map(p => ({ id: p.id, name: p.name }))}
      />
    </div>
  )
}
