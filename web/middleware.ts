import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// 定义我们支持的语言
const locales = ["en", "zh"]
const defaultLocale = "en"

export function middleware(request: NextRequest) {
  // 检查路径中是否已有支持的语言
  const { pathname } = request.nextUrl

  // 检查路径是否已包含语言
  const pathnameHasLocale = locales.some((locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`)

  if (pathnameHasLocale) return

  // 如果没有语言，进行重定向
  request.nextUrl.pathname = `/${defaultLocale}${pathname}`
  return NextResponse.redirect(request.nextUrl)
}

export const config = {
  matcher: [
    // 跳过所有内部路径 (_next)
    "/((?!_next|api|favicon.ico).*)",
  ],
}
