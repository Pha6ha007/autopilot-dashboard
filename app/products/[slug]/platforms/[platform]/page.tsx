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
    supabaseAdmin.from('generated_content').select('id, content, status, topic, created_at').eq('product_id', slug).eq('platform', platform).in('status', ['draft', 'approved', 'pending', 'queued']).order('created_at', { ascending: false }).limit(10),
    supabaseAdmin.from('publications').select('id, topic, content_preview, platform, status, published_at, publish_url').eq('product_id', slug).eq('platform', platform).order('published_at', { ascending: false }).limit(10),
    supabaseAdmin.from('content_metrics').select('*').eq('product_id', slug).eq('platform', platform).order('created_at', { ascending: false }).limit(20),
    supabaseAdmin.from('content_plan').select('id, topic, type, scheduled_for, status, platforms').eq('product_id', slug).eq('status', 'scheduled').gte('scheduled_for', new Date().toISOString().split('T')[0]).order('scheduled_for').limit(20),
  ])

  if (!product) notFound()

  // Filter plan by platform on JS side (platforms is a text[] column)
  const filteredPlan = (plan || []).filter(p => {
    const platforms = p.platforms
    if (!platforms) return false
    if (Array.isArray(platforms)) return platforms.includes(platform)
    if (typeof platforms === 'string') {
      try { return JSON.parse(platforms).includes(platform) } catch { return platforms.includes(platform) }
    }
    return false
  })

  return (
    <PlatformWorkspaceClient
      product={product}
      platform={platform}
      account={account}
      queue={queue || []}
      published={published || []}
      metrics={metrics || []}
      plan={filteredPlan}
    />
  )
}
