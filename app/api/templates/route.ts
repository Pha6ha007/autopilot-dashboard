import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET /api/templates — list all content templates
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('content_templates')
    .select('*')
    .order('name')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST /api/templates — create template
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, description, structure, example, icon } = body

  if (!name || !structure) {
    return NextResponse.json({ error: 'name and structure required' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('content_templates')
    .upsert({ name, description, structure, example, icon: icon || '📝' }, { onConflict: 'name' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, template: data })
}
