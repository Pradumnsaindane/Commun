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

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-accent/25 selection:text-foreground">
      {/* Section 1: Dark shadow floating responsive navbar */}
      <Navbar />

      <main className="flex-1">
        {/* Section 2: Inference-inspired Hero with glowing lights and interactive UI preview */}
        <Hero />

        {/* Section 3: Balanced Bento grid showcasing 7 core capabilities */}
        <CapabilitiesBento />

        {/* Section 4: Product illustrations (MacBook, iPhone, Cursors, Workflow paths, Status) */}
        <ProductIllustrations />

        {/* Section 5: How Commun works (5-step interactive journey) */}
        <HowItWorks />

        {/* Section 6: Features with horizontal skeleton illustrations */}
        <FeaturesSection />

        {/* Section 7: Solutions by audience (Corporate teams, Managers, L&D, Individuals, Students) */}
        <SolutionsSection />

        {/* Section 8: Testimonials layout with honest placeholders */}
        <TestimonialsSection />

        {/* Section 9: Pricing with monthly/yearly toggle and coming-soon status */}
        <PricingSection />

        {/* Section 10: Interactive FAQ accordion */}
        <FaqSection />

        {/* Section 11: High-impact CTA with masonry layout inspiration */}
        <CtaSection />

        {/* Section 12: Contact form with client validation and honest status */}
        <ContactSection />
      </main>

      {/* Section 13: Four-column structured SaaS footer */}
      <Footer />
    </div>
  )
}
