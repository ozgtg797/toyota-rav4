import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '1997 Toyota RAV4 Maintenance Guide',
  description: 'Step-by-step maintenance tutorials for the 1997 Toyota RAV4, sourced from factory service manuals.',
  keywords: ['Toyota RAV4', '1997', 'maintenance', 'repair', 'service manual'],
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  )
}
