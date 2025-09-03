import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protected routes that require authentication
  const protectedPaths = [
    '/',
    '/receipts',
    '/properties',
    '/rooms',
    '/profile',
    '/api',
  ]

  // Check if the current path is protected
  const isProtectedPath = protectedPaths.some(path =>
    path === '/'
      ? request.nextUrl.pathname === path
      : request.nextUrl.pathname.startsWith(path)
  )

  // Auth routes (should redirect to home if already logged in)
  const authPaths = ['/auth', '/auth/signup', '/auth/login']
  const isAuthPath = authPaths.some(path =>
    request.nextUrl.pathname.startsWith(path)
  )

  // If user is not logged in and trying to access protected route
  if (!user && isProtectedPath) {
    // Special handling for API routes - return 401 instead of redirect
    if (request.nextUrl.pathname.startsWith('/api')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Redirect to auth page with return URL
    const url = request.nextUrl.clone()
    url.pathname = '/auth'
    url.searchParams.set('returnUrl', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  // If user is logged in and trying to access auth pages
  if (user && isAuthPath) {
    // Get return URL from query params or default to home
    const returnUrl = request.nextUrl.searchParams.get('returnUrl') || '/'
    const url = request.nextUrl.clone()
    url.pathname = returnUrl
    url.searchParams.delete('returnUrl')
    return NextResponse.redirect(url)
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object here instead of the supabaseResponse object

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - /auth/callback (Supabase auth callback)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|auth/callback).*)',
  ],
}
