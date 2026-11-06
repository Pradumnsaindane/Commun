import { redirect } from 'next/navigation'
import { getAuthContext } from '@/lib/auth'
import { createAdminClient } from '@/lib/admin'
import { EmptyState } from '@/components/ui/primitives'
import { SectionHeader, Surface } from '@/components/ui/product-surfaces'

export default async function AuditLogsPage() {
  const context = await getAuthContext()
  if (!context) redirect('/login?next=/admin/audit-logs')
  if (context.role !== 'ADMIN') redirect('/feed')

  const { data: logs, error } = await createAdminClient().from('audit_logs').select('id,actor_id,action,target_type,target_id,metadata,created_at').order('created_at', { ascending: false }).limit(100)

  return (
    <main className="workspace-enter mx-auto w-full max-w-7xl py-2">
      <SectionHeader eyebrow="Administration / forensics" title="Audit logs" description="Append-only records of moderation and administrative actions." />
      <Surface className="mt-7 overflow-hidden">
        {error ? <p role="alert" className="p-6 text-sm text-muted">Audit logs could not be loaded. Try again later.</p> : logs?.length ? logs.map((log) => <div key={log.id} className="grid gap-3 border-b border-border p-4 last:border-0 sm:p-5 md:grid-cols-[180px_1fr_220px] md:items-center"><div><p className="font-mono text-xs font-semibold text-accent">{log.action}</p><p className="mt-1 text-xs text-muted">Actor {log.actor_id.slice(0, 8)}…</p></div><p className="break-words text-sm text-muted">{log.target_type} · {log.target_id ?? 'No target'}</p><time className="text-xs text-muted" dateTime={log.created_at}>{new Date(log.created_at).toLocaleString()}</time></div>) : <EmptyState title="No audit events yet" description="Administrative and moderation actions will appear here once recorded." />}
      </Surface>
    </main>
  )
}
