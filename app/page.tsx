import type { Metadata } from 'next'
import { SocialLandingPage } from '@/components/social/landing-page'

/**
 * Public homepage: the developer-social marketing experience.
 *
 * The previous temporary maintenance page remains intact in
 * components/site/maintenance-page.tsx for rollback. To restore it, render
 * <MaintenancePage /> here instead.
 */
export const metadata: Metadata = {
  title: { absolute: 'Commun.dev — Where developers connect, build, and grow together' },
  description:
    'Discover developers, share your code, publish technical knowledge, showcase your projects, and find your community in one place.',
  alternates: { canonical: '/' },
}

export default function HomePage() {
  return <SocialLandingPage />
}
