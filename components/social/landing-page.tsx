'use client'

import Link from 'next/link'
import { useState } from 'react'

const BLUE = 'bg-blue-600'
const BLUE_HOVER = 'hover:bg-blue-700'

function PrimaryButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`inline-block rounded-lg ${BLUE} px-4 py-2.5 text-base font-medium text-white transition duration-300 ease-in-out ${BLUE_HOVER}`}
    >
      {children}
    </Link>
  )
}

function SecondaryButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-base font-medium text-gray-800 transition duration-300 ease-in-out hover:bg-gray-100"
    >
      {children}
    </Link>
  )
}

export function SocialLandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const faqs = [
    'What is Commun.dev used for?',
    'Can I customize my profile and content?',
    'Do I need technical skills to participate?',
    'Is Commun suitable for any developer community?',
    'Does Commun support integrations?',
  ]

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Header */}
      <header className="absolute top-8 left-0 z-50 w-full">
        <nav>
          <div className="mx-auto max-w-7xl px-6">
            <div className="flex items-center justify-between rounded-[18px] bg-white/80 py-3 pl-6 pr-3 backdrop-blur-md">
              <Link href="/" aria-label="Commun.dev home">
                <span className="text-xl font-semibold tracking-tight text-gray-900">Commun.dev</span>
              </Link>
              <div className="hidden lg:block">
                <ul className="flex">
                  {['Home', 'Features', 'Pricing', 'About', 'Contact'].map((item) => (
                    <li key={item}>
                      <Link
                        href={item === 'Home' ? '/' : `/${item.toLowerCase()}`}
                        className={`inline-block px-3 py-3 transition-colors duration-300 ease-in-out ${
                          item === 'Home' ? 'text-blue-600' : 'text-gray-800 hover:text-blue-600'
                        }`}
                      >
                        {item}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="hidden gap-4 lg:flex">
                <Link
                  href="/login"
                  className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-base font-medium text-gray-800 transition duration-300 ease-in-out hover:bg-gray-100"
                >
                  Login
                </Link>
                <PrimaryButton href="/register">Start Free Trial</PrimaryButton>
              </div>
              <div className="flex lg:hidden">
                <button type="button" aria-label="Toggle menu" className="cursor-pointer">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M3.25 6C3.25 5.58579 3.58579 5.25 4 5.25H20C20.4142 5.25 20.75 5.58579 20.75 6C20.75 6.41421 20.4142 6.75 20 6.75L4 6.75C3.58579 6.75 3.25 6.41422 3.25 6ZM3.25 18C3.25 17.5858 3.58579 17.25 4 17.25L20 17.25C20.4142 17.25 20.75 17.5858 20.75 18C20.75 18.4142 20.4142 18.75 20 18.75L4 18.75C3.58579 18.75 3.25 18.4142 3.25 18ZM4 11.25C3.58579 11.25 3.25 11.5858 3.25 12C3.25 12.4142 3.58579 12.75 4 12.75L20 12.75C20.4142 12.75 20.75 12.4142 20.75 12C20.75 11.5858 20.4142 11.25 20 11.25L4 11.25Z"
                      fill="#374151"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section
        className="relative bg-cover bg-center bg-no-repeat pt-30 lg:pt-50"
        style={{ background: 'url("/images/covers/hero.jpg") center center / cover no-repeat' }}
      >
        <div className="absolute bottom-0 left-0 z-20 h-25 w-full bg-[linear-gradient(0deg,#fff_50%,rgba(255,255,255,0)_100%)]" />
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-xl text-center lg:max-w-4xl lg:px-4">
            <div className="mb-5 inline-flex h-8 items-center gap-2 rounded-full bg-[linear-gradient(180deg,rgba(255,255,255,0.7)_0%,rgba(255,255,255,0.7)_100%)] p-1 pr-2 backdrop-blur-[3.15px]">
              <div className="flex -space-x-3">
                <img className="size-7 rounded-full ring ring-white" alt="" src="/images/users/user-4.png" />
                <img className="size-7 rounded-full ring ring-white" alt="" src="/images/users/user-5.png" />
                <img className="size-7 rounded-full ring ring-white" alt="" src="/images/users/user-6.png" />
              </div>
              <p className="text-sm text-gray-700">Rated 4.97/5 from verified reviews</p>
            </div>
            <h1 className="mb-5 text-center text-4xl font-semibold lg:text-6xl">Empower Developers With Smarter Collaboration</h1>
            <p className="mb-10 text-base text-gray-500 lg:px-10">
              A modern developer platform that helps teams publish knowledge, manage communities, and make better decisions — all in one intuitive workspace.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 pb-10 sm:flex-row lg:pb-20">
              <PrimaryButton href="/register">Get Started Now</PrimaryButton>
              <SecondaryButton href="/explore">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M6.375 5.93126L6.375 18.0687C6.375 19.2416 7.66045 19.9607 8.6599 19.347L18.5433 13.2783C19.4967 12.6928 19.4967 11.3072 18.5433 10.7217L8.65989 4.65301C7.66045 4.03931 6.375 4.75844 6.375 5.93126Z" stroke="#1F2937" strokeWidth="1.5" strokeLinejoin="round" />
                </svg>
                View Live Demo
              </SecondaryButton>
            </div>
          </div>
          <div className="mx-auto max-w-275 rounded-t-[26px] border border-white bg-[linear-gradient(180deg,rgba(255,255,255,0.25)_0%,rgba(255,255,255,0)_100%)] p-3">
            <img className="w-full rounded-t-[14px]" alt="Commun dashboard" src="/images/covers/hero-image.png" onError={(e) => ((e.target as HTMLImageElement).src = '/images/covers/hero.jpg')} />
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="py-10 lg:py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="mb-10 text-base text-gray-700">Trusted by creators, teams and developers worldwide</p>
            <div className="mask-[linear-gradient(to_right,transparent_0,black_128px,black_calc(100%-200px),transparent_100%)] inline-flex w-full flex-nowrap overflow-hidden">
              <ul className="flex animate-infinite-scroll items-center justify-center md:justify-start [&_img]:max-w-none [&_li]:mx-5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <li key={i}>
                    <img alt={`Client logo ${i}`} src={`/images/clients/logo-${i}.svg`} />
                  </li>
                ))}
              </ul>
              <ul className="flex animate-infinite-scroll items-center justify-center md:justify-start [&_img]:max-w-none [&_li]:mx-5" aria-hidden="true">
                {[1, 2, 3, 4, 5].map((i) => (
                  <li key={i}>
                    <img alt={`Client logo ${i}`} src={`/images/clients/logo-${i}.svg`} />
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-gray-50 py-28">
        <div className="mx-auto max-w-7xl px-4 lg:px-6">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-medium text-gray-900 -tracking-[1.9px] lg:text-5xl">Everything You Need to Build a Developer Community</h2>
            <p className="text-base text-gray-500">A modern platform that helps developers publish knowledge, manage communities, and make better decisions — all in one intuitive workspace.</p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { title: 'Developer Profiles', desc: 'Showcase skills, projects, and experience with a living professional identity.', img: '/images/features/image-1.jpg' },
              { title: 'Technical Publishing', desc: 'Write and share articles, notes, and insights with a clean reading experience.', img: '/images/features/image-2.jpg' },
              { title: 'Community Discussions', desc: 'Start conversations, ask questions, and learn together in topic channels.', img: '/images/features/image-3.jpg' },
            ].map((f) => (
              <div key={f.title} className="rounded-2xl bg-white p-3 shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
                <img className="w-full rounded-xl" alt={f.title} src={f.img} />
                <div className="p-5">
                  <h3 className="mb-2 text-xl font-medium text-gray-900">{f.title}</h3>
                  <p className="text-sm text-gray-500">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use cases */}
      <section className="py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 lg:px-6">
          <div className="flex flex-col gap-12 lg:flex-row">
            <div className="lg:w-5/12">
              <h2 className="mb-4 text-4xl font-medium -tracking-[1.9px] text-gray-900 lg:text-5xl">Built for Multiple Use Cases</h2>
              <p className="text-base text-gray-500">Everything you need to manage data, users, and operations — designed with flexibility, clarity, and scalability in mind.</p>
              <ul className="mt-11 space-y-5">
                {[
                  { title: 'Developer Network', desc: 'Discover and connect with developers across skills and interests.' },
                  { title: 'Knowledge Base', desc: 'Publish articles, notes, and learning resources.' },
                  { title: 'Opportunity Hub', desc: 'Find jobs, projects, and collaboration opportunities.' },
                ].map((u, i) => (
                  <li key={u.title} className={`cursor-pointer border-l-4 py-2.5 px-5 transition ${i === 0 ? 'border-blue-500' : 'border-gray-100'}`}>
                    <h3 className="mb-2 text-base font-medium text-gray-900">{u.title}</h3>
                    <p className="text-base text-gray-500">{u.desc}</p>
                  </li>
                ))}
              </ul>
            </div>
            <div className="lg:w-6/12">
              <div className="rounded-2xl bg-white p-3 shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
                <img className="w-full rounded-xl" alt="Developer Network" src="/images/features/feature-lg-1.png" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section
        className="relative py-10 pb-20 pt-28 lg:pb-10 lg:pt-28"
        style={{ background: 'url("/images/covers/integration-bg.jpg") center center / cover no-repeat' }}
      >
        <div className="absolute bottom-0 left-0 z-20 h-25 w-full bg-[linear-gradient(180deg,rgba(255,255,255,0)_0%,#fff_100%)]" />
        <div className="relative z-30 mx-auto max-w-7xl px-6">
          <div className="mx-auto mb-8 max-w-2xl text-center lg:mb-16">
            <h2 className="mb-3 text-2xl font-medium -tracking-[1.9px] text-gray-900 lg:mb-4 lg:text-5xl">Connect With the Tools You Already Use</h2>
            <p className="text-sm text-gray-500 lg:text-base">Seamlessly integrate with popular platforms to streamline workflows, sync data, and work faster — without switching tools.</p>
          </div>
          <div className="mx-auto max-w-full space-y-4 overflow-hidden text-center lg:max-w-258 lg:space-y-6">
            <div className="flex flex-wrap justify-center gap-3 lg:gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="inline-flex size-14 items-center justify-center rounded-lg border border-white bg-white/50 backdrop-blur-md lg:size-18">
                  <span className="text-xs text-gray-500">App</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-10 lg:py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <h2 className="mb-4 text-4xl font-medium -tracking-[1.9px] text-gray-900 lg:text-5xl">Trusted by Expert Product Teams Worldwide</h2>
            <p className="text-base text-gray-500">Teams use this platform to launch faster, manage data smarter, and deliver better user experiences.</p>
          </div>
          <div className="grid grid-cols-12 gap-5 rounded-2xl bg-gray-50 p-5">
            <div className="col-span-12 lg:col-span-6">
              <div className="flex h-full flex-col rounded-xl bg-white p-6 sm:flex-row sm:gap-6">
                <div className="flex-1">
                  <img className="h-72 w-full rounded-lg object-cover" alt="Portrait of Pradumn Saindane" src="/images/users/pradumn-saindane.png" />
                </div>
                <div className="mt-4 flex w-full flex-col justify-between sm:mt-0 sm:w-5/12">
                  <div>
                    <div className="mb-3 flex gap-1 text-yellow-400">★★★★★</div>
                    <p className="text-base text-gray-700">The community layout is incredibly clean and easy to customize. We launched our developer portal weeks faster than expected.</p>
                  </div>
                  <div className="mt-6">
                    <h4 className="text-base font-medium text-gray-900">Pradumn Saindane</h4>
                    <span className="text-sm text-gray-500">Founder,Commun.dev</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-span-12 lg:col-span-6">
              <div className="flex h-full flex-col justify-between rounded-xl bg-white p-6">
                <div>
                  <div className="mb-3 flex gap-1 text-yellow-400">★★★★★</div>
                  <p className="text-gray-700">Everything feels thoughtfully designed. The reusable components saved us from rebuilding common UI patterns.</p>
                </div>
                <div className="mt-6">
                  <h4 className="text-base font-medium text-gray-900">Pradumn Saindane</h4>
                  <span className="text-sm text-gray-500">Founder,Commun.dev</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-gray-50 py-28">
        <div className="mx-auto max-w-7xl px-4 lg:px-6">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <h2 className="mb-4 text-5xl font-medium -tracking-[1.9px] text-gray-900">Simple and Flexible Pricing</h2>
            <p className="mb-9 text-base text-gray-500">Start small, grow confidently, and scale without friction — choose the plan that fits your team today.</p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[
              { name: 'Free', price: '$0', desc: 'For trying the product', features: ['Basic dashboard access', 'Limited analytics', 'Community support'] },
              { name: 'Starter', price: '$19', desc: 'For small teams', features: ['Full dashboard access', 'Core analytics', 'User management'] },
              { name: 'Pro', price: '$49', desc: 'For growing teams', features: ['Advanced insights', 'Unlimited users', 'Priority support'] },
              { name: 'Enterprise', price: 'Custom', desc: 'For custom needs', features: ['Everything in Pro', 'Custom workflows', 'Dedicated support'] },
            ].map((p) => (
              <div key={p.name} className="rounded-2xl bg-white p-5">
                <span className="mb-3 inline-flex h-6 items-center rounded-full bg-gray-100 px-2 py-1 text-sm font-medium text-gray-800">{p.name}</span>
                <p className="mb-8 font-mono text-sm text-gray-900">{p.desc}</p>
                <h3 className="mb-7 text-5xl font-medium">
                  {p.price}
                  {p.price !== 'Custom' && <span className="text-base text-gray-500">/month</span>}
                </h3>
                <ul className="space-y-4 border-t border-dashed border-gray-200 py-7">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-gray-700">
                      <span className="inline-flex size-3.5 shrink-0 items-center justify-center rounded-full bg-blue-600">
                        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <path d="M8.37605 2.7251L3.82605 7.2751L1.62396 5.07304" stroke="white" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className="inline-block w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-center text-base font-medium text-gray-800 transition-colors duration-300 ease-in-out hover:bg-gray-100"
                >
                  {p.name === 'Enterprise' ? 'Contact Sales' : 'Choose Plan'}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-10 lg:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col gap-10 lg:flex-row lg:justify-between">
            <div className="lg:w-5/12">
              <h2 className="mb-10 text-4xl font-medium -tracking-[1.9px] text-gray-900 lg:mb-20 lg:text-5xl">Frequently Asked Questions</h2>
              <div className="max-w-xs rounded-2xl bg-gray-50 p-5">
                <div className="mb-2 flex -space-x-3 items-center">
                  {[1, 2, 3].map((i) => (
                    <img key={i} className="size-9 rounded-full ring-2 ring-white" alt={`User ${i}`} src={`/images/users/user-${i}.png`} />
                  ))}
                </div>
                <p className="mb-6 text-gray-700">Have more questions? Reach out to our friendly support team</p>
                <PrimaryButton href="/contact">Contact Us</PrimaryButton>
              </div>
            </div>
            <div className="lg:w-6/12">
              {faqs.map((q, i) => (
                <div key={q} className="border-b border-gray-200 py-6">
                  <div className="flex cursor-pointer items-center justify-between" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                    <h3 className="text-lg font-medium -tracking-[0.18px] text-gray-900">{q}</h3>
                    <button className="ml-4 shrink-0 cursor-pointer text-gray-950">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path fillRule="evenodd" clipRule="evenodd" d="M6.75024 13.501C6.33613 13.501 6.0004 13.1651 6.00024 12.751V7.50024H0.75C0.335786 7.50024 0 7.16445 0 6.75024C0 6.33603 0.335786 6.00024 0.75 6.00024H6.00024V0.75C6.00024 0.335786 6.33603 0 6.75024 0C7.16445 0 7.50024 0.335786 7.50024 0.75V6.00024H12.751C13.1651 6.0004 13.501 6.33613 13.501 6.75024C13.501 7.16435 13.1651 7.50008 12.751 7.50024H7.50024V12.751C7.50008 13.1651 7.16435 13.501 6.75024 13.501Z" fill="#374151" />
                      </svg>
                    </button>
                  </div>
                  {openFaq === i && <p className="mt-3 text-sm text-gray-500">Commun.dev helps developers connect, publish, and collaborate. Reach out if you need more details.</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        className="relative py-10 pb-10 pt-28 bg-cover bg-center bg-no-repeat"
        style={{ background: 'url("/images/covers/cta-bg.jpg") center center / cover no-repeat' }}
      >
        <div className="absolute bottom-0 left-0 z-20 h-25 w-full bg-[linear-gradient(180deg,rgba(255,255,255,0)_0%,#fff_100%)]" />
        <div className="relative z-30 mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="mb-4 text-4xl font-medium -tracking-[1.9px] text-gray-900 lg:text-5xl">Start Building Your Developer Community Faster</h2>
            <p className="mb-9 text-base text-gray-500">Use a modern, flexible platform that grows with your product.</p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <PrimaryButton href="/register">Get Started Now</PrimaryButton>
              <SecondaryButton href="/explore">View Live Demo</SecondaryButton>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer>
        <div className="mx-auto max-w-7xl px-6">
          <div className="pt-10 lg:pt-18">
            <div className="flex flex-col gap-10 lg:flex-row">
              <div className="lg:w-4/12">
                <Link href="/" className="mb-10 inline-block lg:mb-20">
                  <span className="text-xl font-semibold text-gray-900">Commun.dev</span>
                </Link>
                <p className="text-base text-gray-500 lg:pr-10">A developer community platform to discover, connect, publish, and grow together.</p>
              </div>
              <div className="lg:w-6/12 lg:ml-auto">
                <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 sm:gap-10">
                  <div>
                    <h3 className="mb-6 text-lg font-medium text-gray-800">Product</h3>
                    <nav className="space-y-5">
                      {['Home', 'Features', 'Pricing', 'Use Case'].map((l) => (
                        <Link key={l} href="#" className="block text-base text-gray-700 transition-colors duration-300 ease-in-out hover:text-blue-600">
                          {l}
                        </Link>
                      ))}
                    </nav>
                  </div>
                  <div>
                    <h3 className="mb-6 text-lg font-medium text-gray-800">Company</h3>
                    <nav className="space-y-5">
                      {['About', 'Contact', 'Privacy Policy', 'Terms & Conditions'].map((l) => (
                        <Link key={l} href="#" className="block text-base text-gray-700 transition-colors duration-300 ease-in-out hover:text-blue-600">
                          {l}
                        </Link>
                      ))}
                    </nav>
                  </div>
                  <div className="flex lg:justify-end">
                    <div>
                      <h3 className="mb-6 text-lg font-medium text-gray-800">Social</h3>
                      <nav className="space-y-5">
                        {['Discord', 'X (Twitter)', 'Telegram', 'Instagram'].map((l) => (
                          <Link key={l} href="#" className="flex items-center gap-2 text-base text-gray-700 transition-colors duration-300 ease-in-out hover:text-blue-600">
                            {l}
                          </Link>
                        ))}
                      </nav>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-5 justify-between border-t border-gray-200 py-6 sm:flex-row">
              <p className="text-sm text-gray-500">© 2026 Commun.dev. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
