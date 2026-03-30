import { supabaseAdmin } from '@/lib/supabase'
import { DraftsClient } from '@/components/DraftsClient'

export const revalidate = 10

export default async function DraftsPage() {
  const [{ data: drafts }, { data: products }] = await Promise.all([
    supabaseAdmin
      .from('generated_content')
      .select('*, products!inner(name, channels)')
      .order('created_at', { ascending: false })
      .limit(100),
    supabaseAdmin
      .from('products')
      .select('id, name')
      .order('name'),
  ])

  const counts = {
    draft: (drafts || []).filter(d => d.status === 'draft').length,
    approved: (drafts || []).filter(d => d.status === 'approved').length,
    rejected: (drafts || []).filter(d => d.status === 'rejected').length,
    published: (drafts || []).filter(d => d.status === 'published').length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display font-bold text-gray-900 text-3xl">Drafts & Preview</h1>
          <p className="text-gray-500 text-sm mt-1">Review, edit, and approve generated content before publishing</p>
        </div>
        <div className="flex items-center gap-3">
          {[
            { label: 'drafts', count: counts.draft, color: 'text-amber-600 bg-amber-50 border-amber-200' },
            { label: 'approved', count: counts.approved, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
            { label: 'rejected', count: counts.rejected, color: 'text-red-500 bg-red-50 border-red-200' },
          ].map(s => (
            <div key={s.label} className={`px-3 py-1.5 rounded-xl border text-sm font-medium ${s.color}`}>
              <span className="text-lg font-display font-bold mr-1">{s.count}</span>
              {s.label}
            </div>
          ))}
        </div>
      </div>

      <DraftsClient
        initialDrafts={drafts || []}
        products={(products || []).map(p => ({ id: p.id, name: p.name }))}
      />
    </div>
  )
}
