import type { Metadata, Viewport } from 'next'
import './globals.css'
import { AppShell } from '@/components/layout/app-shell'

export const metadata: Metadata = { metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://commun.dev'), title: { default: 'Commun — Build together', template: '%s — Commun' }, description: 'A focused home for developers to read, write, and build together.', alternates: { canonical: '/' }, openGraph: { type: 'website', siteName: 'Commun', title: 'Commun — Build together', description: 'A focused home for developers to read, write, and build together.' }, twitter: { card: 'summary' } }
export const viewport: Viewport = { themeColor: '#090a0f', width: 'device-width', initialScale: 1, userScalable: false }
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body><AppShell>{children}</AppShell></body></html> }
