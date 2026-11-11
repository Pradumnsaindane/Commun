import type { ReactNode } from 'react'

type PreviewFrameProps = {
  label: string
  caption: string
  children: ReactNode
  className?: string
}

/**
 * A framed interface preview. The panel content is hidden from assistive
 * technology because it is illustrative; the visible caption explains that.
 */
export function PreviewFrame({ label, caption, children, className = '' }: PreviewFrameProps) {
  return (
    <figure className={className}>
      <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-[0_24px_60px_-46px_rgba(23,32,51,0.45)]">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-3.5 py-2.5 sm:px-4">
          <span className="flex items-center gap-1.5" aria-hidden="true">
            <span className="size-2 rounded-full bg-border" />
            <span className="size-2 rounded-full bg-border" />
            <span className="size-2 rounded-full bg-border" />
          </span>
          <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted sm:text-[10px]">
            {label}
          </span>
          <span className="rounded-full border border-accent/25 bg-accent/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-accent">
            Illustrative
          </span>
        </div>
        <div aria-hidden="true">{children}</div>
      </div>
      <figcaption className="mt-2.5 font-mono text-[10px] leading-relaxed text-muted">
        {caption}
      </figcaption>
    </figure>
  )
}

const heroCode = [
  'export async function getProfile(id: string) {',
  '  const response = await fetch(`/api/people/${id}`)',
  '  if (!response.ok) throw new Error("Request failed")',
  '  return response.json()',
  '}',
].join('\n')

export function HeroPreview() {
  return (
    <PreviewFrame
      label="Developer preview"
      caption="Illustrative preview of a developer profile and code post. No live user data, follower counts, or engagement metrics are shown."
    >
      <div className="p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-accent/15 font-mono text-[11px] font-semibold text-accent">
            EX
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">Example developer</p>
            <p className="truncate font-mono text-[10px] text-muted">
              @example · TypeScript · Go
            </p>
          </div>
          <span className="ml-auto shrink-0 rounded-full border border-border px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-muted">
            Profile
          </span>
        </div>

        <p className="mt-4 text-sm leading-6 text-foreground">
          A small pattern for resilient API clients: retries, timeouts, and errors
          that stay readable.
        </p>

        <pre className="mt-3 overflow-x-auto rounded-lg border border-border bg-background p-3 font-mono text-[10px] leading-5 text-muted">
          <code>{heroCode}</code>
        </pre>

        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[10px] text-muted">
          <span>Like</span>
          <span>Comment</span>
          <span>Repost</span>
          <span>Save</span>
        </div>
      </div>
    </PreviewFrame>
  )
}

export function FeedPreview() {
  return (
    <PreviewFrame
      label="Home feed"
      caption="Illustrative feed layout. Post authors, topics, and suggestions are placeholders; no live posts or metrics are shown."
    >
      <div className="grid grid-cols-1 md:grid-cols-[132px_minmax(0,1fr)_148px]">
        <div className="hidden border-r border-border p-3 md:block">
          <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted">Navigate</p>
          <div className="mt-3 space-y-2.5">
            {['Feed', 'Explore', 'Articles', 'Discussions'].map((item, index) => (
              <div key={item} className="flex items-center gap-2">
                <span
                  className={`size-1.5 rounded-full ${index === 0 ? 'bg-accent' : 'bg-border'}`}
                />
                <span className={`text-[11px] ${index === 0 ? 'text-foreground' : 'text-muted'}`}>
                  {item}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-6 font-mono text-[9px] uppercase tracking-[0.14em] text-muted">Saved</p>
          <div className="mt-3 h-1.5 w-16 rounded-full bg-border" />
        </div>

        <div className="p-3 sm:p-4">
          <div className="flex flex-wrap gap-1.5">
            {['For you', 'Following', 'Latest'].map((tab, index) => (
              <span
                key={tab}
                className={`rounded-md border px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.1em] ${
                  index === 0
                    ? 'border-accent/25 bg-accent/10 text-accent'
                    : 'border-border text-muted'
                }`}
              >
                {tab}
              </span>
            ))}
          </div>

          <div className="mt-3 rounded-lg border border-border p-3">
            <div className="flex items-center gap-2">
              <span className="size-6 rounded-full bg-border" />
              <span className="h-1.5 w-20 rounded-full bg-border" />
              <span className="ml-auto font-mono text-[8px] uppercase tracking-[0.1em] text-subtle">
                Post
              </span>
            </div>
            <p className="mt-3 text-[11px] leading-5 text-foreground">
              Shipping a small internal tool that turned a repeated manual step into
              one command.
            </p>
            <div className="mt-2.5 flex gap-1.5">
              <span className="rounded border border-border px-1.5 py-0.5 font-mono text-[8px] text-muted">
                TypeScript
              </span>
              <span className="rounded border border-border px-1.5 py-0.5 font-mono text-[8px] text-muted">
                Tooling
              </span>
            </div>
          </div>

          <div className="mt-2.5 rounded-lg border border-border p-3">
            <div className="flex items-center gap-2">
              <span className="size-6 rounded-full bg-border" />
              <span className="h-1.5 w-16 rounded-full bg-border" />
              <span className="ml-auto font-mono text-[8px] uppercase tracking-[0.1em] text-subtle">
                Article
              </span>
            </div>
            <p className="mt-3 h-2 w-4/5 rounded-full bg-foreground/15" />
            <p className="mt-2 h-1.5 w-full rounded-full bg-border" />
            <p className="mt-1.5 h-1.5 w-3/4 rounded-full bg-border" />
          </div>
        </div>

        <div className="hidden border-l border-border p-3 md:block">
          <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted">Suggested</p>
          <div className="mt-3 space-y-3">
            {[0, 1, 2].map((row) => (
              <div key={row} className="flex items-center gap-2">
                <span className="size-5 rounded-full bg-border" />
                <div className="flex-1 space-y-1">
                  <span className="block h-1.5 w-full rounded-full bg-border" />
                  <span className="block h-1 w-2/3 rounded-full bg-border" />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-5 font-mono text-[9px] uppercase tracking-[0.14em] text-muted">Topics</p>
          <div className="mt-2 flex flex-wrap gap-1">
            {['React', 'Go', 'AI/ML'].map((topic) => (
              <span
                key={topic}
                className="rounded border border-border px-1.5 py-0.5 font-mono text-[8px] text-muted"
              >
                {topic}
              </span>
            ))}
          </div>
          <p className="mt-5 font-mono text-[9px] uppercase tracking-[0.14em] text-muted">
            Communities
          </p>
          <p className="mt-1.5 font-mono text-[8px] uppercase tracking-[0.1em] text-subtle">
            Soon
          </p>
        </div>
      </div>
    </PreviewFrame>
  )
}

const articleCode = [
  'type FeedQuery = { cursor?: string; limit: number }',
  '',
  'export async function loadFeed(query: FeedQuery) {',
  '  return db.posts.findMany({',
  '    where: { published: true },',
  '    take: query.limit,',
  '  })',
  '}',
].join('\n')

export function ArticlePreview() {
  return (
    <PreviewFrame
      label="Article layout"
      caption="Illustrative article layout with a reaction rail, tags, and a code block. The title and author are placeholders."
    >
      <div className="grid grid-cols-1 sm:grid-cols-[52px_minmax(0,1fr)]">
        <div className="hidden border-r border-border p-3 sm:block">
          <div className="space-y-3 text-center font-mono text-[8px] text-muted">
            <div>
              <span className="mx-auto block size-5 rounded-full border border-border" />
              <span className="mt-1 block">Like</span>
            </div>
            <div>
              <span className="mx-auto block size-5 rounded-full border border-border" />
              <span className="mt-1 block">Reply</span>
            </div>
            <div>
              <span className="mx-auto block size-5 rounded-full border border-border" />
              <span className="mt-1 block">Save</span>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-5">
          <div className="flex flex-wrap gap-1.5">
            {['TypeScript', 'Architecture'].map((tag) => (
              <span
                key={tag}
                className="rounded border border-border px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.08em] text-muted"
              >
                {tag}
              </span>
            ))}
          </div>
          <p className="mt-3 text-lg font-semibold leading-6 tracking-[-0.02em] text-foreground">
            Designing an API client that fails clearly
          </p>
          <p className="mt-2 font-mono text-[9px] text-muted">
            Example author · 6 min read
          </p>
          <p className="mt-3 text-[11px] leading-5 text-muted">
            Most client bugs are not network failures. They are unclear contracts
            around timeouts, retries, and partial responses.
          </p>
          <pre className="mt-3 overflow-x-auto rounded-lg border border-border bg-background p-3 font-mono text-[9px] leading-5 text-muted">
            <code>{articleCode}</code>
          </pre>
        </div>
      </div>
    </PreviewFrame>
  )
}

export function CommunityPreview() {
  return (
    <PreviewFrame
      label="Community directory"
      caption="Illustrative community directory structure. No communities, members, or activity exist yet."
    >
      <div className="p-4 sm:p-5">
        <div className="flex flex-wrap gap-1.5">
          {['Frontend', 'Backend', 'AI/ML', 'DevOps', 'Open source'].map((topic, index) => (
            <span
              key={topic}
              className={`rounded-full border px-2 py-0.5 font-mono text-[8px] ${
                index === 0
                  ? 'border-accent/25 bg-accent/10 text-accent'
                  : 'border-border text-muted'
              }`}
            >
              {topic}
            </span>
          ))}
        </div>

        <div className="mt-3 divide-y divide-border rounded-lg border border-border">
          {['Frontend engineering', 'Backend and data', 'Open source'].map((name) => (
            <div key={name} className="flex items-center gap-3 p-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-border bg-background font-mono text-[9px] text-muted">
                #
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[11px] font-medium text-foreground">{name}</p>
                <p className="mt-1 h-1 w-2/3 rounded-full bg-border" />
              </div>
              <span className="shrink-0 rounded border border-border px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.08em] text-subtle">
                Soon
              </span>
            </div>
          ))}
        </div>

        <p className="mt-3 font-mono text-[9px] text-subtle">
          Community spaces are not available yet.
        </p>
      </div>
    </PreviewFrame>
  )
}

export function ProjectPreview() {
  return (
    <PreviewFrame
      label="Project showcase"
      caption="Illustrative project showcase. Repository links, technologies, and project details are placeholders."
    >
      <div className="p-4 sm:p-5">
        <p className="font-mono text-[8px] uppercase tracking-[0.14em] text-muted">
          Example project
        </p>
        <p className="mt-2 text-base font-semibold tracking-[-0.02em] text-foreground">
          A typed client for a public API
        </p>
        <p className="mt-2 text-[11px] leading-5 text-muted">
          What it does, the trade-offs made, and what the next contributor should
          know before opening a pull request.
        </p>

        <div className="mt-3 grid grid-cols-2 gap-2">
          {['Repository', 'Live demo', 'Stack', 'License'].map((label) => (
            <div key={label} className="rounded-md border border-border p-2">
              <p className="font-mono text-[8px] uppercase tracking-[0.1em] text-muted">
                {label}
              </p>
              <p className="mt-1.5 h-1.5 w-4/5 rounded-full bg-border" />
            </div>
          ))}
        </div>

        <div className="mt-3 flex gap-1.5">
          {['TypeScript', 'Node.js', 'Postgres'].map((tech) => (
            <span
              key={tech}
              className="rounded border border-border px-1.5 py-0.5 font-mono text-[8px] text-muted"
            >
              {tech}
            </span>
          ))}
        </div>
      </div>
    </PreviewFrame>
  )
}

export function ConversationPreview() {
  return (
    <PreviewFrame
      label="Developer messaging"
      caption="Illustrative conversation layout. No messages are sent, stored, or shown from real accounts."
    >
      <div className="p-4 sm:p-5">
        <div className="flex items-center gap-2 border-b border-border pb-3">
          <span className="grid size-7 place-items-center rounded-full bg-accent/15 font-mono text-[9px] text-accent">
            EX
          </span>
          <div>
            <p className="text-[11px] font-medium text-foreground">Example conversation</p>
            <p className="font-mono text-[8px] uppercase tracking-[0.1em] text-subtle">
              Messaging in development
            </p>
          </div>
        </div>

        <div className="mt-3 space-y-2">
          <div className="max-w-[85%] rounded-lg rounded-tl-sm border border-border bg-background p-2.5">
            <p className="h-1.5 w-40 rounded-full bg-border" />
            <p className="mt-1.5 h-1.5 w-24 rounded-full bg-border" />
          </div>
          <div className="ml-auto max-w-[85%] rounded-lg rounded-tr-sm bg-accent/10 p-2.5">
            <p className="h-1.5 w-36 rounded-full bg-accent/25" />
            <p className="mt-1.5 h-1.5 w-28 rounded-full bg-accent/20" />
          </div>
          <div className="max-w-[75%] rounded-lg rounded-tl-sm border border-border bg-background p-2.5">
            <p className="h-1.5 w-32 rounded-full bg-border" />
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2 rounded-lg border border-dashed border-border p-2.5">
          <span className="h-1.5 flex-1 rounded-full bg-border" />
          <span className="font-mono text-[8px] uppercase tracking-[0.1em] text-subtle">Soon</span>
        </div>
      </div>
    </PreviewFrame>
  )
}

export function JobsPreview() {
  return (
    <PreviewFrame
      label="Job board"
      caption="Illustrative job-board structure. No companies, roles, salaries, or listings are shown."
    >
      <div className="p-4 sm:p-5">
        <div className="flex flex-wrap gap-1.5">
          {['Full-time', 'Contract', 'Remote'].map((filter, index) => (
            <span
              key={filter}
              className={`rounded-md border px-2 py-0.5 font-mono text-[8px] ${
                index === 0
                  ? 'border-accent/25 bg-accent/10 text-accent'
                  : 'border-border text-muted'
              }`}
            >
              {filter}
            </span>
          ))}
        </div>

        <div className="mt-3 space-y-2">
          {[0, 1, 2].map((row) => (
            <div key={row} className="rounded-lg border border-border p-3">
              <div className="flex items-center justify-between gap-3">
                <span className="h-2 w-2/5 rounded-full bg-foreground/15" />
                <span className="rounded border border-border px-1.5 py-0.5 font-mono text-[8px] text-subtle">
                  Soon
                </span>
              </div>
              <div className="mt-2 flex gap-1.5">
                <span className="h-1.5 w-16 rounded-full bg-border" />
                <span className="h-1.5 w-12 rounded-full bg-border" />
                <span className="h-1.5 w-14 rounded-full bg-border" />
              </div>
            </div>
          ))}
        </div>

        <p className="mt-3 font-mono text-[9px] text-subtle">
          The job board is not open yet.
        </p>
      </div>
    </PreviewFrame>
  )
}
