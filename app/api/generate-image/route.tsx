import { NextRequest, NextResponse } from 'next/server'
import { ImageResponse } from '@vercel/og'
import { supabaseAdmin } from '@/lib/supabase'

export const runtime = 'edge'

const PRODUCT_COLORS: Record<string, { bg: string; accent: string; text: string }> = {
  tracehawk: { bg: '#0f172a', accent: '#6366f1', text: '#e2e8f0' },
  complyance: { bg: '#1e1b4b', accent: '#818cf8', text: '#e0e7ff' },
  confide: { bg: '#1c1917', accent: '#f59e0b', text: '#fef3c7' },
  outlix: { bg: '#0c4a6e', accent: '#38bdf8', text: '#e0f2fe' },
  prepwise: { bg: '#14532d', accent: '#4ade80', text: '#dcfce7' },
  'personal-brand': { bg: '#18181b', accent: '#a78bfa', text: '#ede9fe' },
  'cash-engine': { bg: '#422006', accent: '#fb923c', text: '#fff7ed' },
  storagecompare: { bg: '#1e3a5f', accent: '#60a5fa', text: '#dbeafe' },
  onboardiq: { bg: '#3b0764', accent: '#c084fc', text: '#f3e8ff' },
}

const TEMPLATES = ['minimal', 'bold', 'gradient', 'quote'] as const
type Template = typeof TEMPLATES[number]

// GET /api/generate-image?product_id=x&topic=y&template=z&format=og|instagram|cover
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const productId = searchParams.get('product_id') || 'tracehawk'
  const topic = searchParams.get('topic') || 'Untitled Post'
  const template = (searchParams.get('template') || 'minimal') as Template
  const format = searchParams.get('format') || 'og' // og, instagram, cover
  const subtitle = searchParams.get('subtitle') || ''

  const colors = PRODUCT_COLORS[productId] || PRODUCT_COLORS.tracehawk
  const productName = productId.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ')

  const dims = format === 'instagram'
    ? { width: 1080, height: 1080 }
    : format === 'cover'
    ? { width: 1200, height: 630 }
    : { width: 1200, height: 630 } // og

  const fontSize = topic.length > 80 ? 36 : topic.length > 50 ? 44 : 52

  const content = (() => {
    switch (template) {
      case 'bold':
        return (
          <div style={{
            width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
            justifyContent: 'center', alignItems: 'flex-start',
            background: colors.bg, padding: '60px 80px',
            fontFamily: 'sans-serif',
          }}>
            <div style={{
              fontSize: 18, color: colors.accent, fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '3px', marginBottom: '24px',
            }}>
              {productName}
            </div>
            <div style={{
              fontSize, color: colors.text, fontWeight: 800, lineHeight: 1.2,
              maxWidth: '90%',
            }}>
              {topic}
            </div>
            {subtitle && (
              <div style={{ fontSize: 22, color: colors.text, opacity: 0.6, marginTop: '20px' }}>
                {subtitle}
              </div>
            )}
            <div style={{
              position: 'absolute', bottom: '40px', right: '60px',
              width: '80px', height: '4px', background: colors.accent, borderRadius: '2px',
            }} />
          </div>
        )

      case 'gradient':
        return (
          <div style={{
            width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
            justifyContent: 'center', alignItems: 'center',
            background: `linear-gradient(135deg, ${colors.bg} 0%, ${colors.accent}33 100%)`,
            padding: '60px 80px', fontFamily: 'sans-serif', textAlign: 'center',
          }}>
            <div style={{
              fontSize, color: colors.text, fontWeight: 700, lineHeight: 1.3,
              maxWidth: '85%',
            }}>
              {topic}
            </div>
            {subtitle && (
              <div style={{ fontSize: 20, color: colors.text, opacity: 0.5, marginTop: '16px' }}>
                {subtitle}
              </div>
            )}
            <div style={{
              position: 'absolute', bottom: '40px',
              fontSize: 16, color: colors.accent, fontWeight: 600,
              letterSpacing: '2px', textTransform: 'uppercase',
            }}>
              {productName}
            </div>
          </div>
        )

      case 'quote':
        return (
          <div style={{
            width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
            justifyContent: 'center', alignItems: 'center',
            background: colors.bg, padding: '60px 100px',
            fontFamily: 'sans-serif', textAlign: 'center',
          }}>
            <div style={{
              fontSize: 72, color: colors.accent, marginBottom: '-10px', fontWeight: 200,
            }}>
              &ldquo;
            </div>
            <div style={{
              fontSize: Math.min(fontSize, 40), color: colors.text, fontWeight: 500,
              lineHeight: 1.5, fontStyle: 'italic', maxWidth: '80%',
            }}>
              {topic}
            </div>
            <div style={{
              marginTop: '30px', fontSize: 16, color: colors.accent,
              fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase',
            }}>
              — {productName}
            </div>
          </div>
        )

      default: // minimal
        return (
          <div style={{
            width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
            justifyContent: 'flex-end',
            background: colors.bg, padding: '60px 80px',
            fontFamily: 'sans-serif',
          }}>
            <div style={{
              position: 'absolute', top: '40px', left: '60px',
              fontSize: 14, color: colors.accent, fontWeight: 600,
              letterSpacing: '2px', textTransform: 'uppercase',
            }}>
              {productName}
            </div>
            <div style={{
              fontSize, color: colors.text, fontWeight: 700, lineHeight: 1.25,
              maxWidth: '85%', marginBottom: '20px',
            }}>
              {topic}
            </div>
            {subtitle && (
              <div style={{ fontSize: 20, color: colors.text, opacity: 0.5 }}>
                {subtitle}
              </div>
            )}
            <div style={{
              position: 'absolute', top: '40px', right: '60px',
              width: '48px', height: '48px', borderRadius: '12px',
              background: colors.accent, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              fontSize: 20, color: '#fff', fontWeight: 800,
            }}>
              {productName[0]}
            </div>
          </div>
        )
    }
  })()

  return new ImageResponse(content, { ...dims })
}

// POST /api/generate-image — generate and save to draft
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { draft_id, product_id, topic, template, format } = body

  if (!product_id || !topic) {
    return new NextResponse(JSON.stringify({ error: 'product_id and topic required' }), { status: 400 })
  }

  // Build image URL (self-referencing)
  const baseUrl = req.nextUrl.origin
  const params = new URLSearchParams({
    product_id,
    topic,
    template: template || 'minimal',
    format: format || 'og',
  })
  const imageUrl = `${baseUrl}/api/generate-image?${params}`

  // If draft_id provided, save to generated_content
  if (draft_id) {
    await supabaseAdmin
      .from('generated_content')
      .update({ image_url: imageUrl, image_type: 'template' })
      .eq('id', draft_id)
  }

  return new NextResponse(JSON.stringify({ ok: true, image_url: imageUrl, type: 'template' }), {
    headers: { 'Content-Type': 'application/json' },
  })
}
