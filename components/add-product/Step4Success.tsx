'use client'
import { PlatformIcon } from '@/components/PlatformIcon'
import { PLATFORM_BY_ID } from '@/lib/platforms'

type Summary = {
  product: { id: string; name: string; domain: string }
  platforms: { platform: string; status: string; subreddits: string[] }[]
}

const MANUAL_SIGNUP: Record<string, { label: string; url: string }> = {
  producthunt: { label: 'Create Product Hunt page', url: 'https://www.producthunt.com/posts/new' },
  indiehackers: { label: 'Add your product on Indie Hackers', url: 'https://www.indiehackers.com/products/new' },
  hackernews: { label: 'Submit to Hacker News', url: 'https://news.ycombinator.com/submit' },
  tiktok: { label: 'Create TikTok Business account', url: 'https://business.tiktok.com' },
}

export function Step4Success({ summary }: { summary: Summary }) {
  const ready      = summary.platforms.filter(p => p.status === 'ready')
  const needsSetup = summary.platforms.filter(p => p.status === 'needs_setup')
  const manual     = summary.platforms.filter(p => p.status === 'manual_only')

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="text-center py-4">
        <div className="text-5xl mb-3">🚀</div>
        <h2 className="font-display font-bold text-gray-900 text-2xl mb-1">
          {summary.product.name} is live!
        </h2>
        <p className="text-gray-500 text-sm">
          {summary.product.domain && <span className="font-mono">{summary.product.domain} · </span>}
          {summary.platforms.length} platform{summary.platforms.length !== 1 ? 's' : ''} configured
        </p>
      </div>

      {/* Ready */}
      {ready.length > 0 && (
        <Section icon="✅" label="Ready to publish" color="emerald">
          {ready.map(p => (
            <PlatformRow key={p.platform} platform={p.platform} />
          ))}
        </Section>
      )}

      {/* Needs setup */}
      {needsSetup.length > 0 && (
        <Section icon="⚙️" label="Needs credentials setup" color="amber">
          {needsSetup.map(p => (
            <PlatformRow key={p.platform} platform={p.platform}>
              <span className="text-xs text-amber-600">Add credentials to activate auto-posting</span>
            </PlatformRow>
          ))}
        </Section>
      )}

      {/* Manual only */}
      {manual.length > 0 && (
        <Section icon="✋" label="Manual only" color="gray">
          {manual.map(p => {
            const link = MANUAL_SIGNUP[p.platform]
            return (
              <PlatformRow key={p.platform} platform={p.platform}>
                {link && (
                  <a href={link.url} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-indigo-600 underline hover:text-indigo-800">
                    → {link.label}
                  </a>
                )}
              </PlatformRow>
            )
          })}
        </Section>
      )}

      {/* Next actions */}
      <div className="glass rounded-xl p-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Next steps</p>
        <ol className="space-y-2 text-sm text-gray-700">
          {needsSetup.length > 0 && (
            <li>1. Fill in missing credentials for {needsSetup.length} platform{needsSetup.length !== 1 ? 's' : ''}</li>
          )}
          <li className={needsSetup.length > 0 ? '2.' : '1.'}>
            Add content to the <a href="/content" className="text-indigo-600 underline">Content Plan</a> — select <strong>{summary.product.name}</strong> as product
          </li>
          <li>Run <strong>WF-9</strong> to auto-generate a content plan for this product</li>
        </ol>
      </div>
    </div>
  )
}

function Section({ icon, label, color, children }: {
  icon: string
  label: string
  color: 'emerald' | 'amber' | 'gray'
  children: React.ReactNode
}) {
  const colors = {
    emerald: 'text-emerald-700 bg-emerald-50 border-emerald-100',
    amber:   'text-amber-700 bg-amber-50 border-amber-100',
    gray:    'text-gray-600 bg-gray-50 border-gray-200',
  }
  return (
    <div className={`rounded-xl border p-4 space-y-2 ${colors[color]}`}>
      <p className="text-xs font-semibold uppercase tracking-widest mb-2">{icon} {label}</p>
      {children}
    </div>
  )
}

function PlatformRow({ platform, children }: { platform: string; children?: React.ReactNode }) {
  const config = PLATFORM_BY_ID[platform]
  return (
    <div className="flex items-center gap-2">
      <PlatformIcon platform={platform} size={14} />
      <span className="text-sm font-medium text-gray-800">{config?.label || platform}</span>
      {children && <span className="ml-2">{children}</span>}
    </div>
  )
}
