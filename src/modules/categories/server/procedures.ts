import { createTRPCRouter, baseProcedure } from "@/trpc/init";
import { prisma } from "@/lib/db";

export const categoriesRouter = createTRPCRouter({
  getMany: baseProcedure.query(async () => {
    // Get all categories (for now, return all without parent-child relationship)
    const categories = await prisma.category.findMany({
      where: {
        tenantId: null, // Global categories
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Format for compatibility with existing frontend
    const formattedData = categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      image: cat.image,
      businessType: cat.businessType,
      createdAt: cat.createdAt.toISOString(),
      updatedAt: cat.updatedAt.toISOString(),
      subcategories: [], // No subcategories for now
    }));

    return formattedData;
  }),
});
