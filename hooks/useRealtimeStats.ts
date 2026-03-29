'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export function useRealtimeStats() {
  const [bump, setBump] = useState(0)

  useEffect(() => {
    const client = createClient(supabaseUrl, supabaseAnonKey)

    const channel = client
      .channel('dashboard-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'publications' }, () => {
        setBump(b => b + 1)
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'workflow_runs' }, () => {
        setBump(b => b + 1)
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'errors' }, () => {
        setBump(b => b + 1)
      })
      .subscribe()

    return () => { client.removeChannel(channel) }
  }, [])

  return bump
}
