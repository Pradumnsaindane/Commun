import { describe, expect, it } from 'vitest'
import { cn } from './utils'

describe('cn', () => { it('combines truthy classes without spacing bugs', () => { expect(cn('a', false, undefined, 'b')).toBe('a b') }) })
