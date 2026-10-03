import { redirect } from 'next/navigation'
import { getAuthContext, canModerate } from '@/lib/auth'

export default async function ModerationPage() {
  const context = await getAuthContext()
  if (!context) redirect('/login?next=/moderation')
  if (!canModerate(context)) redirect('/feed')
  return <main className="mx-auto max-w-6xl px-6 py-10"><div className="mb-8"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Trust & safety</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Moderation queue</h1><p className="mt-2 text-sm text-muted-foreground">Review reports, protect the community, and keep decisions accountable.</p></div><section className="rounded-xl border border-border bg-surface p-8"><h2 className="text-lg font-semibold">Reports queue</h2><p className="mt-2 text-sm text-muted-foreground">The moderation workspace is protected and ready for report review actions.</p><div className="mt-6 grid gap-3 sm:grid-cols-3"><div className="rounded-lg border border-border p-4"><p className="text-xs text-muted-foreground">Open reports</p><p className="mt-2 text-2xl font-semibold">—</p></div><div className="rounded-lg border border-border p-4"><p className="text-xs text-muted-foreground">In review</p><p className="mt-2 text-2xl font-semibold">—</p></div><div className="rounded-lg border border-border p-4"><p className="text-xs text-muted-foreground">Resolved today</p><p className="mt-2 text-2xl font-semibold">—</p></div></div></section></main>
}
