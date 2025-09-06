import { NextRequest, NextResponse } from "next/server";

export const config = {
  matcher: [
    /*
     * Match all paths except for:
     * 1. /_next (Next.js internals)
     * 2. /_static (inside /public)
     * 3. all root files inside /public (e.g. /favicon.ico)
     * Note: We now handle /api routes inside the middleware
     */
    "/((?!_next/|_static/|_vercel|[\w-]+\.\w+).*)",
  ],
};

export default async function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const pathname = url.pathname;
  const hostname = req.headers.get("host") || "";
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "";
  
  // Debug logging
  console.log(`[Middleware] Processing request:`, {
    hostname,
    pathname,
    rootDomain,
    isApiRoute: pathname.startsWith('/api/'),
    isMediaRoute: pathname.startsWith('/media/'),
  });
  
  // ALWAYS skip API routes, media files, and Next.js internals
  if (pathname.startsWith('/api/') || 
      pathname.startsWith('/media/')) {
    console.log(`[Middleware] Skipping rewrite for API/media route: ${pathname}`);
    return NextResponse.next();
  }

  // Handle www.abdoutgroup.com as the main domain, not a tenant
  if (hostname === `www.${rootDomain}` || hostname === rootDomain) {
    console.log(`[Middleware] Main domain detected, no rewrite needed`);
    return NextResponse.next();
  }

  // Handle tenant subdomains
  if (hostname.endsWith(`.${rootDomain}`)) {
    const tenantSlug = hostname.replace(`.${rootDomain}`, "");
    
    // Ignore 'www' as a tenant slug
    if (tenantSlug === "www") {
      console.log(`[Middleware] Skipping www subdomain`);
      return NextResponse.next();
    }
    
    // Rewrite the URL to include the tenant slug
    const rewriteUrl = `/tenants/${tenantSlug}${pathname}`;
    console.log(`[Middleware] Rewriting tenant subdomain: ${pathname} -> ${rewriteUrl}`);
    return NextResponse.rewrite(
      new URL(rewriteUrl, req.url)
    );
  }

  console.log(`[Middleware] No matching conditions, passing through`);
  return NextResponse.next();
}
