import { NextResponse } from 'next/server'
import { createLangfuse } from '@/lib/langfuse'

// GET /api/debug-langfuse — test Langfuse connectivity (temporary)
export async function GET() {
  const pk = process.env.LANGFUSE_PUBLIC_KEY
  const sk = process.env.LANGFUSE_SECRET_KEY
  const baseUrl = process.env.LANGFUSE_BASE_URL

  const hasKeys = !!(pk && sk)

  if (!hasKeys) {
    return NextResponse.json({ ok: false, reason: 'missing keys', pk: !!pk, sk: !!sk, baseUrl: !!baseUrl })
  }

  const lf = createLangfuse()
  if (!lf) {
    return NextResponse.json({ ok: false, reason: 'createLangfuse returned null' })
  }

  try {
    const trace = lf.trace({ name: 'debug-test', tags: ['debug'] })
    trace.generation({ name: 'debug-gen', model: 'test', input: 'test', output: 'ok' })
    trace.update({ output: 'debug complete' })
    await lf.shutdownAsync()
    return NextResponse.json({ ok: true, pk: pk?.slice(0, 12), baseUrl, flushed: true })
  } catch (e) {
    return NextResponse.json({ ok: false, reason: 'flush error', error: e instanceof Error ? e.message : String(e) })
  }
}
