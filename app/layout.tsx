import type { Metadata, Viewport } from 'next'
import './globals.css'
import { AppShell } from '@/components/layout/app-shell'
import { geistMono, geistSans } from '@/lib/fonts'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://commun.com'),
  title: {
    default: 'Commun.dev — Discover. Connect. Create. Collaborate. Earn.',
    template: '%s — Commun.dev',
  },
  description:
    'A global developer community to discover developers, share code, publish technical knowledge, showcase projects, and find your next opportunity.',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: 'Commun',
    title: 'Commun.dev — Where developers connect, build, and grow together',
    description:
      'Discover developers, share code, publish technical articles, showcase projects, and find your community.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Commun.dev — Where developers connect, build, and grow together',
    description:
      'A global developer community for technical publishing, collaboration, and opportunity.',
  },
}

export const viewport: Viewport = {
  themeColor: '#090B10',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  )
}
