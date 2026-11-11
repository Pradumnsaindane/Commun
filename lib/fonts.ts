import { Geist, Geist_Mono } from 'next/font/google'

/**
 * Typography system: Geist Sans for prose and interface text, Geist Mono for
 * technical labels and metadata. next/font self-hosts both fonts at build time,
 * so no request goes to Google from the browser and there is no layout shift.
 */
export const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

export const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
})
