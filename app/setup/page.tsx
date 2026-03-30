import { supabaseAdmin } from '@/lib/supabase'
import { PlatformSetupClient } from '@/components/PlatformSetupClient'

export const revalidate = 15

export default async function PlatformSetupPage() {
  const [{ data: accounts }, { data: products }] = await Promise.all([
    supabaseAdmin
      .from('platform_accounts')
      .select('*')
      .order('product_id')
      .order('priority'),
    supabaseAdmin
      .from('products')
      .select('id, name')
      .eq('archived', false)
      .order('name'),
  ])

  const counts = {
    total: (accounts || []).length,
    not_started: (accounts || []).filter(a => a.status === 'not_started').length,
    registered: (accounts || []).filter(a => a.status === 'registered').length,
    active: (accounts || []).filter(a => a.status === 'active').length,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display font-bold text-gray-900 text-3xl">Platform Setup</h1>
          <p className="text-gray-500 text-sm mt-1">Track registration progress across all products and platforms</p>
        </div>
        <div className="flex items-center gap-3">
          {[
            { label: 'not started', count: counts.not_started, color: 'text-gray-500 bg-gray-50 border-gray-200' },
            { label: 'registered', count: counts.registered, color: 'text-blue-600 bg-blue-50 border-blue-200' },
            { label: 'active', count: counts.active, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
          ].map(s => (
            <div key={s.label} className={`px-3 py-1.5 rounded-xl border text-sm font-medium ${s.color}`}>
              <span className="text-lg font-display font-bold mr-1">{s.count}</span>
              {s.label}
            </div>
          ))}
        </div>
      </div>

      <PlatformSetupClient
        initialAccounts={accounts || []}
        products={(products || []).map(p => ({ id: p.id, name: p.name }))}
      />
    </div>
  )
}
