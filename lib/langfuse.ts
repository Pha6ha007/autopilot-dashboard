import { Langfuse } from 'langfuse'

// On serverless (Vercel), each invocation may be a cold start.
// Create a fresh client per request to avoid stale state.
// The Langfuse SDK handles batching internally.
export function createLangfuse(): Langfuse | null {
  const pk = process.env.LANGFUSE_PUBLIC_KEY?.trim()
  const sk = process.env.LANGFUSE_SECRET_KEY?.trim()
  const baseUrl = (process.env.LANGFUSE_BASE_URL || 'https://cloud.langfuse.com').trim()

  if (!pk || !sk) {
    return null
  }

  return new Langfuse({
    publicKey: pk,
    secretKey: sk,
    baseUrl,
    flushAt: 1,
  })
}
