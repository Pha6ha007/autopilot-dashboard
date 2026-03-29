// Platform configuration: credentials fields, status, groups
export type CredentialField = {
  key: string
  label: string
  placeholder?: string
  type?: 'text' | 'password'
  hint?: string
}

export type PlatformConfig = {
  id: string
  label: string
  group: 'social' | 'developer' | 'community' | 'video' | 'messaging' | 'business'
  color: string          // bg color for icon badge
  status: 'api' | 'manual_only'
  credentialFields: CredentialField[]
  manualInstructions?: string
  setupUrl?: string
}

export const PLATFORM_GROUPS: { id: string; label: string }[] = [
  { id: 'social',    label: 'Social Media' },
  { id: 'developer', label: 'Developer' },
  { id: 'community', label: 'Community' },
  { id: 'video',     label: 'Video' },
  { id: 'messaging', label: 'Messaging' },
  { id: 'business',  label: 'Local / Business' },
]

export const PLATFORMS: PlatformConfig[] = [
  // Social
  {
    id: 'twitter', label: 'Twitter / X', group: 'social', color: '#000', status: 'api',
    credentialFields: [
      { key: 'bearer_token', label: 'Bearer Token', type: 'password', placeholder: 'AAAA...', hint: 'From Twitter Developer Portal → Keys and Tokens' },
      { key: 'account_handle', label: 'Account handle', placeholder: '@yourhandle' },
    ],
  },
  {
    id: 'linkedin', label: 'LinkedIn', group: 'social', color: '#0A66C2', status: 'api',
    credentialFields: [
      { key: 'page_id', label: 'Page ID', placeholder: 'urn:li:organization:123456' },
      { key: 'access_token', label: 'Access Token', type: 'password', hint: 'LinkedIn Developer App → OAuth 2.0 token' },
    ],
  },
  {
    id: 'instagram', label: 'Instagram', group: 'social', color: '#E1306C', status: 'api',
    credentialFields: [
      { key: 'business_account_id', label: 'Business Account ID', placeholder: '17841400...' },
      { key: 'facebook_token', label: 'Facebook Token', type: 'password', hint: 'Long-lived token from Facebook App' },
    ],
  },
  {
    id: 'tiktok', label: 'TikTok', group: 'social', color: '#000', status: 'manual_only',
    credentialFields: [],
    manualInstructions: 'TikTok does not provide a public API for auto-posting. Post manually using the generated content.',
  },
  {
    id: 'facebook', label: 'Facebook', group: 'social', color: '#1877F2', status: 'api',
    credentialFields: [
      { key: 'page_id', label: 'Page ID' },
      { key: 'page_access_token', label: 'Page Access Token', type: 'password' },
    ],
  },
  // Developer
  {
    id: 'devto', label: 'Dev.to', group: 'developer', color: '#0A0A0A', status: 'api',
    credentialFields: [
      { key: 'api_key', label: 'API Key', type: 'password', hint: 'dev.to → Settings → Account → DEV API Keys' },
    ],
  },
  {
    id: 'hashnode', label: 'Hashnode', group: 'developer', color: '#2962FF', status: 'api',
    credentialFields: [
      { key: 'api_key', label: 'API Key', type: 'password', hint: 'hashnode.com → Settings → Developer' },
      { key: 'publication_id', label: 'Publication ID', placeholder: '64a1b2c3d4e5f6...' },
    ],
  },
  {
    id: 'medium', label: 'Medium', group: 'developer', color: '#000', status: 'api',
    credentialFields: [
      { key: 'integration_token', label: 'Integration Token', type: 'password', hint: 'medium.com → Settings → Security → Integration tokens' },
    ],
  },
  {
    id: 'github', label: 'GitHub', group: 'developer', color: '#24292E', status: 'api',
    credentialFields: [
      { key: 'token', label: 'Personal Access Token', type: 'password', hint: 'github.com → Settings → Developer settings → PAT' },
      { key: 'repo_name', label: 'Repo name', placeholder: 'owner/repo' },
    ],
  },
  {
    id: 'hackernews', label: 'Hacker News', group: 'developer', color: '#FF6600', status: 'manual_only',
    credentialFields: [],
    manualInstructions: 'Hacker News has no posting API. Submit links manually at news.ycombinator.com/submit.',
    setupUrl: 'https://news.ycombinator.com/submit',
  },
  // Community
  {
    id: 'reddit', label: 'Reddit', group: 'community', color: '#FF4500', status: 'api',
    credentialFields: [
      { key: 'client_id', label: 'Client ID', hint: 'reddit.com/prefs/apps → create app → client ID' },
      { key: 'client_secret', label: 'Client Secret', type: 'password' },
      { key: 'username', label: 'Reddit username' },
      { key: 'password', label: 'Password', type: 'password' },
    ],
    // subreddits handled separately
  },
  {
    id: 'producthunt', label: 'Product Hunt', group: 'community', color: '#DA552F', status: 'api',
    credentialFields: [
      { key: 'api_key', label: 'API Key', type: 'password', hint: 'api.producthunt.com → Developer Settings' },
      { key: 'maker_username', label: 'Maker username', placeholder: '@yourhandle' },
    ],
  },
  {
    id: 'indiehackers', label: 'Indie Hackers', group: 'community', color: '#0E2150', status: 'manual_only',
    credentialFields: [],
    manualInstructions: 'Indie Hackers has no public API. Post to your product page or groups manually.',
    setupUrl: 'https://www.indiehackers.com',
  },
  // Video
  {
    id: 'youtube', label: 'YouTube', group: 'video', color: '#FF0000', status: 'api',
    credentialFields: [
      { key: 'channel_id', label: 'Channel ID', placeholder: 'UC...' },
      { key: 'google_oauth_token', label: 'Google OAuth Token', type: 'password', hint: 'From Google Cloud Console → OAuth 2.0 credentials' },
    ],
  },
  // Messaging
  {
    id: 'telegram', label: 'Telegram', group: 'messaging', color: '#29B6F6', status: 'api',
    credentialFields: [
      { key: 'bot_token', label: 'Bot Token', type: 'password', placeholder: '123456789:AAF...', hint: 'From @BotFather → /newbot' },
      { key: 'channel_id', label: 'Channel ID', placeholder: '-100123456789 or @channelusername' },
    ],
  },
  // Business
  {
    id: 'googlebusiness', label: 'Google Business', group: 'business', color: '#4285F4', status: 'api',
    credentialFields: [
      { key: 'place_id', label: 'Place ID', placeholder: 'ChIJ...', hint: 'Find at maps.googleapis.com/maps/api/place/findplacefromtext' },
      { key: 'google_oauth_token', label: 'Google OAuth Token', type: 'password' },
    ],
  },
  // Buffer (shown as sub-option under Twitter usually, but can be standalone)
  {
    id: 'buffer', label: 'Buffer', group: 'social', color: '#168EEA', status: 'api',
    credentialFields: [
      { key: 'access_token', label: 'Access Token', type: 'password', hint: 'publish.buffer.com → Settings → API' },
      { key: 'profile_id', label: 'Profile ID', placeholder: 'Twitter profile ID from Buffer' },
    ],
  },
]

export const PLATFORM_BY_ID = Object.fromEntries(PLATFORMS.map(p => [p.id, p]))
