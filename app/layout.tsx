import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Workflow - AI-Powered Issue Management',
  description: 'Transform your open source project with AI-powered detection and resolution of the "reserved issue" problem. Stop cookie-licking and boost contributor engagement.',
  keywords: ['open source', 'github', 'issue management', 'ai', 'automation'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} antialiased`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
