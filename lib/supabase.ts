import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Public client for client-side use (products only)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Server-side client that bypasses RLS — use only in Server Components
export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceKey ?? supabaseAnonKey,
  { auth: { persistSession: false } }
)

export type Product = {
  id: string
  name: string
  site: string | null
  one_liner: string | null
  tone: string | null
  channels: string[]
  active: boolean
}

export type Publication = {
  id: number
  product_id: string
  type: string
  topic: string
  platform: string
  status: string
  publish_url: string | null
  error_details: string | null
  published_at: string | null
  scheduled_for: string | null
  content_preview: string | null
  created_at: string
}

export type ContentPlan = {
  id: number
  product_id: string
  type: string
  topic: string
  platforms: string[]
  status: string
  scheduled_for: string
  notes: string | null
}

export type WorkflowRun = {
  id: number
  workflow_id: string
  workflow_name: string | null
  product_id: string | null
  status: string
  started_at: string
  finished_at: string | null
  duration_ms: number | null
  items_processed: number
  error_message: string | null
}

export type AppError = {
  id: number
  workflow_id: string
  workflow_name: string | null
  node_name: string | null
  product_id: string | null
  error_message: string
  status: string
  occurred_at: string
}

export type ProductStats = {
  id: string
  name: string
  site: string | null
  channels: string[]
  total_published: number
  published_last_30d: number
  published_last_7d: number
  total_errors: number
  upcoming_scheduled: number
  last_published_at: string | null
}

export type PlatformStats = {
  product_id: string
  platform: string
  published_count: number
  failed_count: number
  last_published_at: string | null
}
