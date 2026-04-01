import { NextResponse } from 'next/server'

// GET /api/debug-langfuse — test Langfuse connectivity via raw HTTP
export async function GET() {
  const pk = process.env.LANGFUSE_PUBLIC_KEY
  const sk = process.env.LANGFUSE_SECRET_KEY
  const baseUrl = (process.env.LANGFUSE_BASE_URL || 'https://cloud.langfuse.com').trim()

  if (!pk || !sk) {
    return NextResponse.json({ ok: false, reason: 'missing keys', pk: !!pk, sk: !!sk })
  }

  const traceId = crypto.randomUUID()
  const genId = crypto.randomUUID()
  const now = new Date().toISOString()

  // Direct HTTP POST to Langfuse ingestion API
  try {
    const auth = Buffer.from(`${pk}:${sk}`).toString('base64')
    const resp = await fetch(`${baseUrl}/api/public/ingestion`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`,
      },
      body: JSON.stringify({
        batch: [
          {
            type: 'trace-create',
            id: crypto.randomUUID(),
            timestamp: now,
            body: {
              id: traceId,
              name: 'debug-raw-http',
              tags: ['debug', 'raw-http'],
              output: 'debug via raw HTTP',
            },
          },
          {
            type: 'generation-create',
            id: crypto.randomUUID(),
            timestamp: now,
            body: {
              traceId,
              id: genId,
              name: 'test-gen',
              model: 'test-model',
              input: [{ role: 'user', content: 'debug test' }],
              output: 'debug response',
              startTime: now,
              endTime: now,
            },
          },
        ],
      }),
    })

    const body = await resp.text()
    return NextResponse.json({
      ok: resp.ok,
      status: resp.status,
      body: body.slice(0, 500),
      pk: pk.slice(0, 12),
      baseUrl,
      traceId,
    })
  } catch (e) {
    return NextResponse.json({
      ok: false,
      error: e instanceof Error ? e.message : String(e),
      pk: pk.slice(0, 12),
      baseUrl,
    })
  }
}
