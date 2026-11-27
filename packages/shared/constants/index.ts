/** Canonical API prefix. Legacy unversioned routes remain compatibility adapters. */
export const API_BASE = '/api/v1'

export const NOTIFICATION_TYPES = [
  'LIKE',
  'COMMENT',
  'REPLY',
  'FOLLOW',
  'NEW_POST',
  'MENTION',
  'REPOST',
  'MODERATION',
] as const

export const SEARCH_TYPES = ['all', 'developers', 'articles', 'discussions', 'topics'] as const
