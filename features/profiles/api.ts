import { apiRequest } from '@/features/api-client'

export type OwnProfile = Record<string, unknown>

export function getOwnProfile() {
  return apiRequest<{ profile: OwnProfile | null }>('/profiles')
}

export function updateOwnProfile(input: Record<string, unknown>) {
  return apiRequest<{ profile: OwnProfile | null; skipped: string[] }>('/profiles', {
    method: 'PATCH',
    body: input,
  })
}

export function finalizeProfile(input: {
  displayName: string
  username: string
  bio?: string
  headline?: string
  github?: string
  website?: string
  interests?: string[]
}) {
  return apiRequest<{ ok: true; profile: OwnProfile | null; skipped: string[]; elevated: boolean }>(
    '/profiles/finalize',
    { method: 'POST', body: input }
  )
}

export function checkUsernameAvailability(username: string) {
  return apiRequest<{ username: string; available: boolean }>(
    `/auth/availability?username=${encodeURIComponent(username)}`
  )
}
