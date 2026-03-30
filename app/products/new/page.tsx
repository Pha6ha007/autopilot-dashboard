'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Step1ProductInfo } from '@/components/add-product/Step1ProductInfo'
import { StepProductContext, EMPTY_CONTEXT, type ProductContextData } from '@/components/add-product/StepProductContext'
import { Step2Platforms } from '@/components/add-product/Step2Platforms'
import { Step3Credentials } from '@/components/add-product/Step3Credentials'
import { Step4Success } from '@/components/add-product/Step4Success'

type SelectedPlatform = {
  platform: string
  credentials: Record<string, string>
  subreddits: string[]
}

type Step1Data = {
  id: string
  name: string
  domain: string
  description: string
  tone: string
  primary_language: string
  content_types: string
  frequency: string
}

const STEPS = [
  { n: 1, label: 'Info' },
  { n: 2, label: 'Product context' },
  { n: 3, label: 'Platforms' },
  { n: 4, label: 'Credentials' },
]

export default function AddProductPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState<{
    product: { id: string; name: string; domain: string }
    platforms: { platform: string; status: string; subreddits: string[] }[]
  } | null>(null)

  const [product, setProduct] = useState<Step1Data>({
    id: '', name: '', domain: '', description: '',
    tone: 'professional', primary_language: 'en',
    content_types: 'both', frequency: 'daily',
  })

  const [context, setContext] = useState<ProductContextData>(EMPTY_CONTEXT)
  const [selectedPlatforms, setSelectedPlatforms] = useState<SelectedPlatform[]>([])

  function handleContextFetched(extracted: Record<string, unknown>, rawScrape: string) {
    setContext({
      positioning: (extracted.positioning as string) || '',
      target_audience: (extracted.target_audience as string) || '',
      pain_points: (extracted.pain_points as string) || '',
      key_features: Array.isArray(extracted.key_features)
        ? extracted.key_features.map((f: { name?: string; description?: string }) => ({
            name: f.name || '', description: f.description || ''
          }))
        : [],
      competitors: (extracted.competitors as string) || '',
      differentiators: (extracted.differentiators as string) || '',
      cta: (extracted.cta as string) || '',
      tone_per_platform: (extracted.tone_per_platform as Record<string, string>) || {},
      github_repo: context.github_repo,
      raw_scrape: rawScrape,
    })
  }

  function validateStep1() {
    if (!product.name.trim()) return 'Product name is required'
    if (!product.id.trim()) return 'Product ID is required'
    if (!/^[a-z0-9-]+$/.test(product.id)) return 'ID must be lowercase letters, numbers, hyphens only'
    return null
  }

  function validateStep2() {
    if (!context.positioning.trim()) return 'Positioning is required — describe what the product does'
    if (!context.target_audience.trim()) return 'Target audience is required'
    return null
  }

  function validateStep3() {
    if (selectedPlatforms.length === 0) return 'Select at least one platform'
    return null
  }

  function next() {
    setError('')
    if (step === 1) { const err = validateStep1(); if (err) { setError(err); return } }
    if (step === 2) { const err = validateStep2(); if (err) { setError(err); return } }
    if (step === 3) { const err = validateStep3(); if (err) { setError(err); return } }
    setStep(s => s + 1)
  }

  function back() {
    setError('')
    setStep(s => s - 1)
  }

  async function submit() {
    setError('')
    setLoading(true)
    try {
      // Save product + platforms
      const resp = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product, platforms: selectedPlatforms }),
      })
      const data = await resp.json()
      if (!resp.ok) {
        setError(data.error || 'Failed to save product')
        return
      }

      // Save product context
      await fetch(`/api/products/${data.product.id}/context`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...context,
          website_url: product.domain.startsWith('http') ? product.domain : `https://${product.domain}`,
        }),
      })

      setSuccess({
        product: { id: data.product.id, name: data.product.name, domain: data.product.site || data.product.domain || '' },
        platforms: data.platforms.map((p: { platform: string; status: string; subreddits: string[] }) => ({
          platform: p.platform, status: p.status, subreddits: p.subreddits,
        })),
      })
      setStep(5) // success step
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-blue-50 to-indigo-50 pb-16">
      {/* Animated blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-violet-200/30 blur-3xl animate-blob" />
        <div className="absolute top-1/3 -left-40 w-[400px] h-[400px] rounded-full bg-blue-200/20 blur-3xl animate-blob animation-delay-2000" />
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-12">
        {/* Back link */}
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-8 transition-colors"
        >
          ← Back to Dashboard
        </button>

        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display font-bold text-gray-900 text-3xl mb-1">Add Product</h1>
          <p className="text-gray-500 text-sm">New product will be picked up by all n8n workflows automatically</p>
        </div>

        {/* Step indicator */}
        {step <= 4 && (
          <div className="flex items-center gap-0 mb-8">
            {STEPS.map((s, i) => (
              <div key={s.n} className="flex items-center">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all ${
                  step === s.n
                    ? 'bg-indigo-500 text-white shadow-md shadow-indigo-100'
                    : step > s.n
                    ? 'text-emerald-600'
                    : 'text-gray-400'
                }`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                    step > s.n ? 'bg-emerald-100' : step === s.n ? 'bg-white/20' : 'bg-gray-100'
                  }`}>
                    {step > s.n ? '✓' : s.n}
                  </span>
                  <span className="text-sm font-medium">{s.label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`h-px w-6 mx-1 ${step > s.n ? 'bg-emerald-300' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Card */}
        <div className="glass rounded-2xl shadow-xl shadow-indigo-100/30 overflow-hidden">
          <div className="p-6 md:p-8">
            {step === 1 && (
              <Step1ProductInfo
                data={product}
                onChange={setProduct}
                onContextFetched={handleContextFetched}
              />
            )}
            {step === 2 && (
              <StepProductContext data={context} onChange={setContext} />
            )}
            {step === 3 && (
              <Step2Platforms selected={selectedPlatforms} onChange={setSelectedPlatforms} />
            )}
            {step === 4 && (
              <Step3Credentials selected={selectedPlatforms} onChange={setSelectedPlatforms} />
            )}
            {step === 5 && success && (
              <Step4Success summary={success} />
            )}
          </div>

          {/* Footer nav */}
          {step <= 4 && (
            <div className="border-t border-white/30 px-6 md:px-8 py-4 flex items-center justify-between bg-white/30">
              <div>
                {error && (
                  <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl px-3 py-1.5">
                    {error}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                {step > 1 && (
                  <button
                    type="button"
                    onClick={back}
                    className="btn-glass px-4 py-2 rounded-xl text-sm font-medium text-gray-600"
                  >
                    ← Back
                  </button>
                )}
                {step < 4 ? (
                  <button
                    type="button"
                    onClick={next}
                    className="bg-indigo-500 hover:bg-indigo-600 text-white font-medium text-sm px-5 py-2 rounded-xl transition-colors shadow-md shadow-indigo-100"
                  >
                    Next →
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={submit}
                    disabled={loading}
                    className="bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white font-medium text-sm px-6 py-2 rounded-xl transition-colors shadow-md shadow-indigo-100"
                  >
                    {loading ? 'Saving...' : '🚀 Save Product'}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Success footer */}
          {step === 5 && (
            <div className="border-t border-white/30 px-6 md:px-8 py-4 flex items-center justify-between bg-white/30">
              <button
                type="button"
                onClick={() => router.push('/')}
                className="btn-glass px-4 py-2 rounded-xl text-sm font-medium text-gray-600"
              >
                ← Dashboard
              </button>
              <button
                type="button"
                onClick={() => router.push('/content')}
                className="bg-indigo-500 hover:bg-indigo-600 text-white font-medium text-sm px-5 py-2 rounded-xl transition-colors"
              >
                Add to Content Plan →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
