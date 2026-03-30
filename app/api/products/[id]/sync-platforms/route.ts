import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// POST /api/products/[id]/sync-platforms — add new platform to existing content_plan items
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  // Get product with current channels
  const { data: product, error: prodErr } = await supabaseAdmin
    .from('products')
    .select('id, name, channels')
    .eq('id', id)
    .single()

  if (prodErr || !product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }

  const productChannels: string[] = product.channels || []

  // Get this week's content_plan items for this product
  const today = new Date()
  const weekStart = new Date(today)
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1) // Monday
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 6)

  const { data: planItems } = await supabaseAdmin
    .from('content_plan')
    .select('id, platforms, topic, type, scheduled_for')
    .eq('product_id', id)
    .gte('scheduled_for', weekStart.toISOString().split('T')[0])
    .lte('scheduled_for', weekEnd.toISOString().split('T')[0])
    .in('status', ['scheduled', 'draft'])

  if (!planItems || planItems.length === 0) {
    return NextResponse.json({
      ok: true,
      message: 'No scheduled content this week to sync',
      updated: 0,
    })
  }

  // For each plan item, add missing channels
  let updated = 0
  const addedPlatforms: string[] = []

  for (const item of planItems) {
    const currentPlatforms = new Set(item.platforms || [])
    const newPlatforms = productChannels.filter(ch => !currentPlatforms.has(ch))

    if (newPlatforms.length > 0) {
      const mergedPlatforms = [...currentPlatforms, ...newPlatforms]

      const { error } = await supabaseAdmin
        .from('content_plan')
        .update({ platforms: mergedPlatforms })
        .eq('id', item.id)

      if (!error) {
        updated++
        for (const p of newPlatforms) {
          if (!addedPlatforms.includes(p)) addedPlatforms.push(p)
        }
      }
    }
  }

  return NextResponse.json({
    ok: true,
    updated,
    addedPlatforms,
    message: updated > 0
      ? `Added ${addedPlatforms.join(', ')} to ${updated} content plan items`
      : 'All platforms already synced',
  })
}
