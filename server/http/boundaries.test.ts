import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { failure, success, toResponse } from './result'

const apiRoot = join(process.cwd(), 'app', 'api')

function routeFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry)
    if (statSync(path).isDirectory()) return routeFiles(path)
    return entry === 'route.ts' ? [path] : []
  })
}

describe('API response contract', () => {
  it('preserves failure headers such as Retry-After', async () => {
    const response = toResponse(failure('Slow down.', 429, { headers: { 'Retry-After': '7' } }))
    expect(response.status).toBe(429)
    expect(response.headers.get('retry-after')).toBe('7')
    await expect(response.json()).resolves.toEqual({ error: 'Slow down.' })
  })

  it('keeps 204 responses body-free', async () => {
    const response = toResponse(success(undefined, 204))
    expect(response.status).toBe(204)
    expect(await response.text()).toBe('')
  })
})

describe('API layering boundaries', () => {
  it('keeps every v1 route as a thin toResponse adapter', () => {
    const files = routeFiles(join(apiRoot, 'v1'))
    expect(files.length).toBeGreaterThan(0)
    for (const file of files) {
      expect(readFileSync(file, 'utf8'), file).toContain('toResponse(')
    }
  })

  it('keeps legacy routes as compatibility re-exports, except provider webhooks', () => {
    const files = routeFiles(apiRoot).filter((file) => !file.includes(`${'v1'}/`))
    expect(files.length).toBeGreaterThan(0)
    for (const file of files) {
      if (file.includes(`${'webhooks'}/`)) continue
      expect(readFileSync(file, 'utf8'), file).toMatch(/from '@\/app\/api\/v1\//)
    }
  })
})
