import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    // Test categories endpoint
    const categories = await prisma.category.findMany({
      where: {
        tenantId: null, // Global categories
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Test items endpoint  
    const items = await prisma.item.findMany({
      where: {
        isActive: true,
      },
      take: 10,
      include: {
        tenant: true,
        category: true,
        _count: {
          select: { reviews: true },
        },
      },
    });

    // Format for books.getMany compatibility
    const formattedItems = {
      docs: items.map(item => ({
        id: item.id,
        name: item.name,
        slug: item.slug,
        description: item.description,
        price: item.price,
        image: item.image,
        businessType: item.businessType,
        inventory: item.inventory,
        isActive: item.isActive,
        isFeatured: item.isFeatured,
        tenant: item.tenant,
        category: item.category,
        reviewCount: item._count.reviews,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      })),
      totalDocs: items.length,
      limit: 10,
      totalPages: 1,
      page: 1,
      pagingCounter: 1,
      hasPrevPage: false,
      hasNextPage: false,
      prevPage: null,
      nextPage: null,
    };

    return NextResponse.json({
      success: true,
      categories: categories.map(cat => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        image: cat.image,
        businessType: cat.businessType,
        createdAt: cat.createdAt.toISOString(),
        updatedAt: cat.updatedAt.toISOString(),
        subcategories: [],
      })),
      items: formattedItems,
    });
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    }, { status: 500 });
  }
}