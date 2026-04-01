import { Langfuse } from 'langfuse'

// On serverless (Vercel), each invocation may be a cold start.
// Create a fresh client per request to avoid stale state.
// The Langfuse SDK handles batching internally.
export function createLangfuse(): Langfuse | null {
  if (!process.env.LANGFUSE_PUBLIC_KEY || !process.env.LANGFUSE_SECRET_KEY) {
    return null
  }

  return new Langfuse({
    publicKey: process.env.LANGFUSE_PUBLIC_KEY,
    secretKey: process.env.LANGFUSE_SECRET_KEY,
    baseUrl: process.env.LANGFUSE_BASE_URL || 'https://cloud.langfuse.com',
    flushAt: 1, // flush immediately, don't batch — serverless may freeze
  })
}
