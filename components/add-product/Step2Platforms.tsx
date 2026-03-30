'use client'
import { PlatformIcon } from '@/components/PlatformIcon'
import { AutoTierBadge, AutoTierLegend } from '@/components/AutoTierBadge'
import { PLATFORMS, PLATFORM_GROUPS, type PlatformConfig } from '@/lib/platforms'
import { getPlatformType } from '@/lib/platform-types'

type SelectedPlatform = {
  platform: string
  credentials: Record<string, string>
  subreddits: string[]
}

export function Step2Platforms({
  selected,
  onChange,
}: {
  selected: SelectedPlatform[]
  onChange: (selected: SelectedPlatform[]) => void
}) {
  const selectedIds = new Set(selected.map(s => s.platform))

  function toggle(p: PlatformConfig) {
    if (selectedIds.has(p.id)) {
      onChange(selected.filter(s => s.platform !== p.id))
    } else {
      onChange([...selected, { platform: p.id, credentials: {}, subreddits: [] }])
    }
  }

  const manualCount = selected.filter(s => getPlatformType(s.platform) === 'manual').length

  return (
    <div className="space-y-6">
      {/* Legend */}
      <div className="flex items-center justify-between">
        <AutoTierLegend />
        {manualCount > 0 && (
          <span className="text-xs text-gray-400">
            {manualCount} manual-only → always goes to Manual Queue
          </span>
        )}
      </div>

      {PLATFORM_GROUPS.map(group => {
        const platforms = PLATFORMS.filter(p => p.group === group.id)
        if (!platforms.length) return null
        return (
          <div key={group.id}>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
              {group.label}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {platforms.map(p => {
                const isSelected = selectedIds.has(p.id)
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => toggle(p)}
                    className={`flex flex-col gap-1.5 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all text-left ${
                      isSelected
                        ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-sm'
                        : 'bg-white/60 border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-white/80'
                    }`}
                  >
                    {/* Top row: checkbox + icon + label */}
                    <div className="flex items-center gap-2">
                      <span className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-all ${
                        isSelected ? 'bg-indigo-500' : 'bg-gray-100'
                      }`}>
                        {isSelected && (
                          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </span>
                      <PlatformIcon platform={p.id} size={13} />
                      <span className="flex-1 text-sm">{p.label}</span>
                    </div>
                    {/* Bottom row: tier badge */}
                    <div className="pl-6">
                      <AutoTierBadge platform={p.id} size="xs" />
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}

      {selected.length > 0 && (
        <p className="text-sm text-indigo-600 font-medium">
          {selected.length} platform{selected.length !== 1 ? 's' : ''} selected
        </p>
      )}
    </div>
  )
}
