import { supabaseAdmin } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import { PlatformWorkspaceClient } from '@/components/PlatformWorkspaceClient'

export const revalidate = 15

export default async function PlatformWorkspacePage({
  params,
}: {
  params: Promise<{ slug: string; platform: string }>
}) {
  const { slug, platform } = await params

  const [
    { data: product },
    { data: account },
    { data: queue },
    { data: published },
    { data: metrics },
    { data: plan },
  ] = await Promise.all([
    supabaseAdmin.from('products').select('*').eq('id', slug).single(),
    supabaseAdmin.from('platform_accounts').select('*').eq('product_id', slug).eq('platform', platform).maybeSingle(),
    supabaseAdmin.from('generated_content').select('*').eq('product_id', slug).eq('platform', platform).in('status', ['draft', 'approved', 'pending']).order('created_at', { ascending: false }).limit(10),
    supabaseAdmin.from('publications').select('*').eq('product_id', slug).eq('platform', platform).order('created_at', { ascending: false }).limit(10),
    supabaseAdmin.from('content_metrics').select('*').eq('product_id', slug).eq('platform', platform).order('created_at', { ascending: false }).limit(20),
    supabaseAdmin.from('content_plan').select('*').eq('product_id', slug).order('scheduled_for').gte('scheduled_for', new Date().toISOString().split('T')[0]).limit(10),
  ])

  if (!product) notFound()

  return (
    <PlatformWorkspaceClient
      product={product}
      platform={platform}
      account={account}
      queue={queue || []}
      published={published || []}
      metrics={metrics || []}
      plan={(plan || []).filter(p => (p.platforms || []).includes(platform))}
    />
  )
}
