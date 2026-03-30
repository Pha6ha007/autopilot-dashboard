import { NextRequest, NextResponse } from 'next/server'

const EXTRACT_PROMPT = `You are a product analyst. Given the text content of a product website, extract structured product information.

Return valid JSON with these fields:
{
  "positioning": "one-line product positioning statement",
  "target_audience": "who is this product for — be specific about roles and industries",
  "pain_points": "what problems/frustrations does it solve — 2-4 bullet points separated by newlines",
  "key_features": [{"name": "Feature Name", "description": "1-2 sentence description"}],
  "competitors": "known competitors or alternatives if mentioned, or 'Not mentioned on site'",
  "differentiators": "what makes this product unique vs alternatives",
  "cta": "the main call-to-action or value proposition for content"
}

Rules:
- Extract ONLY information present on the page. Do not invent features.
- key_features: extract the 5-8 most important features.
- Be concise but specific. Avoid generic marketing fluff.
- If a field cannot be determined from the content, use null.
- Return ONLY the JSON object, no markdown fences.`

export async function POST(req: NextRequest) {
  const { url } = await req.json()
  if (!url) return NextResponse.json({ error: 'url is required' }, { status: 400 })

  const apiKey = process.env.OPENROUTER_API_KEY
  const model = process.env.MODEL_COMPLEX || 'minimax/minimax-m2.5'
  if (!apiKey) return NextResponse.json({ error: 'OPENROUTER_API_KEY not configured' }, { status: 500 })

  // Step 1: Scrape site via Jina Reader
  let siteText: string
  try {
    const resp = await fetch(`https://r.jina.ai/${url}`, {
      headers: { 'Accept': 'text/plain', 'X-Return-Format': 'text' },
      signal: AbortSignal.timeout(15000),
    })
    if (!resp.ok) throw new Error(`Jina returned ${resp.status}`)
    siteText = await resp.text()
    // Trim to ~12k chars to fit in context
    if (siteText.length > 12000) siteText = siteText.slice(0, 12000) + '\n...[truncated]'
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: `Failed to scrape site: ${msg}` }, { status: 502 })
  }

  // Step 2: Extract via LLM
  try {
    const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        max_tokens: 4096,
        messages: [
          { role: 'system', content: EXTRACT_PROMPT },
          { role: 'user', content: `Website URL: ${url}\n\n---\n\n${siteText}` },
        ],
      }),
      signal: AbortSignal.timeout(60000),
    })

    if (!resp.ok) {
      const errBody = await resp.text()
      throw new Error(`OpenRouter ${resp.status}: ${errBody.slice(0, 200)}`)
    }

    const data = await resp.json()
    const content = data.choices?.[0]?.message?.content || ''

    // Parse JSON from response (strip markdown fences if present)
    const jsonStr = content.replace(/```json?\n?/g, '').replace(/```\n?/g, '').trim()
    const extracted = JSON.parse(jsonStr)

    return NextResponse.json({
      ok: true,
      extracted,
      raw_scrape: siteText.slice(0, 5000), // store truncated version
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: `LLM extraction failed: ${msg}` }, { status: 500 })
  }
}
