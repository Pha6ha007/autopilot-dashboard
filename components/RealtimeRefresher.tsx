'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useRealtimeStats } from '@/hooks/useRealtimeStats'

export function RealtimeRefresher() {
  const router = useRouter()
  const bump = useRealtimeStats()

  useEffect(() => {
    if (bump > 0) {
      router.refresh()
    }
  }, [bump, router])

  return (
    <span className="inline-flex items-center gap-1 text-xs text-emerald-500">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
      live
    </span>
  )
}
