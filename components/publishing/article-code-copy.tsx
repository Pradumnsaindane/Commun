'use client'

import { useEffect } from 'react'

/**
 * Markdown-rendered code fences already contain highlighted, escaped HTML.
 * This enhances them with a copy control without re-rendering the article
 * through React, and cleans the controls up on unmount.
 */
export function ArticleCodeCopy() {
  useEffect(() => {
    const cleanups: (() => void)[] = []
    const blocks = Array.from(document.querySelectorAll<HTMLPreElement>('.article-body pre.code-block'))

    for (const pre of blocks) {
      if (pre.querySelector('[data-code-copy]')) continue
      const button = document.createElement('button')
      button.type = 'button'
      button.dataset.codeCopy = 'true'
      button.className = 'code-copy'
      button.textContent = 'Copy'
      button.setAttribute('aria-label', 'Copy code to clipboard')

      const onClick = async () => {
        const code = pre.querySelector('code')?.textContent ?? ''
        try {
          await navigator.clipboard.writeText(code)
          button.textContent = 'Copied'
          window.setTimeout(() => { button.textContent = 'Copy' }, 1800)
        } catch {
          button.textContent = 'Copy failed'
          window.setTimeout(() => { button.textContent = 'Copy' }, 1800)
        }
      }

      button.addEventListener('click', onClick)
      pre.appendChild(button)
      cleanups.push(() => {
        button.removeEventListener('click', onClick)
        button.remove()
      })
    }

    return () => { cleanups.forEach((cleanup) => cleanup()) }
  }, [])

  return null
}
