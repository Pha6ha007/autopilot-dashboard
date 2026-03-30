'use client'
import { useState, useCallback } from 'react'
import { PlatformIcon } from './PlatformIcon'

type Account = {
  id: string
  product_id: string
  platform: string
  category: string
  username?: string
  email_used?: string
  password_encrypted?: string
  display_name?: string
  bio?: string
  profile_url?: string
  website_field?: string
  has_2fa: boolean
  status: string
  priority: string
  notes?: string
  followers_goal?: number
}

type Props = {
  initialAccounts: Account[]
  products: { id: string; name: string }[]
}

const STATUS_STYLES: Record<string, { bg: string; label: string }> = {
  not_started: { bg: 'bg-gray-100 text-gray-500 border-gray-200', label: '⬜ Not started' },
  registered: { bg: 'bg-blue-50 text-blue-600 border-blue-200', label: '📝 Registered' },
  configured: { bg: 'bg-amber-50 text-amber-600 border-amber-200', label: '⚙️ Configured' },
  active: { bg: 'bg-emerald-50 text-emerald-600 border-emerald-200', label: '✅ Active' },
  suspended: { bg: 'bg-red-50 text-red-500 border-red-200', label: '🚫 Suspended' },
}

const PRIORITY_STYLES: Record<string, string> = {
  high: 'text-red-500',
  medium: 'text-amber-500',
  low: 'text-emerald-500',
}

const REGISTER_URLS: Record<string, string> = {
  twitter: 'https://twitter.com/i/flow/signup',
  linkedin: 'https://www.linkedin.com/company/setup/new/',
  instagram: 'https://www.instagram.com/accounts/emailsignup/',
  youtube: 'https://www.youtube.com/create_channel',
  tiktok: 'https://www.tiktok.com/signup',
  reddit: 'https://www.reddit.com/register/',
  telegram: 'https://t.me/botfather',
  devto: 'https://dev.to/enter',
  hashnode: 'https://hashnode.com/onboard',
  medium: 'https://medium.com/m/signin',
  producthunt: 'https://www.producthunt.com/join',
  indiehackers: 'https://www.indiehackers.com/sign-up',
  hackernews: 'https://news.ycombinator.com/login',
  facebook: 'https://www.facebook.com/pages/create',
  github: 'https://github.com/signup',
  googlebusiness: 'https://business.google.com/create',
}

export function PlatformSetupClient({ initialAccounts, products }: Props) {
  const [accounts, setAccounts] = useState(initialAccounts)
  const [filterProduct, setFilterProduct] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editFields, setEditFields] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  const filtered = accounts.filter(a => {
    if (filterProduct && a.product_id !== filterProduct) return false
    if (filterStatus && a.status !== filterStatus) return false
    return true
  })

  // Group by product
  const groups: Record<string, Account[]> = {}
  for (const a of filtered) {
    if (!groups[a.product_id]) groups[a.product_id] = []
    groups[a.product_id].push(a)
  }

  const updateAccount = useCallback(async (id: string, updates: Record<string, unknown>) => {
    setSaving(true)
    const resp = await fetch('/api/platform-accounts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates }),
    })
    if (resp.ok) {
      const { account } = await resp.json()
      setAccounts(prev => prev.map(a => a.id === id ? { ...a, ...account } : a))
    }
    setSaving(false)
  }, [])

  const cycleStatus = useCallback((a: Account) => {
    const order = ['not_started', 'registered', 'configured', 'active']
    const idx = order.indexOf(a.status)
    const next = order[(idx + 1) % order.length]
    updateAccount(a.id, { status: next })
  }, [updateAccount])

  const startEdit = (a: Account) => {
    setEditingId(a.id)
    setEditFields({
      username: a.username || '',
      email_used: a.email_used || '',
      password_encrypted: a.password_encrypted || '',
      profile_url: a.profile_url || '',
      notes: a.notes || '',
    })
  }

  const saveEdit = async () => {
    if (!editingId) return
    await updateAccount(editingId, editFields)
    setEditingId(null)
  }

  return (
    <div>
      {/* Filters */}
      <div className="flex items-center gap-3 mb-5">
        <select value={filterProduct} onChange={e => setFilterProduct(e.target.value)} className="field-input w-auto text-sm py-1.5">
          <option value="">All products</option>
          {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="field-input w-auto text-sm py-1.5">
          <option value="">All statuses</option>
          {Object.entries(STATUS_STYLES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <span className="text-xs text-gray-400 ml-auto">{filtered.length} accounts</span>
      </div>

      {/* Product groups */}
      <div className="space-y-4">
        {Object.entries(groups).map(([productId, accs]) => {
          const productName = products.find(p => p.id === productId)?.name || productId
          const done = accs.filter(a => a.status === 'active' || a.status === 'configured').length
          const pct = Math.round(done / accs.length * 100)

          return (
            <div key={productId} className="glass rounded-2xl overflow-hidden">
              {/* Product header */}
              <div className="px-5 py-3 border-b border-white/30 bg-white/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-gray-800">{productName}</span>
                  <span className="text-xs text-gray-400">{done}/{accs.length} platforms</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs text-gray-400">{pct}%</span>
                </div>
              </div>

              {/* Account rows */}
              <div className="divide-y divide-gray-100/60">
                {accs.map(a => {
                  const isEditing = editingId === a.id
                  const st = STATUS_STYLES[a.status] || STATUS_STYLES.not_started
                  const regUrl = REGISTER_URLS[a.platform]

                  return (
                    <div key={a.id} className="px-5 py-3">
                      {/* Main row */}
                      <div className="flex items-center gap-3">
                        <PlatformIcon platform={a.platform} size={20} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-700 capitalize">{a.platform}</span>
                            {a.username && <span className="text-xs text-gray-400 font-mono">{a.username}</span>}
                            {a.has_2fa && <span className="text-[10px] bg-emerald-50 text-emerald-600 px-1 rounded">2FA</span>}
                            <span className={`text-[10px] font-medium ${PRIORITY_STYLES[a.priority] || ''}`}>
                              {a.priority === 'high' ? '●' : a.priority === 'medium' ? '●' : '●'}
                            </span>
                          </div>
                          {a.email_used && <p className="text-[11px] text-gray-400">{a.email_used}</p>}
                        </div>

                        {/* Status button */}
                        <button
                          onClick={() => cycleStatus(a)}
                          disabled={saving}
                          className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-all ${st.bg}`}
                        >
                          {st.label}
                        </button>

                        {/* Register link */}
                        {a.status === 'not_started' && regUrl && (
                          <a
                            href={regUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-indigo-500 hover:text-indigo-700 font-medium whitespace-nowrap"
                          >
                            Register →
                          </a>
                        )}

                        {/* Edit button */}
                        <button
                          onClick={() => isEditing ? setEditingId(null) : startEdit(a)}
                          className="text-xs text-gray-400 hover:text-gray-600"
                        >
                          {isEditing ? '✕' : '✏️'}
                        </button>
                      </div>

                      {/* Notes */}
                      {a.notes && !isEditing && (
                        <p className="text-[11px] text-gray-400 mt-1 ml-8">{a.notes}</p>
                      )}

                      {/* Edit form */}
                      {isEditing && (
                        <div className="mt-3 ml-8 space-y-2 bg-gray-50/50 rounded-xl p-3 border border-gray-100">
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <label className="text-[10px] uppercase tracking-wider text-gray-400">Username</label>
                              <input
                                type="text" value={editFields.username || ''}
                                onChange={e => setEditFields(p => ({ ...p, username: e.target.value }))}
                                className="field-input text-xs py-1"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] uppercase tracking-wider text-gray-400">Email</label>
                              <input
                                type="email" value={editFields.email_used || ''}
                                onChange={e => setEditFields(p => ({ ...p, email_used: e.target.value }))}
                                className="field-input text-xs py-1"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] uppercase tracking-wider text-gray-400">Password</label>
                              <input
                                type="password" value={editFields.password_encrypted || ''}
                                onChange={e => setEditFields(p => ({ ...p, password_encrypted: e.target.value }))}
                                className="field-input text-xs py-1"
                                placeholder="••••••••"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] uppercase tracking-wider text-gray-400">Profile URL</label>
                              <input
                                type="url" value={editFields.profile_url || ''}
                                onChange={e => setEditFields(p => ({ ...p, profile_url: e.target.value }))}
                                className="field-input text-xs py-1"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] uppercase tracking-wider text-gray-400">Notes</label>
                              <input
                                type="text" value={editFields.notes || ''}
                                onChange={e => setEditFields(p => ({ ...p, notes: e.target.value }))}
                                className="field-input text-xs py-1"
                              />
                            </div>
                          </div>
                          <button
                            onClick={saveEdit}
                            disabled={saving}
                            className="text-xs font-medium text-white bg-indigo-500 hover:bg-indigo-600 px-3 py-1 rounded-lg disabled:opacity-50"
                          >
                            {saving ? 'Saving…' : 'Save'}
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
