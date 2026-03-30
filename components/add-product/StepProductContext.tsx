'use client'

export type ProductContextData = {
  positioning: string
  target_audience: string
  pain_points: string
  key_features: { name: string; description: string }[]
  competitors: string
  differentiators: string
  cta: string
  tone_per_platform: Record<string, string>
  github_repo: string
  raw_scrape: string
}

export const EMPTY_CONTEXT: ProductContextData = {
  positioning: '',
  target_audience: '',
  pain_points: '',
  key_features: [],
  competitors: '',
  differentiators: '',
  cta: '',
  tone_per_platform: {},
  github_repo: '',
  raw_scrape: '',
}

const TONE_PLATFORMS = ['linkedin', 'twitter', 'devto', 'reddit', 'telegram'] as const

export function StepProductContext({
  data,
  onChange,
}: {
  data: ProductContextData
  onChange: (data: ProductContextData) => void
}) {
  const set = (field: keyof ProductContextData) => (val: string) =>
    onChange({ ...data, [field]: val })

  const setTone = (platform: string, tone: string) =>
    onChange({ ...data, tone_per_platform: { ...data.tone_per_platform, [platform]: tone } })

  const setFeature = (idx: number, field: 'name' | 'description', val: string) => {
    const features = [...data.key_features]
    features[idx] = { ...features[idx], [field]: val }
    onChange({ ...data, key_features: features })
  }

  const addFeature = () =>
    onChange({ ...data, key_features: [...data.key_features, { name: '', description: '' }] })

  const removeFeature = (idx: number) =>
    onChange({ ...data, key_features: data.key_features.filter((_, i) => i !== idx) })

  return (
    <div className="space-y-5">
      {data.raw_scrape && (
        <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl px-3 py-2 text-xs text-emerald-700">
          ✅ Pre-filled from website. Review and adjust below.
        </div>
      )}

      {/* Positioning */}
      <div>
        <label className="field-label">Positioning *</label>
        <input
          type="text"
          value={data.positioning}
          onChange={e => set('positioning')(e.target.value)}
          placeholder="AI agent monitoring for LLM apps"
          className="field-input"
        />
        <p className="text-xs text-gray-400 mt-0.5">One sentence — what the product is and who it&apos;s for</p>
      </div>

      {/* Target audience */}
      <div>
        <label className="field-label">Target audience *</label>
        <input
          type="text"
          value={data.target_audience}
          onChange={e => set('target_audience')(e.target.value)}
          placeholder="ML engineers, AI startup CTOs, DevOps teams"
          className="field-input"
        />
      </div>

      {/* Pain points */}
      <div>
        <label className="field-label">Pain points solved</label>
        <textarea
          value={data.pain_points}
          onChange={e => set('pain_points')(e.target.value)}
          placeholder={"Can't debug failing AI agents in production\nNo visibility into LLM cost per request\nSlow incident response for AI systems"}
          rows={3}
          className="field-input resize-none"
        />
        <p className="text-xs text-gray-400 mt-0.5">One per line</p>
      </div>

      {/* Key features */}
      <div>
        <label className="field-label">Key features</label>
        <div className="space-y-2">
          {data.key_features.map((f, i) => (
            <div key={i} className="flex gap-2 items-start">
              <input
                type="text"
                value={f.name}
                onChange={e => setFeature(i, 'name', e.target.value)}
                placeholder="Feature name"
                className="field-input w-1/3"
              />
              <input
                type="text"
                value={f.description}
                onChange={e => setFeature(i, 'description', e.target.value)}
                placeholder="Brief description"
                className="field-input flex-1"
              />
              <button
                type="button"
                onClick={() => removeFeature(i)}
                className="text-gray-400 hover:text-red-500 px-1 pt-2"
              >✕</button>
            </div>
          ))}
          <button
            type="button"
            onClick={addFeature}
            className="text-sm text-indigo-500 hover:text-indigo-700 font-medium"
          >+ Add feature</button>
        </div>
      </div>

      {/* Competitors + Differentiators */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="field-label">Competitors</label>
          <input
            type="text"
            value={data.competitors}
            onChange={e => set('competitors')(e.target.value)}
            placeholder="Datadog, Langfuse, LangSmith"
            className="field-input"
          />
        </div>
        <div>
          <label className="field-label">Differentiators</label>
          <input
            type="text"
            value={data.differentiators}
            onChange={e => set('differentiators')(e.target.value)}
            placeholder="Real-time anomaly detection, 10x cheaper"
            className="field-input"
          />
        </div>
      </div>

      {/* CTA */}
      <div>
        <label className="field-label">Call to action</label>
        <input
          type="text"
          value={data.cta}
          onChange={e => set('cta')(e.target.value)}
          placeholder="Start free trial at tracehawk.dev"
          className="field-input"
        />
      </div>

      {/* Tone per platform */}
      <div>
        <label className="field-label">Tone per platform <span className="text-gray-400 font-normal">(optional)</span></label>
        <div className="grid grid-cols-5 gap-2">
          {TONE_PLATFORMS.map(p => (
            <div key={p}>
              <label className="text-[10px] text-gray-400 uppercase tracking-wider">{p}</label>
              <select
                value={data.tone_per_platform[p] || ''}
                onChange={e => setTone(p, e.target.value)}
                className="field-input text-xs py-1"
              >
                <option value="">default</option>
                <option value="professional">Professional</option>
                <option value="casual">Casual</option>
                <option value="technical">Technical</option>
                <option value="provocative">Provocative</option>
                <option value="storytelling">Storytelling</option>
              </select>
            </div>
          ))}
        </div>
      </div>

      {/* GitHub repo */}
      <div>
        <label className="field-label">GitHub repo <span className="text-gray-400 font-normal">(optional — for changelog)</span></label>
        <input
          type="text"
          value={data.github_repo}
          onChange={e => set('github_repo')(e.target.value)}
          placeholder="owner/repo"
          className="field-input font-mono text-sm"
        />
      </div>
    </div>
  )
}
