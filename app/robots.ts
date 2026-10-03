import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://commun.dev'
  return { rules: { userAgent: '*', allow: ['/', '/discover', '/profile/', '/post/', '/discussions/'], disallow: ['/dashboard', '/feed', '/write', '/saved', '/notifications', '/settings', '/moderation', '/admin', '/api/'] }, sitemap: `${baseUrl}/sitemap.xml` }
}
