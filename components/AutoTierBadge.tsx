'use client'
import { useState } from 'react'
import { getPlatformType, TYPE_META, type PlatformType } from '@/lib/platform-types'

export function AutoTierBadge({
  platform,
  tier,
  size = 'sm',
}: {
  platform?: string
  tier?: PlatformType
  size?: 'xs' | 'sm'
}) {
  const [showTip, setShowTip] = useState(false)

  const resolvedTier: PlatformType = tier ?? (platform ? getPlatformType(platform) : 'manual')
  const meta = TYPE_META[resolvedTier]

  const sizeClass = size === 'xs'
    ? 'text-[9px] px-1 py-0'
    : 'text-[10px] px-1.5 py-0.5'

  return (
    <span className="relative inline-block">
      <span
        className={`inline-flex items-center gap-0.5 rounded-full font-medium cursor-default whitespace-nowrap ${sizeClass} ${meta.badge}`}
        onMouseEnter={() => setShowTip(true)}
        onMouseLeave={() => setShowTip(false)}
      >
        <span>{meta.emoji}</span>
        <span>{meta.label}</span>
      </span>

      {showTip && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none">
          <span className="block bg-gray-900 text-white text-xs rounded-xl px-3 py-2 shadow-xl max-w-[200px] text-center leading-snug whitespace-normal">
            {meta.tooltip}
          </span>
          <span className="block w-2 h-2 bg-gray-900 rotate-45 mx-auto -mt-1" />
        </span>
      )}
    </span>
  )
}

// Compact legend row
export function AutoTierLegend() {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      {(['auto', 'semi_auto', 'manual'] as PlatformType[]).map(tier => {
        const meta = TYPE_META[tier]
        return (
          <span key={tier} className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${meta.badge}`}>
            {meta.emoji} {meta.label}
          </span>
        )
      })}
    </div>
  )
}
