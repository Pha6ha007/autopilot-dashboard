import { supabaseAdmin } from '@/lib/supabase'
import { TemplatesClient } from '@/components/TemplatesClient'

export const revalidate = 30

export default async function TemplatesPage() {
  const [{ data: templates }, { data: toneExamples }, { data: products }] = await Promise.all([
    supabaseAdmin.from('content_templates').select('*').order('name'),
    supabaseAdmin.from('tone_examples').select('*, products!inner(name)').order('created_at', { ascending: false }).limit(50),
    supabaseAdmin.from('products').select('id, name, channels').eq('archived', false).order('name'),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-gray-900 text-3xl">Templates & Tone</h1>
        <p className="text-gray-500 text-sm mt-1">Content structures and voice examples that guide AI generation</p>
      </div>
      <TemplatesClient
        templates={templates || []}
        toneExamples={toneExamples || []}
        products={(products || []).map(p => ({ id: p.id, name: p.name, channels: p.channels || [] }))}
      />
    </div>
  )
}
