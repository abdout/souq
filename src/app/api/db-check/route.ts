import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    // Check Prisma tables
    const prismaCheck: Record<string, any> = {};
    
    try {
      const categories = await prisma.category.count();
      prismaCheck.categories = { count: categories, status: "✓" };
    } catch (e: any) {
      prismaCheck.categories = { error: e.message, status: "✗" };
    }
    
    try {
      const items = await prisma.item.count();
      prismaCheck.items = { count: items, status: "✓" };
    } catch (e: any) {
      prismaCheck.items = { error: e.message, status: "✗" };
    }
    
    try {
      const tenants = await prisma.tenant.count();
      prismaCheck.tenants = { count: tenants, status: "✓" };
    } catch (e: any) {
      prismaCheck.tenants = { error: e.message, status: "✗" };
    }
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      database: "Connected",
      prisma: prismaCheck,
      instructions: "If counts are 0, you need to seed the database"
    });
    
  } catch (error: any) {
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      database: "Failed",
      error: error.message,
      instructions: "Check DATABASE_URL environment variable"
    }, { status: 500 });
  }
}