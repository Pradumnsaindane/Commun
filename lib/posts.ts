import { z } from 'zod'

export const postInputSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(140),
  excerpt: z.string().trim().max(280).optional().default(''),
  body: z.string().max(200000).default(''),
  topicIds: z.array(z.string().uuid()).max(8).default([]),
  coverImagePath: z.string().max(500).optional().nullable(),
  status: z.enum(['DRAFT', 'PUBLISHED']).default('DRAFT'),
})

export function slugify(value: string) {
  return value.toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 90) || 'untitled-article'
}

export function readingTime(body: string) { return Math.max(1, Math.ceil(body.trim().split(/\s+/).filter(Boolean).length / 200)) }

export function escapeHtml(value: string) { return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[char]!) }

export function renderMarkdown(markdown: string) {
  const safe = escapeHtml(markdown).replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" rel="nofollow noopener noreferrer" target="_blank">$1</a>')
  return safe.split(/\n{2,}/).map((block) => {
    const lines = block.split('\n')
    if (lines.every((line) => /^[-*] /.test(line))) return `<ul>${lines.map((line) => `<li>${inlineMarkdown(line.slice(2))}</li>`).join('')}</ul>`
    if (lines.every((line) => /^\d+\. /.test(line))) return `<ol>${lines.map((line) => `<li>${inlineMarkdown(line.replace(/^\d+\. /, ''))}</li>`).join('')}</ol>`
    if (lines[0].startsWith('```')) return `<pre><code>${lines.slice(1, -1).join('\n')}</code></pre>`
    if (/^#{1,3} /.test(lines[0])) { const level = Math.min(3, lines[0].match(/^#+/)![0].length); return `<h${level}>${inlineMarkdown(lines[0].slice(level + 1))}</h${level}>` }
    if (lines[0].startsWith('> ')) return `<blockquote>${inlineMarkdown(lines.map((line) => line.replace(/^> /, '')).join('\n'))}</blockquote>`
    if (/^---+$/.test(lines[0])) return '<hr />'
    return `<p>${inlineMarkdown(lines.join('\n')).replace(/\n/g, '<br />')}</p>`
  }).join('')
}

function inlineMarkdown(value: string) { return value.replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/_([^_]+)_/g, '<em>$1</em>') }

export async function uniqueSlug(supabase: any, title: string, excludeId?: string) {
  const base = slugify(title)
  let slug = base
  for (let index = 2; index < 100; index++) {
    let query = supabase.from('posts').select('id').eq('slug', slug).maybeSingle()
    if (excludeId) query = query.neq('id', excludeId)
    const { data } = await query
    if (!data) return slug
    slug = `${base}-${index}`
  }
  return `${base}-${crypto.randomUUID().slice(0, 8)}`
}

export function isActiveProfile(profile: { status?: string } | null) { return profile?.status === 'ACTIVE' }
export function jsonError(message: string, status: number) { return Response.json({ error: message }, { status }) }
export type PostRecord = { id: string; author_id: string; title: string; slug: string; excerpt: string | null; body: string; cover_image_path: string | null; status: string; reading_time_minutes: number; published_at: string | null; created_at: string; updated_at: string }
