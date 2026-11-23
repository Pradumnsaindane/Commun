'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createReply } from '@/features/discussions/api'

export function ReplyComposer({ discussionId }: { discussionId: string }) { const router = useRouter(); const [content, setContent] = useState(''); const [error, setError] = useState(''); const [saving, setSaving] = useState(false); async function submit(event: FormEvent) { event.preventDefault(); setSaving(true); setError(''); try { await createReply({ discussionId, content }); setContent(''); router.refresh() } catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'Unable to reply.') } finally { setSaving(false) } } return <form onSubmit={submit} className="mt-10 border-t border-border pt-8"><label className="mb-2 block text-sm font-medium">Add a reply</label><textarea required maxLength={5000} value={content} onChange={(event) => setContent(event.target.value)} className="min-h-32 w-full rounded-lg border border-border bg-surface px-4 py-3 outline-none focus:border-accent" placeholder="Be constructive and specific..." />{error && <p role="alert" className="mt-2 text-sm text-red-600">{error}</p>}<button disabled={saving} className="mt-3 rounded-lg bg-accent px-4 py-2.5 font-semibold text-accent-foreground disabled:opacity-50">{saving ? 'Replying…' : 'Reply'}</button></form> }
