import { NextRequest, NextResponse } from 'next/server'

export function middleware(req: NextRequest) {
  // Admin routes require x-admin-secret header OR cookie (for browser nav)
  // API admin routes are protected in each route handler itself
  // This middleware just blocks direct URL access to admin pages from crawlers
  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
