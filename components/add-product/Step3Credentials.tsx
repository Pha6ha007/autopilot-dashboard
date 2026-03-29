'use client'
import { PlatformIcon } from '@/components/PlatformIcon'
import { PLATFORM_BY_ID } from '@/lib/platforms'

type SelectedPlatform = {
  platform: string
  credentials: Record<string, string>
  subreddits: string[]
}

export function Step3Credentials({
  selected,
  onChange,
}: {
  selected: SelectedPlatform[]
  onChange: (selected: SelectedPlatform[]) => void
}) {
  function updateCred(platformId: string, key: string, value: string) {
    onChange(selected.map(s =>
      s.platform === platformId
        ? { ...s, credentials: { ...s.credentials, [key]: value } }
        : s
    ))
  }

  function updateSubreddits(platformId: string, value: string) {
    const arr = value.split(',').map(s => s.trim()).filter(Boolean)
    onChange(selected.map(s =>
      s.platform === platformId ? { ...s, subreddits: arr } : s
    ))
  }

  const apiPlatforms = selected.filter(s => PLATFORM_BY_ID[s.platform]?.status === 'api')
  const manualPlatforms = selected.filter(s => PLATFORM_BY_ID[s.platform]?.status === 'manual_only')

  if (selected.length === 0) {
    return (
      <div className="text-center py-10 text-gray-400">
        No platforms selected. Go back and select at least one.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* API platforms — credentials form */}
      {apiPlatforms.map(sp => {
        const config = PLATFORM_BY_ID[sp.platform]
        if (!config) return null
        return (
          <div key={sp.platform} className="glass rounded-xl p-4 space-y-3">
            {/* Platform header */}
            <div className="flex items-center gap-2 mb-1">
              <PlatformIcon platform={sp.platform} size={16} />
              <span className="font-semibold text-gray-800 text-sm">{config.label}</span>
              <span className="ml-auto text-xs text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                API
              </span>
            </div>

            {/* Credential fields */}
            {config.credentialFields.map(field => (
              <div key={field.key}>
                <label className="field-label">{field.label}</label>
                <input
                  type={field.type === 'password' ? 'password' : 'text'}
                  value={sp.credentials[field.key] || ''}
                  onChange={e => updateCred(sp.platform, field.key, e.target.value)}
                  placeholder={field.placeholder || ''}
                  className="field-input"
                  autoComplete="off"
                />
                {field.hint && (
                  <p className="text-xs text-gray-400 mt-1">{field.hint}</p>
                )}
              </div>
            ))}

            {/* Subreddits field for Reddit */}
            {sp.platform === 'reddit' && (
              <div>
                <label className="field-label">Subreddits to monitor & post</label>
                <input
                  type="text"
                  value={sp.subreddits.join(', ')}
                  onChange={e => updateSubreddits(sp.platform, e.target.value)}
                  placeholder="r/saas, r/entrepreneur, r/startups"
                  className="field-input"
                />
                <p className="text-xs text-gray-400 mt-1">Comma-separated, with or without r/ prefix</p>
              </div>
            )}

            {/* Completion indicator */}
            <CredentialStatus credentials={sp.credentials} fields={config.credentialFields} />
          </div>
        )
      })}

      {/* Manual-only platforms */}
      {manualPlatforms.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
            Manual only — no API
          </p>
          <div className="space-y-3">
            {manualPlatforms.map(sp => {
              const config = PLATFORM_BY_ID[sp.platform]
              if (!config) return null
              return (
                <div key={sp.platform} className="rounded-xl border border-amber-100 bg-amber-50/60 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <PlatformIcon platform={sp.platform} size={16} />
                    <span className="font-semibold text-gray-800 text-sm">{config.label}</span>
                    <span className="ml-auto text-xs text-amber-600 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-full">
                      ✋ Manual
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{config.manualInstructions}</p>
                  {config.setupUrl && (
                    <a
                      href={config.setupUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block mt-2 text-xs text-indigo-600 underline hover:text-indigo-800"
                    >
                      → {config.setupUrl}
                    </a>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function CredentialStatus({
  credentials,
  fields,
}: {
  credentials: Record<string, string>
  fields: { key: string; label: string }[]
}) {
  if (fields.length === 0) return null
  const filled = fields.filter(f => credentials[f.key]?.trim()).length
  const total = fields.length
  if (filled === 0) return (
    <p className="text-xs text-gray-400">0 / {total} fields filled — will be saved as <em>needs_setup</em></p>
  )
  if (filled === total) return (
    <p className="text-xs text-emerald-600 font-medium">✓ All credentials filled — will be marked <em>ready</em></p>
  )
  return (
    <p className="text-xs text-amber-600">{filled} / {total} fields filled</p>
  )
}
