import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Editor } from '@/components/publishing/editor'
export default async function WritePage() { const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) redirect('/login?next=/write'); return <Editor /> }

