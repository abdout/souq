import { NextRequest, NextResponse } from "next/server";

export const config = {
  matcher: [
    /*
     * Match all paths except for:
     * 1. /api routes
     * 2. /_next (Next.js internals)
     * 3. /_static (inside /public)
     * 4. all root files inside /public (e.g. /favicon.ico)
     */
    "/((?!api/|_next/|_static/|_vercel|media/|[\w-]+\.\w+).*)",
  ],
};

export default async function middleware(req: NextRequest) {
  const url = req.nextUrl;
  // Extract the hostname (e.g., "hien.lexi.com" or "hien.localhost:3000")
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
    return NextResponse.rewrite(
      new URL(`/tenants/${tenantSlug}${url.pathname}`, req.url)
    );
  }

  return NextResponse.next();
}
