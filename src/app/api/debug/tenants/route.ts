import { NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");
  
  const debug: Record<string, any> = {
    timestamp: new Date().toISOString(),
    requestedSlug: slug || "none",
    env: {
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_URI: process.env.DATABASE_URI ? "✓ Set" : "✗ Missing",
      PAYLOAD_SECRET: process.env.PAYLOAD_SECRET ? "✓ Set" : "✗ Missing",
      NEXT_PUBLIC_ROOT_DOMAIN: process.env.NEXT_PUBLIC_ROOT_DOMAIN,
    },
  };

  try {
    // Test Payload connection
    const payload = await getPayload({ config });
    debug.payloadConnection = "✓ Connected";
    
    // Fetch all tenants
    const allTenants = await payload.find({
      collection: "tenants",
      limit: 100,
    });
    
    debug.tenants = {
      total: allTenants.totalDocs,
      slugs: allTenants.docs.map(t => ({
        id: t.id,
        name: t.name,
        slug: t.slug,
        businessType: t.businessType,
        isActive: t.isActive,
      })),
    };
    
    // If a specific slug was requested, try to find it
    if (slug) {
      try {
        const specificTenant = await payload.find({
          collection: "tenants",
          where: {
            slug: {
              equals: slug,
            },
          },
        });
        
        debug.requestedTenant = {
          found: specificTenant.docs.length > 0,
          data: specificTenant.docs[0] || null,
        };
      } catch (error: any) {
        debug.requestedTenant = {
          found: false,
          error: error.message || "Unknown error",
        };
      }
    }
    
  } catch (error: any) {
    debug.payloadConnection = "✗ Failed";
    debug.error = {
      message: error.message || "Unknown error",
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    };
  }

  return NextResponse.json(debug, {
    status: debug.payloadConnection === "✓ Connected" ? 200 : 500,
  });
}