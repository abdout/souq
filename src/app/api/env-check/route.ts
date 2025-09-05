import { NextResponse } from "next/server";

export async function GET() {
  // List all critical environment variables
  const envVars = [
    "DATABASE_URI",
    "DATABASE_URL", 
    "PAYLOAD_SECRET",
    "BLOB_READ_WRITE_TOKEN",
    "NEXT_PUBLIC_APP_URL",
    "NEXT_PUBLIC_ROOT_DOMAIN",
    "NEXT_PUBLIC_ENABLE_SUBDOMAIN_ROUTING",
    "NODE_ENV"
  ];

  const result: Record<string, string> = {};
  
  for (const varName of envVars) {
    const value = process.env[varName];
    if (value) {
      // Mask sensitive values but show they exist
      if (varName.includes("SECRET") || varName.includes("TOKEN") || varName.includes("DATABASE")) {
        result[varName] = value.substring(0, 10) + "..." + (value.length > 10 ? " (length: " + value.length + ")" : "");
      } else {
        result[varName] = value;
      }
    } else {
      result[varName] = "❌ NOT SET";
    }
  }

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    environment: result,
    instructions: "Please set all missing environment variables in Vercel dashboard"
  });
}