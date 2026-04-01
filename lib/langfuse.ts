import { Langfuse } from 'langfuse'

let _client: Langfuse | null = null

export function getLangfuse(): Langfuse | null {
  if (!process.env.LANGFUSE_PUBLIC_KEY || !process.env.LANGFUSE_SECRET_KEY) {
    return null
  }

  if (!_client) {
    _client = new Langfuse({
      publicKey: process.env.LANGFUSE_PUBLIC_KEY,
      secretKey: process.env.LANGFUSE_SECRET_KEY,
      baseUrl: process.env.LANGFUSE_BASE_URL || 'https://cloud.langfuse.com',
    })
  }

  return _client
}
