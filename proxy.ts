import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { hasSupabaseConfiguration } from '@/lib/env'

const protectedPaths = [
  '/dashboard',
  '/projects',
  '/tasks',
  '/calendar',
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
  '/compose',
  '/write',
  '/community',
  '/moderation',
  '/admin',
]
const authPaths = ['/login', '/register', '/signup']

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })
  const pathname = request.nextUrl.pathname
  const isProtected = protectedPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  )
  const loginRedirect = () => {
    const login = new URL('/login', request.url)
    login.searchParams.set('next', `${pathname}${request.nextUrl.search}`)
    return NextResponse.redirect(login)
  }

  // Without a real Supabase project, no session can be trusted. Fail closed on
  // protected pages instead of silently skipping the auth gate. The previous
  // behaviour treated `.env.example` placeholders as configured and either
  // performed pointless DNS lookups or let requests continue after an error.
  if (!hasSupabaseConfiguration()) {
    return isProtected ? loginRedirect() : response
  }

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll: (cookies) => {
            cookies.forEach(({ name, value }) => request.cookies.set(name, value))
            response = NextResponse.next({ request })
            cookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
          },
        },
      }
    )
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (isProtected && !user) {
      return loginRedirect()
    }

    if (authPaths.includes(pathname) && user) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  } catch (err) {
    console.error('Proxy auth check error:', err)
    // A failed auth check must not expose protected pages. Public pages keep
    // rendering so an outage does not take down the entire marketing surface.
    if (isProtected) return loginRedirect()
  }

  return response
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] }
