export const ONBOARDING_INTERESTS = [
  'JavaScript',
  'TypeScript',
  'React',
  'Next.js',
  'Node.js',
  'Java',
  'Python',
  'AI/ML',
  'DevOps',
  'Cloud',
  'Cybersecurity',
  'Databases',
  'Mobile',
  'Open Source',
  'System Design',
] as const

export function isValidUsername(username: string): boolean {
  return /^[a-zA-Z0-9_]{3,30}$/.test(username.trim())
}
