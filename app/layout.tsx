import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Link from 'next/link'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Autopilot Dashboard',
  description: 'Content automation command center',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-gray-950 text-gray-100 min-h-screen`}>
        <nav className="border-b border-gray-800 bg-gray-900/50 backdrop-blur sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-14">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-7 h-7 bg-indigo-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">A</div>
                <span className="font-semibold text-white">Autopilot</span>
              </Link>
              <div className="flex items-center gap-6 text-sm text-gray-400">
                <Link href="/" className="hover:text-white transition-colors">Dashboard</Link>
                <Link href="/content" className="hover:text-white transition-colors">Content Plan</Link>
                <Link href="/workflows" className="hover:text-white transition-colors">Workflows</Link>
                <Link href="/errors" className="hover:text-white transition-colors">Errors</Link>
              </div>
            </div>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </body>
    </html>
  )
}
