// Content size definitions — single source of truth
// Used by Quick Post, Content Card, Calendar, and n8n workflow prompts

export type ContentSize = 'short' | 'medium' | 'long'

export const CONTENT_SIZES: Record<ContentSize, {
  label: string
  description: string
  limits: Record<string, string>
}> = {
  short: {
    label: 'Short',
    description: 'Quick update or hot take',
    limits: {
      twitter: '200-280 chars',
      telegram: '300-500 chars',
      instagram: '150-300 chars',
      reddit: '500-800 chars',
      linkedin: '400-700 chars',
      devto: '300-500 words',
      hashnode: '300-500 words',
      medium: '300-500 words',
      default: '300-500 chars',
    },
  },
  medium: {
    label: 'Medium',
    description: 'Standard post with context',
    limits: {
      twitter: '200-280 chars',
      telegram: '500-1000 chars',
      instagram: '300-500 chars',
      reddit: '800-1500 chars',
      linkedin: '800-1500 chars',
      devto: '600-1000 words',
      hashnode: '600-1000 words',
      medium: '800-1500 words',
      default: '500-1000 chars',
    },
  },
  long: {
    label: 'Long',
    description: 'Deep dive or detailed article',
    limits: {
      twitter: '200-280 chars', // Twitter always short by nature
      telegram: '1000-2000 chars',
      instagram: '500-800 chars',
      reddit: '1500-3000 chars',
      linkedin: '1500-3000 chars',
      devto: '1500-2500 words',
      hashnode: '1200-2000 words',
      medium: '2000-3000 words',
      default: '1000-2000 chars',
    },
  },
}

// Platforms that ignore size — always produce short content
export const ALWAYS_SHORT: string[] = ['twitter', 'tiktok']

export function getSizeLimit(platform: string, size: ContentSize): string {
  const effectiveSize = ALWAYS_SHORT.includes(platform) ? 'short' : size
  return CONTENT_SIZES[effectiveSize].limits[platform]
    || CONTENT_SIZES[effectiveSize].limits.default
}

// Image aspect ratio based on content size
export function getImageAspect(size: ContentSize): { ratio: string; hint: string } {
  switch (size) {
    case 'short': return { ratio: '1:1', hint: 'Square 1:1 — compact visual' }
    case 'medium': return { ratio: '16:9', hint: 'Horizontal 16:9 — standard' }
    case 'long': return { ratio: '16:9', hint: 'Wide header 16:9 — article cover' }
  }
}
