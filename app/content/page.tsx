import { supabaseAdmin as supabase } from '@/lib/supabase'
import { format } from 'date-fns'

export const revalidate = 30

const STATUS_COLOR: Record<string, string> = {
  published: 'bg-emerald-500/10 text-emerald-400',
  scheduled:  'bg-blue-500/10 text-blue-400',
  generating: 'bg-yellow-500/10 text-yellow-400',
  failed:     'bg-red-500/10 text-red-400',
  draft:      'bg-gray-500/10 text-gray-400',
}

export default async function ContentPage() {
  const { data: plan } = await supabase
    .from('content_plan')
    .select('*')
    .order('scheduled_for')
    .limit(50)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Content Plan</h1>
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left text-gray-500 font-medium px-4 py-3">Date</th>
              <th className="text-left text-gray-500 font-medium px-4 py-3">Product</th>
              <th className="text-left text-gray-500 font-medium px-4 py-3">Topic</th>
              <th className="text-left text-gray-500 font-medium px-4 py-3">Type</th>
              <th className="text-left text-gray-500 font-medium px-4 py-3">Platforms</th>
              <th className="text-left text-gray-500 font-medium px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {(plan || []).length === 0 && (
              <tr><td colSpan={6} className="text-center text-gray-500 py-12">No content planned yet</td></tr>
            )}
            {(plan || []).map((item: any) => (
              <tr key={item.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                <td className="px-4 py-3 text-gray-300 whitespace-nowrap">
                  {format(new Date(item.scheduled_for), 'MMM dd')}
                </td>
                <td className="px-4 py-3 text-indigo-400 capitalize">{item.product_id}</td>
                <td className="px-4 py-3 text-gray-200 max-w-xs truncate">{item.topic}</td>
                <td className="px-4 py-3 text-gray-400">{item.type}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {(item.platforms || []).slice(0, 3).map((p: string) => (
                      <span key={p} className="bg-gray-800 text-gray-400 text-xs px-1.5 py-0.5 rounded">{p}</span>
                    ))}
                    {(item.platforms || []).length > 3 && (
                      <span className="text-gray-500 text-xs">+{item.platforms.length - 3}</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${STATUS_COLOR[item.status] || STATUS_COLOR.draft}`}>
                    {item.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
