import Link from 'next/link'
import { redirect } from 'next/navigation'
import { canModerate, getAuthContext } from '@/lib/auth'
import { createAdminClient } from '@/lib/admin'
import { EmptyState } from '@/components/ui/primitives'
import { FilterBar, SectionHeader, StatusBadge, Surface } from '@/components/ui/product-surfaces'

const filters = ['ALL', 'OPEN', 'IN_REVIEW', 'RESOLVED', 'DISMISSED']

export default async function ModerationPage({ searchParams }: { searchParams: Promise<{ status?: string; page?: string }> }) {
  const context = await getAuthContext()
  if (!context) redirect('/login?next=/moderation')
  if (!canModerate(context)) redirect('/feed')
  const params = await searchParams
  const page = Math.max(1, Number(params.page ?? 1))
  const size = 20
  const db = createAdminClient()
  let query = db.from('reports').select('id,target_type,target_id,reason,status,reporter_id,created_at,resolution_note', { count: 'exact' }).order('created_at', { ascending: false }).range((page - 1) * size, page * size - 1)
  if (params.status && filters.includes(params.status) && params.status !== 'ALL') query = query.eq('status', params.status)
  const { data: reports, error } = await query
  const activeStatus = filters.includes(params.status ?? 'ALL') ? params.status ?? 'ALL' : 'ALL'

  return (
    <main className="workspace-enter mx-auto w-full max-w-7xl py-2">
      <SectionHeader eyebrow="Trust & safety" title="Moderation queue" description="Review community reports and record accountable decisions." />
      <div className="mt-6 overflow-x-auto pb-1"><FilterBar>{filters.map((status) => <Link key={status} href={status === 'ALL' ? '/moderation' : `/moderation?status=${status}`} aria-current={activeStatus === status ? 'page' : undefined} className={`whitespace-nowrap rounded-lg px-3 py-2 font-mono text-[10px] uppercase tracking-wider transition-colors ${activeStatus === status ? 'bg-accent text-accent-foreground' : 'text-muted hover:bg-surface hover:text-foreground'}`}>{status.replace('_', ' ')}</Link>)}</FilterBar></div>
      <div className="mt-5">
        {error ? <Surface className="p-6"><p role="alert" className="text-sm text-muted">Reports couldn’t be loaded. Try again later.</p></Surface> : reports?.length ? <Surface className="overflow-hidden"><div className="hidden grid-cols-[1.4fr_1fr_1fr_120px] gap-4 border-b border-border bg-background px-5 py-3 font-mono text-[10px] uppercase tracking-wider text-muted md:grid"><span>Report</span><span>Target</span><span>Created</span><span>Status</span></div>{reports.map((report) => <Link href={`/moderation/reports/${report.id}`} key={report.id} className="grid gap-3 border-b border-border p-4 transition-colors last:border-0 hover:bg-surface-hover sm:p-5 md:grid-cols-[1.4fr_1fr_1fr_120px] md:items-center md:gap-4"><div className="min-w-0"><p className="truncate font-medium">{report.reason.replace('_', ' ')}</p><p className="mt-1 truncate font-mono text-[10px] uppercase text-muted">{report.target_type} · {report.id.slice(0, 8)}</p></div><p className="font-mono text-xs text-muted">{report.target_id.slice(0, 8)}…</p><p className="text-xs text-muted">{new Date(report.created_at).toLocaleDateString()}</p><StatusBadge tone={report.status === 'OPEN' ? 'accent' : 'neutral'}>{report.status.replace('_', ' ')}</StatusBadge></Link>)}</Surface> : <EmptyState title="No reports in this view" description="There are no reports matching the selected status." />}
      </div>
    </main>
  )
}
