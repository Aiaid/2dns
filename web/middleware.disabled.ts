// Middleware is disabled because it cannot be used with "output: export"
// The redirection logic is handled by the root page.tsx using client-side redirection
// See web/app/page.tsx for the implementation

/*
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Middleware disabled - see comment above
  return NextResponse.next()
}

export const config = {
  matcher: []
}
*/
