// Formatting rules for LLM prompts — no HTML tags allowed
// Shared between Quick Post generate, Content Card regenerate, and n8n workflows

export const FORMAT_RULES = `CRITICAL FORMATTING RULES:
- NEVER use HTML tags (<b>, <i>, <a>, <br>, <p>, <strong>, <em>)
- For Telegram: use Telegram MarkdownV2 only:
  *bold text* for bold
  _italic text_ for italic
  \`code\` for inline code
  Plain URL: https://example.com (never wrap in <a> tags)
- For LinkedIn/Dev.to/Hashnode/Medium:
  **bold** for bold
  *italic* for italic
  [link text](url) for links
- For Twitter/Reddit/Instagram/Facebook:
  Plain text only, no formatting markup at all
- NEVER wrap links in <a href="..."> tags — just write the URL directly`

// Per-platform guidelines — no HTML instructions
export const PLATFORM_GUIDELINES: Record<string, string> = {
  twitter: 'Max 280 chars. Punchy, 1-2 hashtags.',
  linkedin: 'Professional thought-leadership. 3-5 hashtags at the end.',
  telegram: 'Casual tone. Emojis OK. Use *bold* and _italic_ (Telegram markdown). Link at end.',
  devto: 'Technical markdown. Developer-focused. Use **bold** and *italic*.',
  reddit: 'Conversational. No direct promo. Value-first. Plain text.',
  instagram: 'Short punchy caption. Hashtags at end. Plain text.',
  facebook: 'Conversational. Question hooks. Plain text.',
  hashnode: 'Technical blog style. Markdown formatting.',
  medium: 'Thoughtful long-form. Markdown formatting.',
  youtube: 'Script style. Clear structure with sections.',
}

// Strip HTML tags from text for safe preview display
export function stripHtml(text: string): string {
  return text
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim()
}

// Detect if text contains HTML tags
export function hasHtml(text: string): boolean {
  return /<[a-z]/i.test(text)
}

// Convert HTML to platform-appropriate format
export function cleanHtmlForPlatform(text: string, platform: string): string {
  let cleaned = text

  // Convert <b>/<strong> to platform bold
  const boldChar = platform === 'telegram' ? '*' : '**'
  cleaned = cleaned.replace(/<(?:b|strong)>(.*?)<\/(?:b|strong)>/gi, `${boldChar}$1${boldChar}`)

  // Convert <i>/<em> to platform italic
  const italicChar = platform === 'telegram' ? '_' : '*'
  cleaned = cleaned.replace(/<(?:i|em)>(.*?)<\/(?:i|em)>/gi, `${italicChar}$1${italicChar}`)

  // Convert <a href="url">text</a> to text url (or [text](url) for markdown platforms)
  const markdownPlatforms = ['linkedin', 'devto', 'hashnode', 'medium']
  if (markdownPlatforms.includes(platform)) {
    cleaned = cleaned.replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
  } else {
    cleaned = cleaned.replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '$2 $1')
  }

  // Convert <br> / <br/> to newline
  cleaned = cleaned.replace(/<br\s*\/?>/gi, '\n')

  // Convert <p>...</p> to text with double newline
  cleaned = cleaned.replace(/<p>(.*?)<\/p>/gi, '$1\n\n')

  // Strip any remaining HTML tags
  cleaned = cleaned.replace(/<[^>]*>/g, '')

  // Decode entities
  cleaned = cleaned
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')

  // Clean up excessive newlines
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n').trim()

  return cleaned
}
