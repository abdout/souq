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
  
  // ALWAYS skip API routes, media files, and Next.js internals
  if (pathname.startsWith('/api/') || 
      pathname.startsWith('/media/')) {
    return NextResponse.next();
  }
  
  // Extract the hostname (e.g., "delicious-bites.abdoutgroup.com")
  const hostname = req.headers.get("host") || "";
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "";

  // Handle www.abdoutgroup.com as the main domain, not a tenant
  if (hostname === `www.${rootDomain}` || hostname === rootDomain) {
    // Let it pass through to the main app routes
    return NextResponse.next();
  }

  // Handle tenant subdomains
  if (hostname.endsWith(`.${rootDomain}`)) {
    const tenantSlug = hostname.replace(`.${rootDomain}`, "");
    
    // Ignore 'www' as a tenant slug
    if (tenantSlug === "www") {
      return NextResponse.next();
    }
    
    // Rewrite the URL to include the tenant slug
    return NextResponse.rewrite(
      new URL(`/tenants/${tenantSlug}${pathname}`, req.url)
    );
  }

  return NextResponse.next();
}
