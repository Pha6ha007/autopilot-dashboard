'use client'
import { useState } from 'react'

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

const TOGGLE_OPTS = {
  tone: [
    { value: 'technical',   label: '⚙️ Technical' },
    { value: 'emotional',   label: '💬 Emotional' },
    { value: 'professional',label: '💼 Business' },
  ],
  primary_language: [
    { value: 'en',    label: '🇬🇧 EN' },
    { value: 'ru',    label: '🇷🇺 RU' },
    { value: 'ar',    label: '🇦🇪 AR' },
    { value: 'en_ru', label: '🌐 EN+RU' },
  ],
  content_types: [
    { value: 'articles', label: '📄 Articles' },
    { value: 'posts',    label: '💬 Posts' },
    { value: 'both',     label: '✨ Both' },
  ],
  frequency: [
    { value: 'daily',    label: '📅 Daily' },
    { value: '3x_week',  label: '📆 3×/week' },
    { value: 'weekly',   label: '🗓 Weekly' },
  ],
}

function ToggleGroup({ field, value, onChange, options }: {
  field: string
  value: string
  onChange: (val: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all border ${
            value === opt.value
              ? 'bg-indigo-500 text-white border-indigo-500 shadow-md shadow-indigo-100'
              : 'bg-white/60 text-gray-600 border-gray-200 hover:border-indigo-300 hover:bg-white/80'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

export function Step1ProductInfo({
  data,
  onChange,
  onContextFetched,
}: {
  data: Step1Data
  onChange: (data: Step1Data) => void
  onContextFetched?: (ctx: Record<string, unknown>, rawScrape: string) => void
}) {
  const [scraping, setScraping] = useState(false)
  const [scrapeError, setScrapeError] = useState('')

  const set = (field: keyof Step1Data) => (val: string) =>
    onChange({ ...data, [field]: val })

  // Auto-generate slug id from name
  const handleNameChange = (name: string) => {
    const id = data.id === '' || data.id === slugify(data.name)
      ? slugify(name)
      : data.id
    onChange({ ...data, name, id })
  }

  const handleFetchSite = async () => {
    if (!data.domain) return
    setScraping(true)
    setScrapeError('')
    try {
      const url = data.domain.startsWith('http') ? data.domain : `https://${data.domain}`
      const resp = await fetch('/api/scrape-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })
      const json = await resp.json()
      if (!resp.ok) throw new Error(json.error || 'Scrape failed')
      // Auto-fill description from positioning if empty
      if (!data.description && json.extracted?.positioning) {
        onChange({ ...data, description: json.extracted.positioning })
      }
      onContextFetched?.(json.extracted, json.raw_scrape || '')
    } catch (e: unknown) {
      setScrapeError(e instanceof Error ? e.message : String(e))
    } finally {
      setScraping(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Name + ID */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="field-label">Product name *</label>
          <input
            type="text"
            value={data.name}
            onChange={e => handleNameChange(e.target.value)}
            placeholder="TraceHawk"
            className="field-input"
          />
        </div>
        <div>
          <label className="field-label">
            ID <span className="text-gray-400 normal-case font-normal">(slug, used in DB)</span>
          </label>
          <input
            type="text"
            value={data.id}
            onChange={e => set('id')(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
            placeholder="tracehawk"
            className="field-input font-mono text-sm"
          />
        </div>
      </div>

      {/* Domain + Description */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="field-label">Domain</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={data.domain}
              onChange={e => set('domain')(e.target.value)}
              placeholder="tracehawk.dev"
              className="field-input flex-1"
            />
            <button
              type="button"
              onClick={handleFetchSite}
              disabled={!data.domain || scraping}
              className="px-3 py-2 rounded-xl text-sm font-medium bg-indigo-500 text-white hover:bg-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all whitespace-nowrap"
            >
              {scraping ? (
                <span className="flex items-center gap-1.5">
                  <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  Analyzing…
                </span>
              ) : '🔍 Fetch from site'}
            </button>
          </div>
          {scrapeError && <p className="text-xs text-red-500 mt-1">{scrapeError}</p>}
        </div>
        <div>
          <label className="field-label">One-liner description</label>
          <input
            type="text"
            value={data.description}
            onChange={e => set('description')(e.target.value)}
            placeholder="AI agent monitoring platform"
            className="field-input"
          />
        </div>
      </div>

      {/* Tone */}
      <div>
        <label className="field-label">Tone</label>
        <ToggleGroup field="tone" value={data.tone} onChange={set('tone')} options={TOGGLE_OPTS.tone} />
      </div>

      {/* Language */}
      <div>
        <label className="field-label">Content language</label>
        <ToggleGroup field="primary_language" value={data.primary_language} onChange={set('primary_language')} options={TOGGLE_OPTS.primary_language} />
      </div>

      {/* Content types + Frequency */}
      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="field-label">Content types</label>
          <ToggleGroup field="content_types" value={data.content_types} onChange={set('content_types')} options={TOGGLE_OPTS.content_types} />
        </div>
        <div>
          <label className="field-label">Publishing frequency</label>
          <ToggleGroup field="frequency" value={data.frequency} onChange={set('frequency')} options={TOGGLE_OPTS.frequency} />
        </div>
      </div>
    </div>
  )
}

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}
