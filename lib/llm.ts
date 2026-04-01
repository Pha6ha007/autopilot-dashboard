// Model selection logic based on task type and platform
// Used by scrape-product, regenerate, and future endpoints

import { getLangfuse } from './langfuse'

export type TaskType = 'scrape' | 'social-post' | 'article' | 'content-plan' | 'script' | 'regenerate'

const LONG_PLATFORMS = new Set(['linkedin', 'devto', 'hashnode', 'medium', 'youtube'])

export function selectModel(task: TaskType, platform?: string): string {
  const MODEL_COMPLEX = (process.env.MODEL_COMPLEX || 'minimax/minimax-m2.5').trim()
  const MODEL_SIMPLE = (process.env.MODEL_SIMPLE || 'google/gemini-2.0-flash-001').trim()
  const MODEL_SCRIPT = (process.env.MODEL_SCRIPT || 'minimax/minimax-m1').trim()

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

// Trace context for Langfuse — pass to callLLM to enrich traces
export type TraceContext = {
  name?: string          // e.g. 'quick-post-generate', 'regenerate-content'
  userId?: string        // product_id
  sessionId?: string     // platform or content_plan_id
  tags?: string[]        // e.g. ['telegram', 'complyance', 'size:medium']
  metadata?: Record<string, unknown>
}

// Call OpenRouter with automatic fallback + Langfuse tracing
export async function callLLM(params: {
  model: string
  messages: { role: string; content: string }[]
  maxTokens?: number
  temperature?: number
  trace?: TraceContext
}): Promise<{ content: string; model: string; fallback: boolean }> {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) throw new Error('OPENROUTER_API_KEY not configured')

  const fallbackModel = (process.env.MODEL_FALLBACK || 'anthropic/claude-sonnet-4').trim()
  const langfuse = getLangfuse()
  const startTime = new Date()

  // Create Langfuse trace if available
  const lfTrace = langfuse ? langfuse.trace({
    name: params.trace?.name || 'llm-call',
    userId: params.trace?.userId,
    sessionId: params.trace?.sessionId,
    tags: params.trace?.tags || [],
    metadata: params.trace?.metadata,
    input: params.messages[params.messages.length - 1]?.content?.slice(0, 500),
  }) : null

  // Try primary model, then fallback
  for (const model of [params.model, fallbackModel]) {
    const isFallback = model !== params.model

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

        // Log failed attempt to Langfuse
        if (lfTrace) {
          lfTrace.generation({
            name: `${model} (error)`,
            model,
            input: params.messages,
            startTime,
            endTime: new Date(),
            level: 'ERROR',
            statusMessage: `HTTP ${resp.status}: ${errText.slice(0, 100)}`,
            metadata: { fallback: isFallback },
          })
        }

        if (model === fallbackModel) throw new Error(`All models failed. Last: ${resp.status}`)
        continue // try fallback
      }

      const data = await resp.json()
      const content = data.choices?.[0]?.message?.content?.trim() || ''
      if (!content) {
        if (model === fallbackModel) throw new Error('Empty response from all models')
        continue
      }

      // Extract usage from OpenRouter response
      const usage = data.usage || {}
      const endTime = new Date()

      // Log successful generation to Langfuse
      if (lfTrace) {
        lfTrace.generation({
          name: `${model}${isFallback ? ' (fallback)' : ''}`,
          model,
          input: params.messages,
          output: content,
          startTime,
          endTime,
          modelParameters: {
            maxTokens: params.maxTokens || 4096,
            temperature: params.temperature ?? null,
          },
          usage: {
            promptTokens: usage.prompt_tokens || undefined,
            completionTokens: usage.completion_tokens || undefined,
            totalTokens: usage.total_tokens || undefined,
          },
          metadata: {
            fallback: isFallback,
            openrouter_model: data.model,
            latencyMs: endTime.getTime() - startTime.getTime(),
          },
        })

        lfTrace.update({ output: content.slice(0, 500) })

        // Await flush — required on serverless (Vercel) where function freezes after response
        try {
          await langfuse?.flushAsync()
        } catch { /* tracing must never break the response */ }
      }

      return {
        content,
        model,
        fallback: isFallback,
      }
    } catch (e) {
      if (model === fallbackModel) {
        // Log final failure
        if (lfTrace) {
          lfTrace.update({ output: `Error: ${e instanceof Error ? e.message : String(e)}` })
          try { await langfuse?.flushAsync() } catch { /* ignore */ }
        }
        throw e
      }
      console.error(`LLM ${model} error:`, e instanceof Error ? e.message : e)
      continue
    }
  }

  throw new Error('No models available')
}
