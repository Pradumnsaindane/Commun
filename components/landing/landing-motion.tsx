'use client'

import { useEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

/**
 * Landing-only motion orchestration. Add data-scroll-section to a section wrapper,
 * data-scroll-heading to its title, and data-scroll-item to elements to stagger.
 * Motion is intentionally limited on compact screens and disabled for reduced motion.
 */
export function LandingMotion() {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)

    const context = gsap.context(() => {
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const compactScreen = window.matchMedia('(max-width: 767px)').matches
      const sections = gsap.utils.toArray<HTMLElement>('[data-scroll-section]')

      if (!reducedMotion) {
        sections.forEach((section) => {
          const heading = section.querySelector<HTMLElement>('[data-scroll-heading], h1, h2')
          const paragraph = section.querySelector<HTMLElement>('[data-scroll-copy], p')
          const items = section.querySelectorAll<HTMLElement>('[data-scroll-item]')
          const preview = section.querySelector<HTMLElement>('[data-scroll-preview]')
          const parallax = section.querySelector<HTMLElement>('[data-scroll-parallax]')

          if (heading) {
            const intro = gsap.timeline({
              scrollTrigger: { trigger: heading, start: 'top 88%', once: true },
            })
            intro.fromTo(heading, { y: compactScreen ? 12 : 20, autoAlpha: 0 }, {
              y: 0, autoAlpha: 1, duration: compactScreen ? 0.48 : 0.68, ease: 'power2.out',
            })
            if (paragraph && paragraph !== heading) {
              intro.fromTo(paragraph, { y: 8, autoAlpha: 0 }, {
                y: 0, autoAlpha: 1, duration: compactScreen ? 0.38 : 0.5, ease: 'power2.out',
              }, '-=0.38')
            }
          }

          if (items.length) {
            const springEntrance = items[0].closest('[data-scroll-spring]') !== null
            gsap.fromTo(items, { y: compactScreen ? 10 : 16, autoAlpha: 0 }, {
              y: 0,
              autoAlpha: 1,
              duration: compactScreen ? 0.42 : 0.58,
              stagger: compactScreen ? 0.07 : 0.11,
              ease: springEntrance ? 'back.out(1.08)' : 'power2.out',
              scrollTrigger: { trigger: items[0], start: 'top 90%', once: true },
            })
          }

          if (preview) {
            gsap.fromTo(preview, { y: compactScreen ? 12 : 24, autoAlpha: 0, clipPath: 'inset(3% 2% 0 2% round 16px)' }, {
              y: 0,
              autoAlpha: 1,
              clipPath: 'inset(0% 0% 0 0% round 16px)',
              duration: compactScreen ? 0.55 : 0.82,
              ease: 'power2.out',
              scrollTrigger: { trigger: preview, start: 'top 90%', once: true },
            })
          }

          if (parallax) {
            gsap.to(parallax, {
              '--story-y': compactScreen ? '-4px' : '-14px',
              ease: 'none',
              scrollTrigger: { trigger: parallax, start: 'top bottom', end: 'bottom top', scrub: 0.5 },
            })
          }
        })

        const progressBar = document.querySelector('.landing-scroll-progress__bar')
        if (progressBar) {
          const updateProgress = (progress: number) => gsap.set(progressBar, { scaleX: progress })
          ScrollTrigger.create({
            start: 0,
            end: () => ScrollTrigger.maxScroll(window),
            invalidateOnRefresh: true,
            onUpdate: ({ progress }) => updateProgress(progress),
            onRefresh: (self) => updateProgress(self.progress),
          })
        }
      }
    })

    const cursor = document.querySelector<HTMLElement>('.landing-cursor')
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)')
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const touchLayout = window.matchMedia('(max-width: 767px)')
    const enableCursor = () => {
      if (!cursor) return
      cursor.hidden = !finePointer.matches || reduceMotion.matches || touchLayout.matches
    }
    enableCursor()
    finePointer.addEventListener('change', enableCursor)
    reduceMotion.addEventListener('change', enableCursor)
    touchLayout.addEventListener('change', enableCursor)

    const onMouseMove = (event: MouseEvent) => {
      if (!cursor || !finePointer.matches || reduceMotion.matches || touchLayout.matches) return
      cursor.hidden = false
      cursor.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0)`
      const magnetic = (event.target as HTMLElement).closest<HTMLElement>('[data-magnetic]')
      document.querySelectorAll<HTMLElement>('[data-magnetic]').forEach((element) => {
        if (element !== magnetic) element.style.setProperty('--magnet-x', '0px')
        if (element !== magnetic) element.style.setProperty('--magnet-y', '0px')
      })
      if (magnetic) {
        const bounds = magnetic.getBoundingClientRect()
        const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 6
        const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 6
        magnetic.style.setProperty('--magnet-x', `${x.toFixed(1)}px`)
        magnetic.style.setProperty('--magnet-y', `${y.toFixed(1)}px`)
      }
      cursor.classList.toggle('landing-cursor--interactive', Boolean((event.target as HTMLElement).closest('a,button,[data-magnetic]')))
    }
    const resetMagnet = (event: PointerEvent) => {
      const target = (event.target as HTMLElement).closest<HTMLElement>('[data-magnetic]')
      if (!target || (event.relatedTarget instanceof Node && target.contains(event.relatedTarget))) return
      target.style.setProperty('--magnet-x', '0px')
      target.style.setProperty('--magnet-y', '0px')
    }
    document.addEventListener('mousemove', onMouseMove, { passive: true })
    document.addEventListener('pointerout', resetMagnet)

    return () => {
      context.revert()
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('pointerout', resetMagnet)
      finePointer.removeEventListener('change', enableCursor)
      reduceMotion.removeEventListener('change', enableCursor)
      touchLayout.removeEventListener('change', enableCursor)
    }
  }, [])

  return (
    <>
      <div className="landing-scroll-progress" aria-hidden="true"><span className="landing-scroll-progress__bar" /></div>
      <div className="landing-cursor" hidden aria-hidden="true"><span /></div>
    </>
  )
}
