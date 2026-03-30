import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET /api/notifications — aggregate pending items across system
export async function GET() {
  const [
    { count: draftsCount },
    { count: queueCount },
    { count: errorsCount },
    { data: recentErrors },
  ] = await Promise.all([
    supabaseAdmin.from('generated_content').select('*', { count: 'exact', head: true }).eq('status', 'draft'),
    supabaseAdmin.from('content_queue').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabaseAdmin.from('errors').select('*', { count: 'exact', head: true }).eq('resolved', false),
    supabaseAdmin.from('errors').select('id, workflow, message, created_at').eq('resolved', false).order('created_at', { ascending: false }).limit(5),
  ])

  const notifications = []

  if ((draftsCount || 0) > 0) {
    notifications.push({
      type: 'drafts',
      icon: '✏️',
      title: `${draftsCount} drafts awaiting review`,
      href: '/drafts',
      count: draftsCount || 0,
      priority: 'medium',
    })
  }

  if ((queueCount || 0) > 0) {
    notifications.push({
      type: 'queue',
      icon: '📬',
      title: `${queueCount} items pending in queue`,
      href: '/queue',
      count: queueCount || 0,
      priority: 'low',
    })
  }

  if ((errorsCount || 0) > 0) {
    notifications.push({
      type: 'errors',
      icon: '⚠️',
      title: `${errorsCount} unresolved error${(errorsCount || 0) > 1 ? 's' : ''}`,
      href: '/errors',
      count: errorsCount || 0,
      priority: 'high',
      details: (recentErrors || []).map(e => ({
        workflow: e.workflow,
        message: e.message?.slice(0, 80),
        time: e.created_at,
      })),
    })
  }

  const totalCount = (draftsCount || 0) + (queueCount || 0) + (errorsCount || 0)

  return NextResponse.json({
    notifications,
    totalCount,
    hasUrgent: (errorsCount || 0) > 0,
  })
}
