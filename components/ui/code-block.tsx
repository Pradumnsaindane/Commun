'use client'

import { useState } from 'react'
import { highlightCode, LANGUAGE_LABELS, normalizeLanguage } from '@/lib/highlight'

export function CodeBlock({ code, language, className = '' }: { code: string; language?: string | null; className?: string }) {
  const [copied, setCopied] = useState(false)
  const normalized = normalizeLanguage(language)

  async function copy() {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }

  return (
    <figure className={`overflow-hidden rounded-xl border border-border bg-surface ${className}`}>
      <figcaption className="flex items-center justify-between gap-3 border-b border-border px-4 py-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">{LANGUAGE_LABELS[normalized]}</span>
        <button
          type="button"
          onClick={() => void copy()}
          className="inline-flex min-h-8 items-center rounded-md border border-border px-2.5 text-[11px] font-medium text-muted transition-colors hover:border-accent/50 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          aria-label="Copy code to clipboard"
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
      </figcaption>
      <pre className="code-block overflow-x-auto p-4 text-[13px] leading-6">
        <code dangerouslySetInnerHTML={{ __html: highlightCode(code, normalized) }} />
      </pre>
      <span role="status" aria-live="polite" className="sr-only">{copied ? 'Code copied to clipboard' : ''}</span>
    </figure>
  )
}
