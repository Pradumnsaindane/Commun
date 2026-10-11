/**
 * Commun.dev Real Developer News Service
 * Ingestion, deduplication, categorization, and query retrieval from verified developer engineering sources.
 */

export const NEWS_CATEGORIES = [
  'Artificial Intelligence and Machine Learning',
  'Web Development',
  'JavaScript and TypeScript',
  'Frontend Engineering',
  'Backend Engineering',
  'Cloud Computing',
  'DevOps and Platform Engineering',
  'Cybersecurity',
  'Databases',
  'Open Source',
  'Developer Tools',
  'System Design',
  'Programming Languages',
  'Engineering Careers',
] as const

export type NewsCategory = (typeof NEWS_CATEGORIES)[number]

export interface NewsItem {
  id: string
  title: string
  summary: string
  canonicalUrl: string
  sourceName: string
  sourceDomain: string
  publishedAt: string
  ingestedAt: string
  category: NewsCategory
  tags: string[]
  imageUrl: string | null
  score: number
}

export interface IngestionResult {
  success: boolean
  sourcesQueried: number
  totalFetched: number
  newItemsInserted: number
  duplicatesSkipped: number
  lastSynchronizedAt: string
  errors: string[]
}

/**
 * Strips tracking parameters and normalizes a canonical URL.
 */
export function normalizeCanonicalUrl(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl)
    // Remove UTM parameters and common tracking query strings
    const trackingParams = [
      'utm_source',
      'utm_medium',
      'utm_campaign',
      'utm_term',
      'utm_content',
      'ref',
      'fbclid',
      'gclid',
    ]
    trackingParams.forEach((param) => parsed.searchParams.delete(param))
    parsed.hash = ''
    return parsed.toString().replace(/\/+$/, '')
  } catch {
    return rawUrl.trim().replace(/\/+$/, '')
  }
}

/**
 * Categorizes an article into one of the 14 approved developer categories based on title, summary, and tags.
 */
export function categorizeNews(
  title: string,
  summary: string,
  tags: string[] = []
): NewsCategory {
  const combined = `${title} ${summary} ${tags.join(' ')}`.toLowerCase()

  if (
    /\b(ai|llm|llms|gpt|rag|genai|agi)\b/i.test(combined) ||
    combined.includes('artificial intelligence') ||
    combined.includes('machine learning') ||
    combined.includes('neural network') ||
    combined.includes('deep learning') ||
    combined.includes('transformer') ||
    combined.includes('deepseek') ||
    combined.includes('gemini') ||
    combined.includes('claude') ||
    combined.includes('diffusion model')
  ) {
    return 'Artificial Intelligence and Machine Learning'
  }

  if (
    combined.includes('security') ||
    combined.includes('vulnerability') ||
    combined.includes('cve') ||
    combined.includes('exploit') ||
    combined.includes('ransomware') ||
    combined.includes('malware') ||
    combined.includes('zero-day') ||
    combined.includes('audit') ||
    combined.includes('cryptography')
  ) {
    return 'Cybersecurity'
  }

  if (
    combined.includes('devops') ||
    combined.includes('kubernetes') ||
    combined.includes('docker') ||
    combined.includes('k8s') ||
    combined.includes('ci/cd') ||
    combined.includes('pipeline') ||
    combined.includes('terraform') ||
    combined.includes('ansible') ||
    combined.includes('observability')
  ) {
    return 'DevOps and Platform Engineering'
  }

  if (
    combined.includes('cloud') ||
    combined.includes('aws') ||
    combined.includes('azure') ||
    combined.includes('gcp') ||
    combined.includes('serverless') ||
    combined.includes('lambda') ||
    combined.includes('s3') ||
    combined.includes('ec2')
  ) {
    return 'Cloud Computing'
  }

  if (
    combined.includes('database') ||
    combined.includes('sql') ||
    combined.includes('postgres') ||
    combined.includes('postgresql') ||
    combined.includes('mysql') ||
    combined.includes('redis') ||
    combined.includes('mongodb') ||
    combined.includes('sqlite') ||
    combined.includes('prisma')
  ) {
    return 'Databases'
  }

  if (
    combined.includes('system design') ||
    combined.includes('microservices') ||
    combined.includes('distributed') ||
    combined.includes('scalability') ||
    combined.includes('concurrency') ||
    combined.includes('architecture')
  ) {
    return 'System Design'
  }

  if (
    combined.includes('typescript') ||
    combined.includes('javascript') ||
    combined.includes('ecmascript') ||
    combined.includes('node.js') ||
    combined.includes('bun') ||
    combined.includes('deno')
  ) {
    return 'JavaScript and TypeScript'
  }

  if (
    combined.includes('frontend') ||
    combined.includes('css') ||
    combined.includes('react') ||
    combined.includes('vue') ||
    combined.includes('svelte') ||
    combined.includes('tailwind') ||
    combined.includes('ui/ux') ||
    combined.includes('html')
  ) {
    return 'Frontend Engineering'
  }

  if (
    combined.includes('rust') ||
    combined.includes('golang') ||
    combined.includes('go lang') ||
    combined.includes('python') ||
    combined.includes('c++') ||
    combined.includes('c#') ||
    combined.includes('java') ||
    combined.includes('kotlin') ||
    combined.includes('swift')
  ) {
    return 'Programming Languages'
  }

  if (
    combined.includes('open source') ||
    combined.includes('oss') ||
    combined.includes('github') ||
    combined.includes('git') ||
    combined.includes('linux') ||
    combined.includes('kernel')
  ) {
    return 'Open Source'
  }

  if (
    combined.includes('backend') ||
    combined.includes('api') ||
    combined.includes('graphql') ||
    combined.includes('rest') ||
    combined.includes('grpc') ||
    combined.includes('server')
  ) {
    return 'Backend Engineering'
  }

  if (
    combined.includes('developer tools') ||
    combined.includes('cli') ||
    combined.includes('ide') ||
    combined.includes('editor') ||
    combined.includes('compiler') ||
    combined.includes('tooling') ||
    combined.includes('vim') ||
    combined.includes('neovim')
  ) {
    return 'Developer Tools'
  }

  if (
    combined.includes('career') ||
    combined.includes('interview') ||
    combined.includes('salary') ||
    combined.includes('staff engineer') ||
    combined.includes('engineering management') ||
    combined.includes('hiring')
  ) {
    return 'Engineering Careers'
  }

  return 'Web Development'
}

/**
 * Parse XML RSS feed text into article items without heavy external dependencies.
 */
function parseRssXml(xml: string, sourceName: string, sourceDomain: string): Omit<NewsItem, 'id' | 'ingestedAt'>[] {
  const items: Omit<NewsItem, 'id' | 'ingestedAt'>[] = []
  const itemBlocks = xml.split(/<item[\s>]/i).slice(1)

  for (const block of itemBlocks) {
    const itemContent = block.split(/<\/item>/i)[0]
    if (!itemContent) continue

    const titleMatch = itemContent.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i)
    const linkMatch = itemContent.match(/<link>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/i)
    const descMatch = itemContent.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i)
    const dateMatch = itemContent.match(/<pubDate>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/pubDate>/i)

    const rawTitle = titleMatch ? titleMatch[1].trim() : ''
    const rawLink = linkMatch ? linkMatch[1].trim() : ''
    const rawDesc = descMatch
      ? descMatch[1]
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 320)
      : ''

    if (!rawTitle || !rawLink || !rawLink.startsWith('http')) continue

    const publishedDate = dateMatch ? new Date(dateMatch[1]) : new Date()
    const publishedAt = isNaN(publishedDate.getTime()) ? new Date().toISOString() : publishedDate.toISOString()

    const canonicalUrl = normalizeCanonicalUrl(rawLink)
    const category = categorizeNews(rawTitle, rawDesc)

    items.push({
      title: rawTitle,
      summary: rawDesc,
      canonicalUrl,
      sourceName,
      sourceDomain,
      publishedAt,
      category,
      tags: [],
      imageUrl: null,
      score: 0,
    })
  }

  return items
}

/**
 * Fetches real articles from approved developer sources.
 */
export async function fetchNewsFromSources(): Promise<{
  items: Omit<NewsItem, 'id' | 'ingestedAt'>[]
  sourcesQueried: number
  errors: string[]
}> {
  const allItems: Omit<NewsItem, 'id' | 'ingestedAt'>[] = []
  const errors: string[] = []
  let sourcesQueried = 0

  // 1. Source: DEV Community API
  try {
    sourcesQueried++
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 6000)
    const res = await fetch('https://dev.to/api/articles?per_page=20', {
      headers: { 'User-Agent': 'Commun.dev-Intelligence/1.0' },
      signal: controller.signal,
    })
    clearTimeout(timer)

    if (res.ok) {
      const articles = (await res.json()) as any[]
      for (const a of articles) {
        if (!a.title || !a.url) continue
        const canonicalUrl = normalizeCanonicalUrl(a.canonical_url || a.url)
        const summary = (a.description || '').slice(0, 320)
        const tags = Array.isArray(a.tag_list) ? a.tag_list : []
        const category = categorizeNews(a.title, summary, tags)
        const publishedDate = a.published_at ? new Date(a.published_at) : new Date()

        allItems.push({
          title: a.title,
          summary,
          canonicalUrl,
          sourceName: 'DEV Community',
          sourceDomain: 'dev.to',
          publishedAt: isNaN(publishedDate.getTime()) ? new Date().toISOString() : publishedDate.toISOString(),
          category,
          tags,
          imageUrl: a.cover_image || a.social_image || null,
          score: Number(a.positive_reactions_count || 0),
        })
      }
    } else {
      errors.push(`DEV Community responded with HTTP ${res.status}`)
    }
  } catch (err: any) {
    errors.push(`DEV Community fetch failed: ${err.message}`)
  }

  // 2. Source: GitHub Blog RSS
  try {
    sourcesQueried++
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 6000)
    const res = await fetch('https://github.blog/feed/', {
      headers: { 'User-Agent': 'Commun.dev-Intelligence/1.0' },
      signal: controller.signal,
    })
    clearTimeout(timer)

    if (res.ok) {
      const xml = await res.text()
      const ghItems = parseRssXml(xml, 'GitHub Engineering', 'github.blog')
      allItems.push(...ghItems)
    } else {
      errors.push(`GitHub Blog RSS responded with HTTP ${res.status}`)
    }
  } catch (err: any) {
    errors.push(`GitHub Blog RSS fetch failed: ${err.message}`)
  }

  // 3. Source: Hacker News Top Stories API
  try {
    sourcesQueried++
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 6000)
    const hnIdsRes = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json', {
      signal: controller.signal,
    })
    clearTimeout(timer)

    if (hnIdsRes.ok) {
      const ids = ((await hnIdsRes.json()) as number[]).slice(0, 15)
      const storyPromises = ids.map(async (id) => {
        try {
          const itemRes = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`, {
            signal: AbortSignal.timeout(3000),
          })
          if (!itemRes.ok) return null
          const item = (await itemRes.json()) as any
          if (!item || !item.title || !item.url) return null
          const canonicalUrl = normalizeCanonicalUrl(item.url)
          let domain = 'news.ycombinator.com'
          try {
            domain = new URL(item.url).hostname.replace(/^www\./, '')
          } catch {}

          const category = categorizeNews(item.title, '')
          const publishedAt = item.time ? new Date(item.time * 1000).toISOString() : new Date().toISOString()

          return {
            title: item.title,
            summary: `Trending discussion on Hacker News with ${item.score ?? 0} points and ${item.descendants ?? 0} comments.`,
            canonicalUrl,
            sourceName: 'Hacker News',
            sourceDomain: domain,
            publishedAt,
            category,
            tags: ['trending', 'hackernews'],
            imageUrl: null,
            score: Number(item.score || 0),
          }
        } catch {
          return null
        }
      })

      const stories = await Promise.all(storyPromises)
      for (const s of stories) {
        if (s) allItems.push(s)
      }
    }
  } catch (err: any) {
    errors.push(`Hacker News fetch failed: ${err.message}`)
  }

  // In-memory Deduplication across sources
  const seenUrls = new Set<string>()
  const uniqueItems: Omit<NewsItem, 'id' | 'ingestedAt'>[] = []

  for (const item of allItems) {
    if (!seenUrls.has(item.canonicalUrl)) {
      seenUrls.add(item.canonicalUrl)
      uniqueItems.push(item)
    }
  }

  return {
    items: uniqueItems,
    sourcesQueried,
    errors,
  }
}

// In-memory fallback cache when database table is not provisioned or during local runs
let memoryCache: { items: NewsItem[]; lastSync: string } | null = null

/**
 * Ingest news items into Supabase PostgreSQL database table `developer_news`.
 */
export async function ingestDeveloperNews(supabase: any): Promise<IngestionResult> {
  const { items, sourcesQueried, errors } = await fetchNewsFromSources()
  const now = new Date().toISOString()
  let inserted = 0
  let skipped = 0

  try {
    for (const item of items) {
      const record = {
        title: item.title.slice(0, 300),
        summary: item.summary.slice(0, 1000),
        canonical_url: item.canonicalUrl,
        source_name: item.sourceName.slice(0, 100),
        source_domain: item.sourceDomain.slice(0, 100),
        published_at: item.publishedAt,
        ingested_at: now,
        category: item.category,
        tags: item.tags,
        image_url: item.imageUrl,
        score: item.score,
      }

      const { error } = await supabase
        .from('developer_news')
        .upsert(record, { onConflict: 'canonical_url', ignoreDuplicates: true })

      if (!error) {
        inserted++
      } else {
        skipped++
      }
    }
  } catch (err: any) {
    errors.push(`Database upsert error: ${err.message}`)
  }

  // Update memory cache
  memoryCache = {
    items: items.map((it, idx) => ({
      ...it,
      id: `live-${idx}`,
      ingestedAt: now,
    })),
    lastSync: now,
  }

  return {
    success: errors.length === 0 || inserted > 0,
    sourcesQueried,
    totalFetched: items.length,
    newItemsInserted: inserted,
    duplicatesSkipped: skipped,
    lastSynchronizedAt: now,
    errors,
  }
}

/**
 * Retrieve developer news records with category filtering, search, and pagination.
 */
export async function getDeveloperNews({
  supabase,
  category,
  search,
  page = 1,
  limit = 20,
}: {
  supabase?: any
  category?: string
  search?: string
  page?: number
  limit?: number
}): Promise<{
  items: NewsItem[]
  total: number
  page: number
  limit: number
  lastSynchronizedAt: string | null
}> {
  // If Supabase client is available, attempt querying PostgreSQL table
  if (supabase) {
    try {
      let query = supabase
        .from('developer_news')
        .select('*', { count: 'exact' })
        .order('published_at', { ascending: false })

      if (category && category !== 'All') {
        query = query.eq('category', category)
      }

      if (search && search.trim()) {
        const term = search.trim()
        query = query.or(`title.ilike.%${term}%,summary.ilike.%${term}%`)
      }

      const from = (page - 1) * limit
      const to = from + limit - 1
      const { data, count, error } = await query.range(from, to)

      if (!error && data && data.length > 0) {
        return {
          items: data.map((d: any) => ({
            id: d.id,
            title: d.title,
            summary: d.summary,
            canonicalUrl: d.canonical_url,
            sourceName: d.source_name,
            sourceDomain: d.source_domain,
            publishedAt: d.published_at,
            ingestedAt: d.ingested_at,
            category: d.category,
            tags: d.tags ?? [],
            imageUrl: d.image_url,
            score: d.score ?? 0,
          })),
          total: count ?? data.length,
          page,
          limit,
          lastSynchronizedAt: data[0]?.ingested_at ?? null,
        }
      }
    } catch {
      // Fallback to live sources
    }
  }

  // Live fallback if table is empty or during local execution
  if (!memoryCache || Date.now() - new Date(memoryCache.lastSync).getTime() > 10 * 60 * 1000) {
    const { items } = await fetchNewsFromSources()
    const now = new Date().toISOString()
    memoryCache = {
      items: items.map((it, idx) => ({
        ...it,
        id: `live-${idx}`,
        ingestedAt: now,
      })),
      lastSync: now,
    }
  }

  let filtered = memoryCache.items

  if (category && category !== 'All') {
    filtered = filtered.filter((i) => i.category === category)
  }

  if (search && search.trim()) {
    const q = search.toLowerCase()
    filtered = filtered.filter(
      (i) => i.title.toLowerCase().includes(q) || i.summary.toLowerCase().includes(q)
    )
  }

  const from = (page - 1) * limit
  const paged = filtered.slice(from, from + limit)

  return {
    items: paged,
    total: filtered.length,
    page,
    limit,
    lastSynchronizedAt: memoryCache.lastSync,
  }
}
