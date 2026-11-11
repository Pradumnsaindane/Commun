/**
 * Preserved original public landing page.
 *
 * The public homepage (/ ) currently renders the temporary maintenance
 * experience (components/site/maintenance-page.tsx). This component keeps the
 * previous composition intact so the original marketing page can be restored
 * by rendering <LandingPage /> from app/page.tsx again.
 *
 * All landing sections, motion and interactions below are unchanged.
 */
import { Navbar } from '@/components/landing/navbar'
import { Hero } from '@/components/landing/hero'
import { CapabilitiesBento } from '@/components/landing/capabilities-bento'
import { ProductIllustrations } from '@/components/landing/product-illustrations'
import { HowItWorks } from '@/components/landing/how-it-works'
import { FeaturesSection } from '@/components/landing/features-section'
import { SolutionsSection } from '@/components/landing/solutions-section'
import { TestimonialsSection } from '@/components/landing/testimonials-section'
import { PricingSection } from '@/components/landing/pricing-section'
import { FaqSection } from '@/components/landing/faq-section'
import { CtaSection } from '@/components/landing/cta-section'
import { ContactSection } from '@/components/landing/contact-section'
import { Footer } from '@/components/landing/footer'
import { AmbientBackground } from '@/components/ui/ambient-background'
import { LandingMotion } from '@/components/landing/landing-motion'

export function LandingPage() {
  return (
    <div className="relative isolate min-h-screen bg-background text-foreground selection:bg-accent/25 selection:text-foreground">
      <AmbientBackground variant="landing" />
      <LandingMotion />
      <div className="relative z-10 flex min-h-screen flex-col">
        {/* Section 1: Floating responsive navigation */}
        <Navbar />

        <main className="flex-1">
          {/* Section 2: Product introduction and interactive workspace preview */}
          <div data-scroll-section><Hero /></div>

          {/* Section 3: Product capabilities */}
          <div data-scroll-section><CapabilitiesBento /></div>

          {/* Section 4: Product interface examples */}
          <div data-scroll-section><ProductIllustrations /></div>

          {/* Section 5: How the workflow connects */}
          <div data-scroll-section><HowItWorks /></div>

          {/* Section 6: Feature details */}
          <div data-scroll-section><FeaturesSection /></div>

          {/* Section 7: Solutions by audience */}
          <div data-scroll-section><SolutionsSection /></div>

          {/* Section 8: Early access and customer evidence */}
          <div data-scroll-section><TestimonialsSection /></div>

          {/* Section 9: Pricing availability */}
          <div data-scroll-section><PricingSection /></div>

          {/* Section 10: FAQs */}
          <div data-scroll-section><FaqSection /></div>

          {/* Section 11: Final call to action */}
          <div data-scroll-section><CtaSection /></div>

          {/* Section 12: Contact */}
          <div data-scroll-section><ContactSection /></div>
        </main>

        {/* Section 13: Four-column structured SaaS footer */}
        <Footer />
      </div>
    </div>
  )
}
