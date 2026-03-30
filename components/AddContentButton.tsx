'use client'
import { useState, useEffect } from 'react'
import { AddContentForm } from './AddContentForm'

export function AddContentButton() {
  const [open, setOpen] = useState(false)

  // Prevent body scroll when modal open
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="btn-glass flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-indigo-600 hover:text-indigo-700"
      >
        <span className="text-lg leading-none">+</span>
        Add content
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/25 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Scrollable container */}
          <div className="relative z-10 w-full max-w-2xl flex flex-col" style={{maxHeight: 'min(calc(100vh - 2rem), 680px)'}}>
            {/* Panel */}
            <div className="glass rounded-2xl shadow-2xl shadow-indigo-100/50 flex flex-col overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-5 pb-4 border-b border-white/30 flex-shrink-0">
                <div>
                  <h2 className="font-display font-semibold text-gray-900 text-lg">Add to Content Plan</h2>
                  <p className="text-gray-400 text-sm mt-0.5">n8n picks this up automatically on the scheduled date</p>
                </div>
                <button onClick={() => setOpen(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors text-2xl leading-none w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100/50">
                  ×
                </button>
              </div>
              {/* Scrollable body */}
              <div className="overflow-y-auto p-5 flex-1 min-h-0">
                <AddContentForm onClose={() => setOpen(false)} />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
