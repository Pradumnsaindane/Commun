/**
 * Navigation for the developer social product.
 *
 * Only routes that exist and work are `live`. Anything else is explicitly
 * marked `soon` and rendered as non-interactive text so the interface never
 * promises a route that does not exist.
 */

export type SocialNavStatus = 'live' | 'soon'

export type SocialNavItem = {
  label: string
  status: SocialNavStatus
  href?: string
  description?: string
}

const feed: SocialNavItem = { label: 'Feed', status: 'live', href: '/feed' }
const explore: SocialNavItem = { label: 'Explore', status: 'live', href: '/explore' }
const articles: SocialNavItem = {
  label: 'Articles',
  status: 'live',
  href: '/search?type=articles',
}
const discussions: SocialNavItem = {
  label: 'Discussions',
  status: 'live',
  href: '/discussions',
}
const communities: SocialNavItem = {
  label: 'Communities',
  status: 'soon',
  description: 'Community spaces are in development.',
}
const projects: SocialNavItem = {
  label: 'Projects',
  status: 'soon',
  description: 'Project showcases are in development.',
}
const jobs: SocialNavItem = {
  label: 'Jobs',
  status: 'soon',
  description: 'The job board is in development.',
}

/** Public marketing navigation: product areas at a glance. */
export const marketingNav: SocialNavItem[] = [
  feed,
  explore,
  articles,
  communities,
  projects,
  jobs,
]

/** Authenticated shell navigation: discovery surfaces that work today. */
export const appPrimaryNav: SocialNavItem[] = [feed, explore, articles, discussions]

/** Authenticated shell navigation: personal surfaces. */
export const appLibraryNav: SocialNavItem[] = [
  { label: 'Saved', status: 'live', href: '/saved' },
  { label: 'Your profile', status: 'live', href: '/profile/me' },
]

/** Product areas that are announced but not yet available. */
export const appInDevelopmentNav: SocialNavItem[] = [communities, projects, jobs]
