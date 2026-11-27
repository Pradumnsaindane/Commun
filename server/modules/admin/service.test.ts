import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  requireRole: vi.fn(),
  writeAudit: vi.fn(),
  getAuthUser: vi.fn(),
  updateAuthUserMetadata: vi.fn(),
  listAuthUsers: vi.fn(),
  listAuditLogs: vi.fn(),
  createAdminClient: vi.fn(() => ({ marker: 'admin-client' })),
}))

vi.mock('@/server/http/auth', () => ({ requireRole: mocks.requireRole }))
vi.mock('@/lib/admin', () => ({
  createAdminClient: mocks.createAdminClient,
  writeAudit: mocks.writeAudit,
}))
vi.mock('@/server/repositories/admin', () => ({
  getAuthUser: mocks.getAuthUser,
  updateAuthUserMetadata: mocks.updateAuthUserMetadata,
  listAuthUsers: mocks.listAuthUsers,
  listAuditLogs: mocks.listAuditLogs,
}))

import { listAdminUsers, updateAdminUser } from '@/server/modules/admin/service'

const adminId = 'a47ac10b-58cc-4372-a567-0e02b2c3d479'
const targetId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
const context = { user: { id: adminId }, role: 'ADMIN', status: 'ACTIVE' }

function request(body: unknown) {
  return new Request('http://localhost/api/v1/admin/users', { method: 'PATCH', body: JSON.stringify(body) })
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.requireRole.mockResolvedValue({ context, error: null })
  mocks.writeAudit.mockResolvedValue(true)
  mocks.getAuthUser.mockResolvedValue({ data: { user: { id: targetId, app_metadata: { role: 'USER' } } } })
  mocks.updateAuthUserMetadata.mockResolvedValue({ error: null })
  mocks.listAuthUsers.mockResolvedValue({ data: { users: [] }, error: null })
  mocks.listAuditLogs.mockResolvedValue({ data: [], count: 0, error: null })
})

describe('admin service', () => {
  it('propagates an authorization failure before touching provider data', async () => {
    mocks.requireRole.mockResolvedValue({ context: null, error: { ok: false, error: 'Administrator access required.', status: 403 } })
    const result = await listAdminUsers(new Request('http://localhost/api/v1/admin/users'))
    expect(result.status).toBe(403)
    expect(mocks.listAuthUsers).not.toHaveBeenCalled()
  })

  it('blocks an admin from changing their own role', async () => {
    const result = await updateAdminUser(request({ userId: adminId, role: 'USER' }))
    expect(result.status).toBe(422)
    expect(mocks.updateAuthUserMetadata).not.toHaveBeenCalled()
  })

  it('rejects an empty user change', async () => {
    const result = await updateAdminUser(request({ userId: targetId }))
    expect(result.status).toBe(422)
    expect(mocks.updateAuthUserMetadata).not.toHaveBeenCalled()
  })

  it('audits both role and status changes in one update', async () => {
    const result = await updateAdminUser(request({ userId: targetId, role: 'USER', status: 'ACTIVE' }))
    expect(result.ok).toBe(true)
    expect(mocks.writeAudit.mock.calls.map((call) => call[1])).toEqual(['ROLE_CHANGED', 'USER_RESTORED'])
  })

  it('reports a privileged change whose audit write failed', async () => {
    mocks.writeAudit.mockResolvedValue(false)
    const result = await updateAdminUser(request({ userId: targetId, status: 'SUSPENDED' }))
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.status).toBe(500)
    expect(result.error).toMatch(/audit entry could not be recorded/)
  })

  it('validates metadata returned from the auth provider before exposing it', async () => {
    mocks.listAuthUsers.mockResolvedValue({
      data: { users: [{ id: 'u-1', app_metadata: { role: 'SUPERUSER', status: 'UNKNOWN' }, email_confirmed_at: null }] },
      error: null,
    })
    const result = await listAdminUsers(new Request('http://localhost/api/v1/admin/users'))
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data).toMatchObject({ users: [{ role: 'USER', status: 'PENDING_VERIFICATION' }] })
  })
})
