import { supabaseAdmin } from '@/lib/supabase'
import { QueueClient } from '@/components/QueueClient'

export const dynamic = 'force-dynamic'

export default async function QueuePage() {
  // Fetch queue items by status
  const [pendingRes, approvedRes, publishedRes, productsRes] = await Promise.all([
    supabaseAdmin
      .from('content_queue')
      .select('*, products(id,name,channels,auto_publish)')
      .eq('status', 'pending')
      .order('scheduled_for', { ascending: true }),
    supabaseAdmin
      .from('content_queue')
      .select('*, products(id,name,channels,auto_publish)')
      .eq('status', 'approved')
      .order('scheduled_for', { ascending: true }),
    supabaseAdmin
      .from('content_queue')
      .select('*, products(id,name,channels,auto_publish)')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(50),
    supabaseAdmin
      .from('products')
      .select('id,name,channels,auto_publish')
      .eq('active', true)
      .order('name'),
  ])

  const pending   = pendingRes.data   || []
  const approved  = approvedRes.data  || []
  const published = publishedRes.data || []
  const products  = productsRes.data  || []

  const totalPending = pending.length + approved.length

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-display font-bold text-gray-900 text-3xl mb-1">
            Content Queue
          </h1>
          <p className="text-gray-400 text-sm">
            {totalPending > 0
              ? `${totalPending} item${totalPending !== 1 ? 's' : ''} waiting for review or publishing`
              : 'All caught up 🎉'}
          </p>
        </div>

        {/* Quick stats */}
        <div className="flex items-center gap-3">
          <div className="glass rounded-xl px-4 py-2.5 text-center">
            <p className="text-2xl font-bold text-amber-500">{pending.length}</p>
            <p className="text-xs text-gray-400">pending</p>
          </div>
          <div className="glass rounded-xl px-4 py-2.5 text-center">
            <p className="text-2xl font-bold text-indigo-500">{approved.length}</p>
            <p className="text-xs text-gray-400">approved</p>
          </div>
          <div className="glass rounded-xl px-4 py-2.5 text-center">
            <p className="text-2xl font-bold text-emerald-500">{published.length}</p>
            <p className="text-xs text-gray-400">published</p>
          </div>
        </div>
      </div>

      {/* Interactive client component */}
      <QueueClient
        initialPending={pending}
        initialApproved={approved}
        initialPublished={published}
        initialProducts={products}
      />
    </div>
  )
}
