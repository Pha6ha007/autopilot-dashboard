// Model selection logic based on task type and platform
// Used by scrape-product, regenerate, and future endpoints

export type TaskType = 'scrape' | 'social-post' | 'article' | 'content-plan' | 'script' | 'regenerate'

const SHORT_PLATFORMS = new Set(['twitter', 'telegram', 'reddit', 'facebook', 'instagram', 'tiktok'])
const LONG_PLATFORMS = new Set(['linkedin', 'devto', 'hashnode', 'medium', 'youtube'])

export function selectModel(task: TaskType, platform?: string): string {
  const MODEL_COMPLEX = process.env.MODEL_COMPLEX || 'minimax/minimax-m2.5'
  const MODEL_SIMPLE = process.env.MODEL_SIMPLE || 'google/gemini-2.0-flash-001'
  const MODEL_SCRIPT = process.env.MODEL_SCRIPT || 'minimax/minimax-m1'

  switch (task) {
    case 'script':
      return MODEL_SCRIPT

    case 'content-plan':
    case 'article':
      return MODEL_COMPLEX

    case 'scrape':
      return MODEL_SIMPLE

    case 'social-post':
      if (platform && LONG_PLATFORMS.has(platform)) return MODEL_COMPLEX
      return MODEL_SIMPLE

    case 'regenerate':
      if (platform && LONG_PLATFORMS.has(platform)) return MODEL_COMPLEX
      return MODEL_SIMPLE

    default:
      return MODEL_COMPLEX
  }
}

// Call OpenRouter with automatic fallback
export async function callLLM(params: {
  model: string
  messages: { role: string; content: string }[]
  maxTokens?: number
  temperature?: number
}): Promise<{ content: string; model: string; fallback: boolean }> {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) throw new Error('OPENROUTER_API_KEY not configured')

  const fallbackModel = process.env.MODEL_FALLBACK || 'anthropic/claude-sonnet-4'

  // Try primary model
  for (const model of [params.model, fallbackModel]) {
    try {
      const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          max_tokens: params.maxTokens || 4096,
          temperature: params.temperature,
          messages: params.messages,
        }),
        signal: AbortSignal.timeout(60000),
      })

      if (!resp.ok) {
        const errText = await resp.text().catch(() => '')
        console.error(`LLM ${model} returned ${resp.status}: ${errText.slice(0, 200)}`)
        if (model === fallbackModel) throw new Error(`All models failed. Last: ${resp.status}`)
        continue // try fallback
      }

      const data = await resp.json()
      const content = data.choices?.[0]?.message?.content?.trim() || ''
      if (!content) {
        if (model === fallbackModel) throw new Error('Empty response from all models')
        continue
      }

      return {
        content,
        model,
        fallback: model !== params.model,
      }
    } catch (e) {
      if (model === fallbackModel) throw e
      console.error(`LLM ${model} error:`, e instanceof Error ? e.message : e)
      continue
    }
  }

  throw new Error('No models available')
}
