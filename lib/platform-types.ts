// Platform automation type mapping
// Single source of truth — QueueClient, Step2, Step3, product page all read from here

export type PlatformType = 'auto' | 'semi_auto' | 'manual'

export const PLATFORM_TYPES: Record<PlatformType, string[]> = {
  // Publishes automatically via API — no human action needed
  auto: [
    'telegram', 'linkedin', 'devto',
    'hashnode', 'medium', 'buffer',
    'youtube', 'github', 'googlebusiness',
  ],
  // API exists but has rate limits, approval flows, or risk of account action
  semi_auto: [
    'instagram',   // needs Facebook Business setup
    'reddit',      // rate limits, subreddit rules, ban risk
    'twitter',     // only via Buffer
    'facebook',
  ],
  // No public posting API — must post manually
  manual: [
    'tiktok',
    'hackernews',
    'indiehackers',
    'producthunt',
  ],
}

export function getPlatformType(platform: string): PlatformType {
  for (const [type, list] of Object.entries(PLATFORM_TYPES)) {
    if (list.includes(platform)) return type as PlatformType
  }
  return 'manual' // unknown platforms default to manual
}

export const PLATFORM_OPEN_URLS: Record<string, string> = {
  producthunt:  'https://www.producthunt.com/posts/new',
  hackernews:   'https://news.ycombinator.com/submit',
  indiehackers: 'https://www.indiehackers.com/products',
  tiktok:       'https://www.tiktok.com/upload',
  reddit:       'https://www.reddit.com/submit',
  twitter:      'https://twitter.com/compose/tweet',
  instagram:    'https://www.instagram.com',
}

export const TYPE_META: Record<PlatformType, {
  label: string
  emoji: string
  badge: string     // tailwind classes
  tooltip: string
  warning?: string  // for semi_auto
}> = {
  auto: {
    label:   'Auto',
    emoji:   '✅',
    badge:   'bg-green-100 text-green-700 border border-green-200',
    tooltip: 'Publishes automatically via API. No action required.',
  },
  semi_auto: {
    label:   'Semi-auto',
    emoji:   '⚠️',
    badge:   'bg-yellow-100 text-yellow-700 border border-yellow-200',
    tooltip: 'Can publish via API but has rate limits or requires careful setup. Manual approval recommended.',
    warning: '⚠️ manual approval required',
  },
  manual: {
    label:   'Manual',
    emoji:   '✋',
    badge:   'bg-gray-100 text-gray-600 border border-gray-200',
    tooltip: 'No publishing API available. Content appears in Manual Queue for you to copy and post yourself.',
  },
}
