import { NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";

export async function GET() {
  const checks: Record<string, any> = {
    timestamp: new Date().toISOString(),
    env: {
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_URI: process.env.DATABASE_URI ? "✓ Set" : "✗ Missing",
      DATABASE_URL: process.env.DATABASE_URL ? "✓ Set" : "✗ Missing",
      PAYLOAD_SECRET: process.env.PAYLOAD_SECRET ? "✓ Set" : "✗ Missing",
      BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN ? "✓ Set" : "✗ Missing",
    },
  };

  try {
    // Test Payload connection
    const payload = await getPayload({ config });
    
    // Try to fetch categories
    const categories = await payload.find({
      collection: "categories",
      limit: 1,
    });
    
    checks.payload = {
      status: "✓ Connected",
      categoriesCount: categories.totalDocs,
    };
    
    // Try to fetch items
    const items = await payload.find({
      collection: "items",
      limit: 1,
    });
    
    checks.items = {
      status: "✓ Connected",
      itemsCount: items.totalDocs,
    };
    
  } catch (error: any) {
    checks.payload = {
      status: "✗ Failed",
      error: error.message || "Unknown error",
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    };
  }

  return NextResponse.json(checks, {
    status: checks.payload?.status?.includes("✓") ? 200 : 500,
  });
}