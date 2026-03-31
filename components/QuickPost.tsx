'use client'
import { useState, useCallback } from 'react'
import { PlatformIcon } from './PlatformIcon'
import { CONTENT_SIZES, ALWAYS_SHORT, getSizeLimit, type ContentSize } from '@/lib/content-size'

type Props = {
  productId: string
  productName: string
  platform: string
  chatId?: string
  channelUsername?: string
}

const CHAR_LIMITS: Record<string, number> = {
  twitter: 280, linkedin: 3000, telegram: 4096, instagram: 2200,
  devto: 8000, reddit: 10000, facebook: 5000,
}

export function QuickPost({ productId, productName, platform, chatId, channelUsername }: Props) {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<'write' | 'generate'>('write')
  const [topic, setTopic] = useState('')
  const [content, setContent] = useState('')
  const [contentSize, setContentSize] = useState<ContentSize>('medium')
  const [generating, setGenerating] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [result, setResult] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [imageLoading, setImageLoading] = useState(false)
  const [publishUrl, setPublishUrl] = useState('')

  const isAlwaysShort = ALWAYS_SHORT.includes(platform)
  const effectiveSize: ContentSize = isAlwaysShort ? 'short' : contentSize
  const charLimit = CHAR_LIMITS[platform] || 5000

  const generateContent = useCallback(async () => {
    if (!topic.trim()) return
    setGenerating(true)
    setResult('')
    try {
      const resp = await fetch('/api/quick-post/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: productId, platform, topic, content_size: effectiveSize }),
      })
      const data = await resp.json()
      if (resp.ok && data.content) {
        setContent(data.content)
        setMode('write')
      } else {
        setResult(`❌ ${data.error || 'Generation failed'}`)
      }
    } catch (e) {
      setResult(`❌ ${e instanceof Error ? e.message : 'Network error'}`)
    }
    setGenerating(false)
  }, [productId, platform, topic, effectiveSize])

  const generateImage = useCallback(async () => {
    setImageLoading(true)
    try {
      const resp = await fetch('/api/generate-image/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: productId,
          topic: topic || content.slice(0, 100),
          platform,
          style: 'cinematic',
          content_size: effectiveSize,
        }),
      })
      if (resp.ok) {
        const data = await resp.json()
        setImageUrl(data.image_url)
      }
    } catch {}
    setImageLoading(false)
  }, [productId, platform, topic, content, effectiveSize])

  const publish = useCallback(async () => {
    if (!content.trim()) return
    setPublishing(true)
    setResult('')
    try {
      const resp = await fetch('/api/quick-post/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: productId,
          platform,
          content,
          topic: topic || content.slice(0, 80),
          image_url: imageUrl || undefined,
          chat_id: chatId,
          channel_username: channelUsername,
        }),
      })
      const data = await resp.json()
      if (resp.ok) {
        const linkText = data.publish_url ? ` — ` : (data.external_id ? ` #${data.external_id}` : '')
        setResult(`✅ Published!${linkText}`)
        setPublishUrl(data.publish_url || '')
        setContent('')
        setTopic('')
        setImageUrl('')
      } else {
        setResult(`❌ ${data.error}`)
      }
    } catch (e) {
      setResult('❌ Network error')
    }
    setPublishing(false)
  }, [productId, platform, content, topic, imageUrl, chatId, channelUsername])

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-xl transition-colors w-full">
        ✍️ Quick Post
      </button>
    )
  }

  return (
    <div className="glass rounded-2xl p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PlatformIcon platform={platform} size={20} />
          <h3 className="font-display font-semibold text-gray-800">Quick Post → {platform}</h3>
        </div>
        <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-2">
        <button onClick={() => setMode('write')}
          className={`text-xs px-3 py-1 rounded-lg font-medium ${mode === 'write' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-100'}`}>
          ✍️ Write myself
        </button>
        <button onClick={() => setMode('generate')}
          className={`text-xs px-3 py-1 rounded-lg font-medium ${mode === 'generate' ? 'bg-violet-100 text-violet-700' : 'text-gray-500 hover:bg-gray-100'}`}>
          🤖 AI Generate
        </button>
      </div>

      {/* Size selector — hidden for always-short platforms */}
      {!isAlwaysShort && (
        <div className="flex items-center gap-1">
          <span className="text-[10px] uppercase tracking-wider text-gray-400 font-medium mr-1">Size:</span>
          {(['short', 'medium', 'long'] as ContentSize[]).map(s => (
            <button key={s} onClick={() => setContentSize(s)}
              className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all ${
                contentSize === s
                  ? 'bg-gray-800 text-white shadow-sm'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}>
              {s === 'short' ? 'S' : s === 'medium' ? 'M' : 'L'} {CONTENT_SIZES[s].label}
            </button>
          ))}
        </div>
      )}

      {/* Generate mode — topic input */}
      {mode === 'generate' && (
        <div className="flex gap-2">
          <input type="text" value={topic} onChange={e => setTopic(e.target.value)}
            placeholder="Topic: e.g. Why AI agents need monitoring"
            className="field-input flex-1 text-sm" />
          <button onClick={generateContent} disabled={generating || !topic.trim()}
            className="text-sm font-medium text-white bg-violet-500 hover:bg-violet-600 px-4 py-2 rounded-xl disabled:opacity-50 whitespace-nowrap">
            {generating ? '⏳ Generating…' : '🤖 Generate'}
          </button>
        </div>
      )}

      {/* Content textarea */}
      <div>
        <textarea value={content} onChange={e => setContent(e.target.value)}
          rows={5} placeholder={mode === 'write' ? 'Write your post here…' : 'Generated content will appear here…'}
          className="field-input text-sm resize-none w-full" />
        <div className="flex items-center justify-between mt-1">
          <span className={`text-xs ${content.length > charLimit ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
            {content.length} / {charLimit}
          </span>
          <span className="text-[10px] text-gray-400">Target: {getSizeLimit(platform, effectiveSize)}</span>
        </div>
      </div>

      {/* Image */}
      <div className="flex items-center gap-3">
        {imageUrl ? (
          <img src={imageUrl} alt="" className="w-20 h-20 object-cover rounded-lg border border-gray-100" />
        ) : null}
        <button onClick={generateImage} disabled={imageLoading}
          className="text-xs text-violet-500 hover:text-violet-700 font-medium disabled:opacity-50">
          {imageLoading ? '⏳ Generating image…' : imageUrl ? '🔄 New image' : '🎨 Generate image'}
        </button>
      </div>

      {/* Publish */}
      <div className="flex items-center gap-3">
        <button onClick={publish} disabled={publishing || !content.trim()}
          className="text-sm font-medium text-white bg-indigo-500 hover:bg-indigo-600 px-5 py-2 rounded-xl disabled:opacity-50 shadow-md shadow-indigo-100">
          {publishing ? '⏳ Publishing…' : '🚀 Publish now'}
        </button>
        {result && (
          <span className="text-sm">
            {result}
            {publishUrl && <a href={publishUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:text-indigo-700 ml-1">View ↗</a>}
          </span>
        )}
      </div>
    </div>
  )
}
