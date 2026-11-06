import type { Metadata, Viewport } from 'next'
import './globals.css'
import { AppShell } from '@/components/layout/app-shell'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://commun.com'),
  title: {
    default: 'Commun — One workspace. Better work. More time.',
    template: '%s — Commun',
  },
  description:
    'Commun helps professionals and teams organize their work, collaborate effectively, manage knowledge, and make more time for meaningful progress.',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: 'Commun',
    title: 'Commun — One workspace. Better work. More time.',
    description:
      'Unified productivity and work-management SaaS platform for projects, meeting notes, knowledge management, and team learning.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Commun — One workspace. Better work. More time.',
    description:
      'Organize work, coordinate activities, manage knowledge, and elevate team productivity.',
  },
}

export const viewport: Viewport = {
  themeColor: '#090a0f',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  )
}
