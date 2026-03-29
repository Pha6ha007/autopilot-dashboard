import React from 'react'

// Social platform SVG icons — pixel-perfect brand icons
export function PlatformIcon({ platform, size = 14 }: { platform: string; size?: number }) {
  const s = size
  const icons: Record<string, React.ReactElement> = {
    youtube: (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" fill="#FF0000"/>
        <polygon points="9.75,15.02 15.5,12 9.75,8.98 9.75,15.02" fill="white"/>
      </svg>
    ),
    telegram: (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="12" fill="#29B6F6"/>
        <path d="M5.5 11.5l13-5-4 13-3-4.5-3 2 1-5.5z" fill="white" opacity="0.3"/>
        <path d="M5.5 11.5l5 2 2 5.5 1.5-4.5 4.5-8-13 5z" fill="white"/>
        <path d="M10.5 13.5l1 3.5 1.5-4.5" fill="#29B6F6"/>
      </svg>
    ),
    twitter: (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <rect width="24" height="24" rx="6" fill="#000"/>
        <path d="M17.5 4.5h2.5l-5.5 6.3 6.5 8.7h-5l-3.9-5.1-4.5 5.1H5l5.9-6.7L4.5 4.5h5.2l3.5 4.6L17.5 4.5zm-.9 13.5h1.4L7.9 6h-1.5L16.6 18z" fill="white"/>
      </svg>
    ),
    linkedin: (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <rect width="24" height="24" rx="5" fill="#0A66C2"/>
        <path d="M7 9h-2v8h2V9zM6 8a1.25 1.25 0 1 0 0-2.5A1.25 1.25 0 0 0 6 8z" fill="white"/>
        <path d="M19 17h-2v-3.5c0-1-.5-1.5-1.25-1.5-.75 0-1.25.5-1.25 1.5V17h-2V9h2v1c.5-.75 1.25-1.25 2.25-1.25C18 8.75 19 9.75 19 12V17z" fill="white"/>
      </svg>
    ),
    instagram: (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <defs>
          <radialGradient id="ig-g" cx="30%" cy="107%" r="150%">
            <stop offset="0%" stopColor="#fdf497"/>
            <stop offset="10%" stopColor="#fdf497"/>
            <stop offset="50%" stopColor="#fd5949"/>
            <stop offset="68%" stopColor="#d6249f"/>
            <stop offset="100%" stopColor="#285AEB"/>
          </radialGradient>
        </defs>
        <rect width="24" height="24" rx="6" fill="url(#ig-g)"/>
        <circle cx="12" cy="12" r="4" stroke="white" strokeWidth="1.8" fill="none"/>
        <circle cx="17.5" cy="6.5" r="1.2" fill="white"/>
        <rect x="3" y="3" width="18" height="18" rx="5" stroke="white" strokeWidth="1.5" fill="none"/>
      </svg>
    ),
    tiktok: (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <rect width="24" height="24" rx="6" fill="#000"/>
        <path d="M17 6.5c-.8-.9-1.3-2.1-1.3-3.5h-2.4v11.8c0 1.2-1 2.2-2.2 2.2s-2.2-1-2.2-2.2 1-2.2 2.2-2.2c.2 0 .5 0 .7.1V10c-.2 0-.4-.1-.7-.1a4.6 4.6 0 0 0-4.6 4.6 4.6 4.6 0 0 0 4.6 4.6 4.6 4.6 0 0 0 4.6-4.6V9.7c.9.6 2 1 3.3 1V8.3C18.3 8.3 17.5 7.5 17 6.5z" fill="white"/>
        <path d="M17 6.5c-.5-.6-.9-1.3-1.1-2h0" stroke="#FE2C55" strokeWidth="1" fill="none"/>
        <path d="M13.5 17a2.2 2.2 0 0 1-2.2 2.2V21a4.6 4.6 0 0 0 4.6-4.6" fill="#69C9D0"/>
      </svg>
    ),
    devto: (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <rect width="24" height="24" rx="5" fill="#0A0A0A"/>
        <text x="3" y="17" fontSize="9" fontWeight="700" fill="white" fontFamily="monospace">DEV</text>
      </svg>
    ),
    hashnode: (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <rect width="24" height="24" rx="6" fill="#2962FF"/>
        <path d="M12 4L19 7.5v9L12 20 5 16.5v-9L12 4zm0 5a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" fill="white"/>
      </svg>
    ),
    medium: (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <rect width="24" height="24" rx="5" fill="#000"/>
        <ellipse cx="8.5" cy="12" rx="4.5" ry="5" fill="white"/>
        <ellipse cx="16" cy="12" rx="2" ry="4.5" fill="white"/>
        <rect x="20" y="7.5" width="1.5" height="9" rx="0.75" fill="white"/>
      </svg>
    ),
    facebook: (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <rect width="24" height="24" rx="6" fill="#1877F2"/>
        <path d="M13 21v-7h2.5l.5-3H13V9.5c0-.8.4-1.5 1.5-1.5H16V5.2S15.1 5 14.1 5C11.7 5 10 6.6 10 9.1V11H7.5v3H10v7h3z" fill="white"/>
      </svg>
    ),
    reddit: (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="12" fill="#FF4500"/>
        <path d="M20 12a1.5 1.5 0 0 0-2.5-1.1c-1.3-.9-3-.9-4.5-.8l.8-3.5 2.5.5a1.2 1.2 0 1 0 1.2-1.3 1.2 1.2 0 0 0-1.1.7L14 6a.3.3 0 0 0-.3.2l-.9 4c-1.5 0-3 .1-4.3.8A1.5 1.5 0 1 0 7 13c0 .2 0 .4.1.5-1.5 2.5 4 4.5 5 4.5s6.5-2 5-4.5l.1-.5A1.5 1.5 0 0 0 20 12zm-9 2a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm4 2.5c-.9.5-2.5.5-2.5.5s-1.6 0-2.5-.5a.3.3 0 0 1 .3-.5c.6.4 2.2.4 2.2.4s1.6 0 2.2-.4a.3.3 0 0 1 .3.5zm-.5-1.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z" fill="white"/>
      </svg>
    ),
    buffer: (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <rect width="24" height="24" rx="6" fill="#168EEA"/>
        <path d="M12 3.5l8 4-8 4-8-4 8-4zm-8 8l8 4 8-4m-16 4l8 4 8-4" stroke="white" strokeWidth="1.5" fill="none" strokeLinejoin="round"/>
      </svg>
    ),
    producthunt: (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="12" fill="#DA552F"/>
        <path d="M10 8h3.5a2.5 2.5 0 0 1 0 5H10V8zm0 5h1v3h-1v-3z" fill="none" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
        <path d="M10 8h3.5a2.5 2.5 0 0 1 0 5H10V8z" fill="white"/>
        <rect x="10" y="13" width="1.5" height="3" fill="white"/>
      </svg>
    ),
    github: (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <rect width="24" height="24" rx="6" fill="#24292E"/>
        <path d="M12 4C7.6 4 4 7.6 4 12c0 3.5 2.3 6.5 5.5 7.5.4.1.5-.2.5-.4v-1.4c-2.2.5-2.7-1.1-2.7-1.1-.4-.9-.9-1.2-.9-1.2-.7-.5.1-.5.1-.5.8.1 1.2.8 1.2.8.7 1.2 1.9.9 2.3.7.1-.5.3-.9.5-1.1-1.8-.2-3.6-.9-3.6-4 0-.9.3-1.6.8-2.2-.1-.2-.4-1 .1-2.1 0 0 .7-.2 2.2.8a7.7 7.7 0 0 1 4 0c1.5-1 2.2-.8 2.2-.8.5 1.1.2 1.9.1 2.1.5.6.8 1.3.8 2.2 0 3.1-1.9 3.8-3.7 4 .3.3.6.8.6 1.6v2.3c0 .2.1.5.5.4A8 8 0 0 0 20 12c0-4.4-3.6-8-8-8z" fill="white"/>
      </svg>
    ),
    hackernews: (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <rect width="24" height="24" rx="4" fill="#FF6600"/>
        <text x="5" y="17" fontSize="13" fontWeight="900" fill="white" fontFamily="Verdana, sans-serif">Y</text>
      </svg>
    ),
    indiehackers: (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <rect width="24" height="24" rx="6" fill="#0E2150"/>
        <text x="4" y="17" fontSize="11" fontWeight="800" fill="#5BB8FF" fontFamily="monospace">IH</text>
      </svg>
    ),
    googlebusiness: (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <rect width="24" height="24" rx="5" fill="#fff" stroke="#e0e0e0" strokeWidth="1"/>
        <path d="M12 11.5h5.5c.1.5.1 1 .1 1.5 0 3-2 5.5-5.6 5.5A5.5 5.5 0 0 1 6.5 13a5.5 5.5 0 0 1 5.5-5.5c1.5 0 2.7.5 3.7 1.4l-1.5 1.5c-.6-.5-1.3-.8-2.2-.8A3.4 3.4 0 0 0 8.6 13a3.4 3.4 0 0 0 3.4 3.4c2.2 0 3-1.5 3.1-2.3H12v-2z" fill="#4285F4"/>
        <path d="M6.5 13a5.5 5.5 0 0 1 5.5-5.5v2.1A3.4 3.4 0 0 0 8.6 13H6.5z" fill="#34A853"/>
        <path d="M6.5 13H8.6a3.4 3.4 0 0 0 3.4 3.4v2.1A5.5 5.5 0 0 1 6.5 13z" fill="#FBBC05"/>
        <path d="M12 18.5v-2.1a3.4 3.4 0 0 0 3.1-2.3H12v-2h5.5c.1.5.1 1 .1 1.5C17.6 16.5 15.3 18.5 12 18.5z" fill="#EA4335"/>
      </svg>
    ),
  }
  return icons[platform] || (
    <span className="w-3.5 h-3.5 rounded bg-gray-200 inline-flex items-center justify-center text-[9px] font-bold text-gray-500 uppercase">
      {platform[0]}
    </span>
  )
}
