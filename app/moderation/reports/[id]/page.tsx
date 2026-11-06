import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { canModerate, getAuthContext } from '@/lib/auth'
import { createAdminClient } from '@/lib/admin'
import { ReportActions } from '@/components/moderation/report-actions'
import { SectionHeader, StatusBadge, Surface } from '@/components/ui/product-surfaces'

export default async function ReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const context = await getAuthContext()
  if (!context) redirect('/login?next=/moderation')
  if (!canModerate(context)) redirect('/feed')
  const { id } = await params
  const { data: report } = await createAdminClient().from('reports').select('*').eq('id', id).maybeSingle()
  if (!report) notFound()

  return (
    <main className="workspace-enter mx-auto w-full max-w-7xl py-2">
      <Link href="/moderation" className="inline-flex min-h-10 items-center rounded-lg text-xs font-medium text-muted transition-colors hover:text-accent">← Back to queue</Link>
      <div className="mt-4 flex flex-col gap-4 border-b border-border/80 pb-7 sm:flex-row sm:items-end sm:justify-between"><SectionHeader eyebrow="Report detail" title={report.reason.replace('_', ' ')} description={`${report.target_type} · submitted ${new Date(report.created_at).toLocaleString()}`} /><StatusBadge tone={report.status === 'OPEN' ? 'accent' : 'neutral'}>{report.status.replace('_', ' ')}</StatusBadge></div>
      <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Surface className="p-5 sm:p-6"><h2 className="text-sm font-semibold">Report context</h2><p className="mt-4 whitespace-pre-wrap break-words text-sm leading-7 text-muted">{report.description || 'No additional description provided.'}</p><dl className="mt-7 divide-y divide-border border-y border-border text-xs"><div className="flex flex-col gap-1 py-3 sm:flex-row sm:justify-between sm:gap-4"><dt className="text-muted">Target ID</dt><dd className="break-all font-mono sm:max-w-[65%] sm:text-right">{report.target_id}</dd></div><div className="flex flex-col gap-1 py-3 sm:flex-row sm:justify-between sm:gap-4"><dt className="text-muted">Reporter</dt><dd className="break-all font-mono sm:max-w-[65%] sm:text-right">{report.reporter_id}</dd></div></dl></Surface>
        <Surface className="p-5 sm:p-6"><h2 className="text-sm font-semibold">Decision</h2><p className="mt-2 text-xs leading-5 text-muted">Actions are recorded through the server-authorized moderation route.</p><ReportActions reportId={report.id} status={report.status} /></Surface>
      </div>
      {report.resolution_note && <Surface className="mt-5 p-5 sm:p-6"><h2 className="text-sm font-semibold">Resolution note</h2><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-muted">{report.resolution_note}</p></Surface>}
    </main>
  )
}
