import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Visual style presets — each creates a distinct, high-quality aesthetic
const STYLES: Record<string, { name: string; prompt: string }> = {
  cinematic: {
    name: '🎬 Cinematic',
    prompt: 'Cinematic wide-angle shot, dramatic lighting with volumetric rays, shallow depth of field, anamorphic lens flare, moody color grading with teal and orange tones, film grain texture, 35mm photography look',
  },
  '3d-render': {
    name: '🧊 3D Render',
    prompt: 'Hyper-realistic 3D render, soft studio lighting, glossy materials with subtle reflections, floating geometric objects, isometric perspective, clean minimal composition, octane render quality, soft shadows',
  },
  editorial: {
    name: '📰 Editorial',
    prompt: 'High-end editorial photography style, clean white or light gray background, minimal composition, one strong visual element in center, magazine cover quality, professional product photography lighting',
  },
  gradient: {
    name: '🌈 Abstract',
    prompt: 'Abstract fluid art, vibrant mesh gradients blending organically, glass morphism elements, translucent overlapping shapes, soft bokeh particles, modern generative art aesthetic, luminous and ethereal',
  },
  illustration: {
    name: '✏️ Illustration',
    prompt: 'Modern flat illustration with subtle textures, limited color palette of 4-5 colors, clean vector-like shapes with paper texture overlay, Scandinavian design influence, editorial illustration style',
  },
  noir: {
    name: '🖤 Noir',
    prompt: 'Dark moody atmosphere, high contrast black and white with one accent color, dramatic shadows, film noir aesthetic, rain-slicked surfaces reflecting neon light, cyberpunk undertones',
  },
}

// Platform-specific aspect and composition guidance
const PLATFORM_HINTS: Record<string, string> = {
  twitter: 'Horizontal 16:9 composition, strong visual impact at small size, bold shapes',
  linkedin: 'Professional horizontal 16:9, clean and corporate-appropriate, subtle sophistication',
  instagram: 'Square 1:1 composition, visually striking, Instagram-worthy aesthetic, high saturation',
  devto: 'Horizontal blog cover, developer-friendly aesthetic, subtle code/tech references',
  hashnode: 'Horizontal blog cover, clean and modern, tech blog aesthetic',
  medium: 'Horizontal cover, editorial quality, thought-provoking composition',
  facebook: 'Horizontal 16:9, eye-catching in feed scroll, warm and engaging',
  telegram: 'Horizontal, clear composition that works at small size',
  reddit: 'Horizontal, interesting visual that invites clicks, not too polished',
}

// Product visual associations
const PRODUCT_VIBES: Record<string, string> = {
  tracehawk: 'AI monitoring dashboards, data streams, neural network nodes, hawk silhouette, indigo and electric blue palette',
  complyance: 'Legal documents transforming into digital, shield iconography, EU flag colors subtly, deep violet and blue palette',
  confide: 'Emotional warmth, two silhouettes in conversation, warm amber and soft lighting, intimate atmosphere, human connection',
  outlix: 'Sales outreach, email icons flowing, connection lines between people, sky blue and cyan palette',
  prepwise: 'Education and learning, books becoming digital, graduation elements, fresh green and white palette',
  'personal-brand': 'Builder at work, multiple screens, startup energy, creative workspace, purple and violet palette',
  'cash-engine': 'Property and finance, UAE skyline elements, golden and warm tones, professional',
  storagecompare: 'Storage units, comparison interface, organized boxes, blue and gray palette',
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { draft_id, product_id, topic, platform, style } = body

  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'OPENROUTER_API_KEY not configured' }, { status: 500 })
  }

  if (!topic) {
    return NextResponse.json({ error: 'topic required' }, { status: 400 })
  }

  // Get product context
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

  // Select style
  const selectedStyle = STYLES[style || 'cinematic'] || STYLES.cinematic
  const platformHint = PLATFORM_HINTS[platform || 'linkedin'] || PLATFORM_HINTS.linkedin
  const productVibe = PRODUCT_VIBES[product_id || ''] || ''

  // Build rich prompt
  const imagePrompt = `Generate a stunning, high-quality image for a social media post.

TOPIC: "${topic}"
PRODUCT: ${productName}${positioning ? ` — ${positioning}` : ''}

VISUAL STYLE: ${selectedStyle.prompt}

COMPOSITION: ${platformHint}

${productVibe ? `VISUAL ELEMENTS: Incorporate subtle references to: ${productVibe}` : ''}

CRITICAL RULES:
- NO text, NO words, NO letters, NO numbers, NO logos, NO watermarks anywhere in the image
- The image must be purely visual — it will have text overlaid separately
- High resolution, sharp details, professional quality
- Create something visually striking that would stop someone scrolling
- The mood should match the topic: ${topic}`

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
        messages: [{ role: 'user', content: imagePrompt }],
      }),
      signal: AbortSignal.timeout(60000),
    })

    if (!resp.ok) {
      const err = await resp.text()
      throw new Error(`OpenRouter ${resp.status}: ${err.slice(0, 300)}`)
    }

    const data = await resp.json()
    const choice = data.choices?.[0]?.message
    let imageUrl = ''

    if (choice?.content) {
      if (Array.isArray(choice.content)) {
        const imagePart = choice.content.find((p: { type: string; image_url?: { url: string } }) => p.type === 'image_url')
        if (imagePart?.image_url?.url) imageUrl = imagePart.image_url.url
      } else if (typeof choice.content === 'string') {
        if (choice.content.startsWith('http')) imageUrl = choice.content
        else if (choice.content.startsWith('data:image')) imageUrl = choice.content
      }
    }
    if (!imageUrl && data.images) {
      imageUrl = Array.isArray(data.images) ? data.images[0] : data.images
    }

    if (!imageUrl) {
      return NextResponse.json({
        error: 'No image in response. Model may not support image generation yet.',
        debug: { content_type: typeof choice?.content, content_preview: String(choice?.content).slice(0, 200) },
      }, { status: 500 })
    }

    if (draft_id) {
      await supabaseAdmin
        .from('generated_content')
        .update({ image_url: imageUrl, image_type: 'ai' })
        .eq('id', draft_id)
    }

    return NextResponse.json({ ok: true, image_url: imageUrl, type: 'ai', model, style: style || 'cinematic' })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// GET /api/generate-image/ai — return available styles
export async function GET() {
  return NextResponse.json({
    styles: Object.entries(STYLES).map(([id, s]) => ({ id, name: s.name })),
  })
}
