import type { Metadata } from 'next'
import { DM_Sans, Instrument_Sans } from 'next/font/google'
import Link from 'next/link'
import './globals.css'

const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-body', weight: ['300','400','500','600'] })
const instrumentSans = Instrument_Sans({ subsets: ['latin'], variable: '--font-display', weight: ['400','500','600','700'] })

export const metadata: Metadata = {
  title: 'Autopilot — Command Center',
  description: 'Content automation dashboard',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${dmSans.variable} ${instrumentSans.variable}`}>
      <body>
        <div className="min-h-screen bg-surface">
          {/* Ambient background blobs */}
          <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
            <div className="blob blob-1" />
            <div className="blob blob-2" />
            <div className="blob blob-3" />
          </div>

          {/* Navbar */}
          <header className="nav-glass sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2.5 group">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-md shadow-indigo-200 group-hover:shadow-indigo-300 transition-shadow">
                  <span className="text-white text-sm font-bold">A</span>
                </div>
                <span className="font-display font-semibold text-gray-800 text-[15px]">Autopilot</span>
              </Link>

              <nav className="flex items-center gap-1">
                {[
                  { href: '/', label: 'Dashboard' },
                  { href: '/content', label: 'Content Plan' },
                  { href: '/workflows', label: 'Workflows' },
                  { href: '/errors', label: 'Errors' },
                  { href: '/confide', label: '🎬 Episodes' },
                ].map(({ href, label }) => (
                  <Link key={href} href={href}
                    className="px-3 py-1.5 rounded-lg text-sm text-gray-500 hover:text-gray-900 hover:bg-white/70 transition-all font-medium">
                    {label}
                  </Link>
                ))}
                <Link href="/products/new"
                  className="ml-2 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium transition-colors shadow-md shadow-indigo-100">
                  <span className="text-base leading-none">+</span>
                  Product
                </Link>
              </nav>
            </div>
          </header>

          {/* Main */}
          <main className="max-w-7xl mx-auto px-6 py-8 relative z-10">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
