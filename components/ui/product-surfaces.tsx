import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function SectionHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return <header className="flex flex-col gap-5 border-b border-border/80 pb-7 sm:flex-row sm:items-end sm:justify-between"><div>{eyebrow && <p className="mb-3 font-mono text-[10px] uppercase tracking-[.2em] text-accent">{eyebrow}</p>}<h1 className="text-3xl font-semibold tracking-[-.04em] sm:text-4xl">{title}</h1>{description && <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">{description}</p>}</div>{action}</header>
}

export function Surface({ className, children }: { className?: string; children: ReactNode }) { return <section className={cn('rounded-xl border border-border bg-surface shadow-[0_14px_40px_-28px_rgba(0,0,0,.85)]', className)}>{children}</section> }
export function StatusBadge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'accent' | 'danger' }) { return <span className={cn('inline-flex rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider', tone === 'accent' && 'border-accent/30 bg-accent/10 text-accent', tone === 'danger' && 'border-red-400/30 bg-red-400/10 text-red-300', tone === 'neutral' && 'border-border text-muted')}>{children}</span> }
export function FilterBar({ children }: { children: ReactNode }) { return <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-elevated p-2">{children}</div> }
export function IconAvatar({ label, src }: { label: string; src?: string | null }) { return src ? <img src={src} alt="" className="size-10 rounded-full object-cover" /> : <span aria-hidden className="grid size-10 place-items-center rounded-full border border-accent/25 bg-accent/10 font-semibold text-accent">{label.slice(0, 1).toUpperCase()}</span> }
