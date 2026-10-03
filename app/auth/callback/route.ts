import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { safeNextPath } from '@/lib/auth'

export async function GET(request: Request) { const url = new URL(request.url); const code = url.searchParams.get('code'); const next = url.searchParams.get('next'); if (code) { const supabase = await createClient(); await supabase.auth.exchangeCodeForSession(code) } return NextResponse.redirect(new URL(safeNextPath(next) === '/feed' ? '/onboarding' : safeNextPath(next), url.origin)) }
