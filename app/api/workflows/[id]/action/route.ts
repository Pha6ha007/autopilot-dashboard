import { NextRequest, NextResponse } from 'next/server'

const N8N_URL = process.env.N8N_URL || 'http://localhost:5678'
const N8N_API_KEY = process.env.N8N_API_KEY || ''

async function n8nFetch(path: string, options: RequestInit = {}) {
  return fetch(`${N8N_URL}/api/v1${path}`, {
    ...options,
    headers: {
      'X-N8N-API-KEY': N8N_API_KEY,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
}

// POST /api/workflows/[id]/action — trigger, activate, deactivate
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json()
  const action = body.action // 'trigger' | 'activate' | 'deactivate'

  if (!N8N_API_KEY) {
    return NextResponse.json({ error: 'N8N_API_KEY not configured' }, { status: 500 })
  }

  try {
    let resp: Response

    switch (action) {
      case 'trigger':
        resp = await n8nFetch(`/workflows/${id}/run`, {
          method: 'POST',
          body: JSON.stringify({}),
        })
        break

      case 'activate':
        resp = await n8nFetch(`/workflows/${id}/activate`, {
          method: 'POST',
        })
        break

      case 'deactivate':
        resp = await n8nFetch(`/workflows/${id}/deactivate`, {
          method: 'POST',
        })
        break

      default:
        return NextResponse.json({ error: 'Invalid action. Use: trigger, activate, deactivate' }, { status: 400 })
    }

    const data = await resp.json().catch(() => ({}))

    if (!resp.ok) {
      return NextResponse.json({
        error: `n8n returned ${resp.status}`,
        details: data,
      }, { status: resp.status })
    }

    return NextResponse.json({ ok: true, action, workflow_id: id, result: data })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: `n8n unreachable: ${msg}` }, { status: 502 })
  }
}
