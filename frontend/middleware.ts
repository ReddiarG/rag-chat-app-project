import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Get the pathname
  const path = request.nextUrl.pathname

  // Check if the path is protected
  const isProtectedPath = path.startsWith("/chat")

  // Get the token from the cookies
  const token = request.cookies.get("token")?.value || ""

  // If the path is protected and there's no token, redirect to the login page
  if (isProtectedPath && !token) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  // If the path is the login page and there's a token, redirect to the chat page
  if (path === "/" && token) {
    return NextResponse.redirect(new URL("/chat", request.url))
  }

  return NextResponse.next()
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: ["/", "/chat/:path*"],
}
