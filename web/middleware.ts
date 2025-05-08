import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// This middleware ensures proper handling of the base path and language routes
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''
  
  // Handle root path redirects
  if (pathname === '/' || pathname === basePath || pathname === `${basePath}/`) {
    return NextResponse.redirect(new URL(`${basePath}/en`, request.url))
  }

  // Continue with the request
  return NextResponse.next()
}

// Configure middleware to run on specific paths
export const config = {
  matcher: [
    // Skip all internal paths (_next, api, etc)
    '/((?!_next/|_vercel|api/).*)',
    // Optional: Add specific paths that need middleware
    '/'
  ],
}
