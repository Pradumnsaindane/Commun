# Page Dependency Trees

## / — `app/page.tsx`

Dependencies:
- `app/page.tsx`
  - `components/landing/navbar.tsx`
    - `lib/utils.ts`
    - `components/ui/theme-toggle.tsx`
      - `lib/utils.ts`
  - `components/landing/hero.tsx`
    - `components/ui/badge.tsx`
      - `lib/utils.ts`
    - `components/ui/button.tsx`
      - `lib/utils.ts`
    - `lib/utils.ts`
  - `components/landing/capabilities-bento.tsx`
    - `components/ui/badge.tsx`
  - `components/landing/product-illustrations.tsx`
    - `components/ui/badge.tsx`
    - `components/ui/card.tsx`
      - `lib/utils.ts`
    - `lib/utils.ts`
  - `components/landing/how-it-works.tsx`
    - `components/ui/badge.tsx`
    - `lib/utils.ts`
  - `components/landing/features-section.tsx`
    - `components/ui/badge.tsx`
  - `components/landing/solutions-section.tsx`
    - `components/ui/badge.tsx`
    - `lib/utils.ts`
  - `components/landing/testimonials-section.tsx`
    - `components/ui/badge.tsx`
    - `components/ui/card.tsx`
  - `components/landing/pricing-section.tsx`
    - `components/ui/badge.tsx`
    - `components/ui/card.tsx`
    - `components/ui/button.tsx`
    - `lib/utils.ts`
  - `components/landing/faq-section.tsx`
    - `components/ui/badge.tsx`
    - `components/ui/accordion.tsx`
      - `lib/utils.ts`
  - `components/landing/cta-section.tsx`
    - `components/ui/button.tsx`
    - `components/ui/badge.tsx`
  - `components/landing/contact-section.tsx`
    - `components/ui/badge.tsx`
    - `components/ui/card.tsx`
    - `components/ui/input.tsx`
      - `lib/utils.ts`
    - `components/ui/textarea.tsx`
      - `lib/utils.ts`
    - `components/ui/button.tsx`
  - `components/landing/footer.tsx`

## /dashboard — `app/dashboard/page.tsx`

Dependencies:
- `app/dashboard/page.tsx`
  - `lib/supabase/server.ts`
  - `components/dashboard/productivity-dashboard.tsx`
    - `components/ui/card.tsx`
      - `lib/utils.ts`
    - `components/ui/badge.tsx`
      - `lib/utils.ts`
    - `components/ui/button.tsx`
      - `lib/utils.ts`
    - `components/ui/tabs.tsx`
      - `lib/utils.ts`
    - `components/workspace/quick-actions-modal.tsx`
      - `components/ui/modal.tsx`
        - `lib/utils.ts`
      - `components/ui/button.tsx`

## /projects — `app/projects/page.tsx`

Dependencies:
- `app/projects/page.tsx`
  - `lib/supabase/server.ts`
  - `components/ui/badge.tsx`
    - `lib/utils.ts`
  - `components/ui/button.tsx`
    - `lib/utils.ts`
  - `components/ui/card.tsx`
    - `lib/utils.ts`

## /tasks — `app/tasks/page.tsx`

Dependencies:
- `app/tasks/page.tsx`
  - `lib/supabase/server.ts`
  - `components/ui/badge.tsx`
    - `lib/utils.ts`
  - `components/ui/card.tsx`
    - `lib/utils.ts`
  - `components/ui/button.tsx`
    - `lib/utils.ts`

## /calendar — `app/calendar/page.tsx`

Dependencies:
- `app/calendar/page.tsx`
  - `components/workspace/calendar-workspace.tsx`
    - `components/ui/card.tsx`
      - `lib/utils.ts`
    - `lib/utils.ts`
  - `lib/supabase/server.ts`

## /meetings — `app/meetings/page.tsx`

Dependencies:
- `app/meetings/page.tsx`
  - `lib/supabase/server.ts`
  - `components/ui/badge.tsx`
    - `lib/utils.ts`
  - `components/ui/button.tsx`
    - `lib/utils.ts`
  - `components/ui/card.tsx`
    - `lib/utils.ts`

## /notes — `app/notes/page.tsx`

Dependencies:
- `app/notes/page.tsx`
  - `lib/supabase/server.ts`
  - `components/ui/badge.tsx`
    - `lib/utils.ts`
  - `components/ui/button.tsx`
    - `lib/utils.ts`
  - `components/ui/card.tsx`
    - `lib/utils.ts`

## /login — `app/login/page.tsx`

Dependencies:
- `app/login/page.tsx`
  - `components/auth/auth-forms.tsx`
    - `lib/supabase/client.ts`
    - `lib/auth/validation.ts`

