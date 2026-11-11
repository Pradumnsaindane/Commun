/**
 * Minimal, dependency-free syntax highlighter.
 *
 * Input is HTML-escaped before any markup is produced, so untrusted code can
 * never inject HTML. `tokenizeEscaped` is exported for callers that already
 * hold escaped text (for example the markdown renderer).
 */

export const HIGHLIGHT_LANGUAGES = [
  'javascript',
  'typescript',
  'python',
  'go',
  'rust',
  'sql',
  'bash',
  'json',
  'java',
  'text',
] as const

export type HighlightLanguage = (typeof HIGHLIGHT_LANGUAGES)[number]

export const LANGUAGE_LABELS: Record<HighlightLanguage, string> = {
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  python: 'Python',
  go: 'Go',
  rust: 'Rust',
  sql: 'SQL',
  bash: 'Shell',
  json: 'JSON',
  java: 'Java',
  text: 'Plain text',
}

const KEYWORDS: Record<string, string[]> = {
  js: ['const','let','var','function','return','if','else','for','while','class','extends','new','await','async','import','from','export','default','try','catch','finally','throw','typeof','instanceof','of','in','this','null','undefined','true','false','switch','case','break','continue','interface','type','enum','implements','public','private','protected','readonly','as','satisfies','yield','delete','void','static','get','set'],
  python: ['def','class','return','if','elif','else','for','while','import','from','as','with','try','except','finally','raise','lambda','yield','async','await','None','True','False','and','or','not','in','is','pass','global','nonlocal','assert','del','self'],
  go: ['func','package','import','return','if','else','for','range','var','const','type','struct','interface','map','chan','go','defer','select','case','switch','break','continue','nil','true','false','make','new'],
  rust: ['fn','let','mut','const','struct','enum','impl','trait','use','pub','mod','match','if','else','for','while','loop','return','self','Self','where','async','await','move','ref','dyn','box','crate','super','true','false','None','Some','Ok','Err'],
  sql: ['select','from','where','insert','into','values','update','set','delete','create','table','index','policy','on','and','or','not','null','primary','key','foreign','references','join','left','right','inner','outer','group','by','order','limit','offset','as','with','case','when','then','else','end','distinct','grant','using','check','default','if','exists','enable','row','level','security'],
  bash: ['if','then','else','fi','for','while','do','done','case','esac','function','return','export','local','echo','cd','set','source','exit','sudo','npm','node','git'],
  json: ['true','false','null'],
  java: ['public','private','protected','class','interface','extends','implements','static','final','void','new','return','if','else','for','while','try','catch','finally','throw','throws','import','package','this','super','null','true','false','abstract','synchronized','record','var','switch','case','break','continue'],
}

const LANGUAGE_GROUPS: Record<HighlightLanguage, string | null> = {
  javascript: 'js',
  typescript: 'js',
  python: 'python',
  go: 'go',
  rust: 'rust',
  sql: 'sql',
  bash: 'bash',
  json: 'json',
  java: 'java',
  text: null,
}

const LANGUAGE_ALIASES: Record<string, HighlightLanguage> = {
  js: 'javascript',
  jsx: 'javascript',
  ts: 'typescript',
  tsx: 'typescript',
  py: 'python',
  golang: 'go',
  rs: 'rust',
  postgres: 'sql',
  postgresql: 'sql',
  sh: 'bash',
  shell: 'bash',
  zsh: 'bash',
}

export function isHighlightLanguage(value: string): value is HighlightLanguage {
  return (HIGHLIGHT_LANGUAGES as readonly string[]).includes(value)
}

export function normalizeLanguage(value: string | null | undefined): HighlightLanguage {
  const key = (value ?? '').trim().toLowerCase()
  if (!key) return 'text'
  if (isHighlightLanguage(key)) return key
  return LANGUAGE_ALIASES[key] ?? 'text'
}

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[character]!
  )
}

function span(kind: string, value: string): string {
  return `<span class="tok-${kind}">${value}</span>`
}

/** Tokenise text that has already been HTML-escaped. */
export function tokenizeEscaped(escaped: string, language: string | null | undefined): string {
  const normalized = normalizeLanguage(language)
  const group = LANGUAGE_GROUPS[normalized]
  if (!group) return escaped

  const keywords = KEYWORDS[group] ?? []
  const commentPattern =
    group === 'python' || group === 'bash'
      ? '#[^\\n]*'
      : group === 'sql'
        ? '--[^\\n]*'
        : '\\/\\/[^\\n]*|\\/\\*[\\s\\S]*?\\*\\/'
  // Quotes are already escaped at this point, so string tokens are delimited by
  // their HTML entities rather than raw quote characters.
  const dq = '&quot;'
  const sq = '&#039;'
  const stringPattern =
    group === 'python'
      ? `(?:${sq}){3}[\\s\\S]*?(?:${sq}){3}|(?:${dq}){3}[\\s\\S]*?(?:${dq}){3}|${sq}[^\\n]*?${sq}|${dq}[^\\n]*?${dq}`
      : `\`[^\`]*\`|${sq}[^\\n]*?${sq}|${dq}[^\\n]*?${dq}`
  const numberPattern = '\\b\\d+(?:\\.\\d+)?\\b'
  const keywordPattern = keywords.length ? `\\b(?:${keywords.join('|')})\\b` : null

  const parts = [`(${commentPattern})`, `(${stringPattern})`, `(${numberPattern})`]
  if (keywordPattern) parts.push(`(${keywordPattern})`)
  const master = new RegExp(parts.join('|'), 'g')

  return escaped.replace(master, (match, comment, text, number, keyword) => {
    if (comment) return span('comment', match)
    if (text) return span('string', match)
    if (number) return span('number', match)
    if (keyword) return span('keyword', match)
    return match
  })
}

/** Return escaped HTML with token spans for untrusted code. */
export function highlightCode(code: string, language: string | null | undefined): string {
  return tokenizeEscaped(escapeHtml(code), language)
}
