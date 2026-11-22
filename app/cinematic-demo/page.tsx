import type { Metadata } from 'next'
import { CinematicHero } from '@/components/ui/cinematic-landing-hero'

export const metadata: Metadata = {
  title: 'Commun Cinematic Hero',
  description: 'An animated, scroll-driven introduction to the Commun developer community.',
}

export default function CinematicHeroDemo() {
  return (
    <div className="min-h-screen w-full overflow-x-hidden">
      <CinematicHero
        brandName="Commun"
        tagline1="Build together,"
        tagline2="grow together."
        cardHeading="Your community, in motion."
        cardDescription={<>Commun brings developers together to share knowledge, collaborate on projects, and build lasting connections.</>}
        metricValue={128}
        metricLabel="Connections"
        ctaHeading="Find your people."
        ctaDescription="Join Commun to discover developers, share what you know, and grow alongside your community."
      />
    </div>
  )
}
