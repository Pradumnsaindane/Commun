import { Card } from '@/components/ui/card'

export { Card }

export function EmptyState({ title, description, action, href }: { title: string; description: string; action?: string; href?: string }) {
  return (
    <Card className="flex min-h-48 flex-col items-center justify-center border-dashed bg-surface/70 p-8 text-center">
      <span aria-hidden="true" className="grid size-11 place-items-center rounded-xl border border-accent/20 bg-accent/10 text-xl text-accent">◌</span>
      <h2 className="mt-5 text-base font-semibold">{title}</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted">{description}</p>
      {action && href && <a href={href} className="mt-5 inline-flex min-h-10 items-center rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-accent">{action}</a>}
    </Card>
  )
}

export function PageContainer({ eyebrow, title, description, children }: { eyebrow?: string; title: string; description?: string; children?: React.ReactNode }) {
  return (
    <div className="workspace-enter mx-auto flex w-full max-w-7xl flex-col gap-7 py-2">
      <header className="border-b border-border/80 pb-7">
        {eyebrow && <p className="mb-2 font-mono text-[10px] uppercase tracking-[.2em] text-accent">{eyebrow}</p>}
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
        {description && <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">{description}</p>}
      </header>
      {children}
    </div>
  )
}
