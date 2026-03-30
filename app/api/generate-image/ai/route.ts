import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// POST /api/generate-image/ai — generate image via OpenRouter (Nano Banana 2)
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { draft_id, product_id, topic, platform } = body

  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'OPENROUTER_API_KEY not configured' }, { status: 500 })
  }

  if (!topic) {
    return NextResponse.json({ error: 'topic required' }, { status: 400 })
  }

  // Get product context for better prompt
  let productName = product_id || 'product'
  let positioning = ''
  if (product_id) {
    const { data: ctx } = await supabaseAdmin
      .from('product_contexts')
      .select('positioning')
      .eq('product_id', product_id)
      .maybeSingle()
    if (ctx?.positioning) positioning = ctx.positioning

    const { data: prod } = await supabaseAdmin
      .from('products')
      .select('name')
      .eq('id', product_id)
      .maybeSingle()
    if (prod?.name) productName = prod.name
  }

  // Build image prompt
  const imagePrompt = `Create a professional, modern cover image for a social media post about: "${topic}". ${
    positioning ? `The product is ${productName} — ${positioning}.` : ''
  } Style: clean tech aesthetic, dark background with subtle gradients and geometric accents, abstract and professional. No text, no words, no letters, no watermarks. Suitable as a social media cover image.`

  const model = 'google/gemini-2.5-flash-preview:imagegen'

  try {
    const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'user',
            content: imagePrompt,
          },
        ],
      }),
      signal: AbortSignal.timeout(60000),
    })

    if (!resp.ok) {
      const err = await resp.text()
      throw new Error(`OpenRouter ${resp.status}: ${err.slice(0, 300)}`)
    }

    const data = await resp.json()

    // Extract image URL from response
    // OpenRouter image models return image in content as either URL or base64
    const choice = data.choices?.[0]?.message
    let imageUrl = ''

    if (choice?.content) {
      // Could be array of parts or string
      if (Array.isArray(choice.content)) {
        const imagePart = choice.content.find((p: { type: string; image_url?: { url: string } }) => p.type === 'image_url')
        if (imagePart?.image_url?.url) {
          imageUrl = imagePart.image_url.url
        }
      } else if (typeof choice.content === 'string') {
        // Check if it's a URL
        if (choice.content.startsWith('http')) {
          imageUrl = choice.content
        } else if (choice.content.startsWith('data:image')) {
          imageUrl = choice.content
        }
      }
    }

    // Also check for image in the response metadata
    if (!imageUrl && data.images) {
      imageUrl = Array.isArray(data.images) ? data.images[0] : data.images
    }

    if (!imageUrl) {
      // Fallback: return the raw response for debugging
      return NextResponse.json({
        error: 'No image in response',
        debug: { content_type: typeof choice?.content, has_images: !!data.images },
      }, { status: 500 })
    }

    // Save to draft if ID provided
    if (draft_id) {
      await supabaseAdmin
        .from('generated_content')
        .update({ image_url: imageUrl, image_type: 'ai' })
        .eq('id', draft_id)
    }

    return NextResponse.json({
      ok: true,
      image_url: imageUrl,
      type: 'ai',
      model,
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
