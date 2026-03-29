'use client'
import { useEffect, useState } from 'react'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Singleton — один клиент на всё приложение
let _client: SupabaseClient | null = null
function getBrowserClient() {
  if (!_client) {
    _client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false } }
    )
  }
  return _client
}

export function useRealtimeStats() {
  const [bump, setBump] = useState(0)

  useEffect(() => {
    const client = getBrowserClient()
    const channel = client
      .channel('dashboard-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'publications' }, () => setBump(b => b + 1))
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'workflow_runs' }, () => setBump(b => b + 1))
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'errors' }, () => setBump(b => b + 1))
      .subscribe()

    return () => { client.removeChannel(channel) }
  }, [])

  return bump
}
