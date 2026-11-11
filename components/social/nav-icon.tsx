import type { ReactNode } from 'react'

export type NavIconName =
  | 'feed'
  | 'explore'
  | 'articles'
  | 'discussions'
  | 'saved'
  | 'profile'
  | 'settings'
  | 'search'
  | 'bell'

const iconContent: Record<NavIconName, ReactNode> = {
  feed: (
    <>
      <rect x="3" y="3.5" width="14" height="13" rx="2.5" />
      <path d="M6 8h8M6 11.5h5" />
    </>
  ),
  explore: (
    <>
      <circle cx="10" cy="10" r="7" />
      <path d="m12.6 7.4-1.5 3.7-3.7 1.5 1.5-3.7z" />
    </>
  ),
  articles: (
    <>
      <path d="M5 3.5h7l3 3v10H5z" />
      <path d="M8 9h5M8 12h5" />
    </>
  ),
  discussions: (
    <path d="M3.5 5.5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H9l-4 3v-3h-.5a2 2 0 0 1-2-2z" />
  ),
  saved: <path d="M6 3.5h8v13l-4-2.8-4 2.8z" />,
  profile: (
    <>
      <circle cx="10" cy="7" r="3" />
      <path d="M4.5 16.5c.9-3 3-4.5 5.5-4.5s4.6 1.5 5.5 4.5" />
    </>
  ),
  settings: (
    <>
      <path d="M4 6h12M4 14h12" />
      <circle cx="8" cy="6" r="1.6" />
      <circle cx="13" cy="14" r="1.6" />
    </>
  ),
  search: (
    <>
      <circle cx="9" cy="9" r="5.5" />
      <path d="m13.2 13.2 3 3" />
    </>
  ),
  bell: (
    <>
      <path d="M6 8a4 4 0 0 1 8 0c0 3 1.2 4.3 1.5 4.8H4.5C4.8 12.3 6 11 6 8Z" />
      <path d="M8.5 15a1.7 1.7 0 0 0 3 0" />
    </>
  ),
}

export function NavIcon({
  name,
  className = 'size-4',
}: {
  name: NavIconName
  className?: string
}) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {iconContent[name]}
    </svg>
  )
}
