import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  requireRole: vi.fn(),
  writeAudit: vi.fn(),
  notifyUser: vi.fn(),
  findReport: vi.fn(),
  updateReport: vi.fn(),
  findContentAuthor: vi.fn(),
  updateContent: vi.fn(),
  listReports: vi.fn(),
  createAdminClient: vi.fn(() => ({ marker: 'admin-client' })),
}))

vi.mock('@/server/http/auth', () => ({ requireRole: mocks.requireRole }))
vi.mock('@/lib/admin', () => ({
  createAdminClient: mocks.createAdminClient,
  writeAudit: mocks.writeAudit,
  notifyUser: mocks.notifyUser,
}))
vi.mock('@/server/repositories/moderation', () => ({
  findReport: mocks.findReport,
  updateReport: mocks.updateReport,
  findContentAuthor: mocks.findContentAuthor,
  updateContent: mocks.updateContent,
  listReports: mocks.listReports,
}))

import {
  actOnModerationReport,
  getModerationReport,
  listModerationReports,
} from '@/server/modules/moderation/service'

const reportId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
const context = { user: { id: 'mod-1' }, role: 'MODERATOR', status: 'ACTIVE' }
const openReport = {
  id: reportId,
  status: 'OPEN',
  target_type: 'POST',
  target_id: 'post-1',
  reporter_id: 'reporter-1',
}

function actionRequest(action: string) {
  return new Request(`http://localhost/api/v1/moderation/reports/${reportId}`, {
    method: 'POST',
    body: JSON.stringify({ action }),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.requireRole.mockResolvedValue({ context, error: null })
  mocks.writeAudit.mockResolvedValue(true)
  mocks.notifyUser.mockResolvedValue(undefined)
  mocks.findReport.mockResolvedValue({ data: openReport, error: null })
  mocks.updateReport.mockResolvedValue({ error: null })
  mocks.findContentAuthor.mockResolvedValue({ data: { author_id: 'author-1' }, error: null })
  mocks.updateContent.mockResolvedValue({ error: null })
  mocks.listReports.mockResolvedValue({ data: [], count: 0, error: null })
})

describe('moderation service', () => {
  it('denies non-moderators before reading any report', async () => {
    mocks.requireRole.mockResolvedValue({ context: null, error: { ok: false, error: 'Moderator access required.', status: 403 } })
    const result = await listModerationReports(new Request('http://localhost/api/v1/moderation/reports'))
    expect(result.status).toBe(403)
    expect(mocks.listReports).not.toHaveBeenCalled()
  })

  it('rejects non-UUID report identifiers', async () => {
    expect((await getModerationReport({ id: 'not-a-uuid' })).status).toBe(422)
    expect((await actOnModerationReport(actionRequest('RESOLVE'), { id: 'not-a-uuid' })).status).toBe(422)
    expect(mocks.findReport).not.toHaveBeenCalled()
  })

  it('refuses to remove content from an already closed report', async () => {
    mocks.findReport.mockResolvedValue({ data: { ...openReport, status: 'RESOLVED' }, error: null })
    const result = await actOnModerationReport(actionRequest('REMOVE'), { id: reportId })
    expect(result.status).toBe(409)
    expect(mocks.updateContent).not.toHaveBeenCalled()
  })

  it('reports a decision whose audit write failed', async () => {
    mocks.writeAudit.mockResolvedValue(false)
    const result = await actOnModerationReport(actionRequest('RESOLVE'), { id: reportId })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.status).toBe(500)
    expect(result.error).toMatch(/audit entry could not be recorded/)
  })

  it('delegates self-notification suppression to the shared helper', async () => {
    mocks.findReport.mockResolvedValue({ data: { ...openReport, reporter_id: 'mod-1' }, error: null })
    await actOnModerationReport(actionRequest('DISMISS'), { id: reportId })
    expect(mocks.notifyUser).toHaveBeenCalledWith('mod-1', 'mod-1', 'MODERATION', reportId, expect.any(String))
  })
})
