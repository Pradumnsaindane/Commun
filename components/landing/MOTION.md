# Landing motion system

`LandingMotion` owns the public landing page's GSAP/ScrollTrigger lifecycle. It is mounted once by `app/page.tsx`; `gsap.context()` reverts every trigger and tween when the route unmounts.

## Add a section reveal

Wrap a landing section in an element with `data-scroll-section`. The first `h1`/`h2` (or an explicit `[data-scroll-heading]`) reveals when its top reaches 88% of the viewport. The section's first paragraph fades in just after the heading.

Add `data-scroll-item` to repeated content that should enter as a group. These items rise 16px on desktop (10px on compact screens), with an 110ms desktop or 70ms compact stagger. Add `data-scroll-spring` to a parent when the group calls for the restrained `back.out(1.08)` entrance; ordinary groups keep `power2.out`. Mark a product preview with `data-scroll-preview` for the clipped 24px desktop / 12px compact reveal. Keep this attribute on the visual panel; put any scroll-linked depth on a separate wrapper.

## Parallax and progress

`data-scroll-parallax` uses a single CSS custom property, `--story-y`, for a maximum 14px desktop drift (4px on compact screens). Its ScrollTrigger is tied to the wrapper's passage through the viewport with `scrub: 0.5`. The top progress line maps document scroll progress directly to `scaleX` and refreshes when the document height changes.

## Accessibility and performance

Reduced-motion users get static content: entrance tweens, cursor effects, magnetic movement, parallax, and the progress line are disabled. Compact screens skip the cursor and reduce reveal distances, stagger timing, blur, and parallax. No section pins or scroll hijacking are used; all content remains in normal document flow. Use CSS transitions for ordinary controls and reserve GSAP for scroll-linked storytelling.
