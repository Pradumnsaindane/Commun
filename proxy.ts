import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const protectedPaths = [
  '/dashboard',
  '/projects',
  '/tasks',
  '/meetings',
  '/notes',
  '/knowledge',
  '/learning',
  '/analytics',
  '/profile',
  '/settings',
  '/saved',
  '/notifications',
  '/feed',
  '/write',
  '/community',
  '/moderation',
  '/admin',
]
const authPaths = ['/login', '/register', '/signup']

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // If Supabase environment variables are missing, allow request to proceed without throwing 500
  if (!supabaseUrl || !supabaseKey) {
    return response
  }

  try {
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookies) => {
          cookies.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    })
    const {
      data: { user },
    } = await supabase.auth.getUser()
    const pathname = request.nextUrl.pathname

    if (protectedPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`)) && !user) {
      const login = new URL('/login', request.url)
      login.searchParams.set('next', `${pathname}${request.nextUrl.search}`)
      return NextResponse.redirect(login)
    }

    if (authPaths.includes(pathname) && user) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  } catch (err) {
    console.error('Proxy auth check error:', err)
  }

  return response
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] }
