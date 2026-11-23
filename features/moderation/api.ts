import { apiRequest } from '@/features/api-client'

export type ReportTargetType = 'POST' | 'COMMENT' | 'DISCUSSION' | 'REPLY' | 'PROFILE'
export type ReportReason =
  | 'SPAM'
  | 'HARASSMENT'
  | 'ABUSE'
  | 'MISINFORMATION'
  | 'COPYRIGHT'
  | 'MALICIOUS_CONTENT'
  | 'OTHER'

export type SubmitReportInput = {
  targetType: ReportTargetType
  targetId: string
  reason: ReportReason
  description?: string
}

/** Only moderation actions that are implemented by the server are exposed. */
export type ModerationAction = 'RESOLVE' | 'DISMISS' | 'REMOVE'

export function submitReport(input: SubmitReportInput) {
  return apiRequest<{ ok: true }>('/reports', { method: 'POST', body: input })
}

export function actOnReport(reportId: string, action: ModerationAction) {
  return apiRequest<{ ok: true; status?: string; removed?: boolean }>(
    `/moderation/reports/${encodeURIComponent(reportId)}`,
    { method: 'POST', body: { action } }
  )
}
