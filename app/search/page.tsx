import { Suspense } from 'react'
import { SearchInterface } from '@/components/search/search-interface'

export default function SearchPage() { return <Suspense fallback={<div className="p-10 text-sm text-muted">Loading search…</div>}><SearchInterface /></Suspense> }
