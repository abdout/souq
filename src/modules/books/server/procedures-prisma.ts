import { createTRPCRouter, baseProcedure } from "@/trpc/init";
import { prisma } from "@/lib/db";
import z from "zod";
import { DEFAULT_LIMIT } from "@/constants";

export const booksRouter = createTRPCRouter({
  getOne: baseProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .query(async ({ input }) => {
      const item = await prisma.item.findUnique({
        where: { id: input.id },
        include: {
          tenant: true,
          category: true,
          reviews: {
            include: {
              user: {
                select: {
                  name: true,
                  image: true,
                },
              },
            },
          },
        },
      });

      if (!item || !item.isActive) {
        throw new Error("Item not found");
      }

      const reviewRating = item.reviews.length > 0
        ? item.reviews.reduce((acc, r) => acc + r.rating, 0) / item.reviews.length
        : 0;

      return {
        ...item,
        reviewRating,
        reviewCount: item.reviews.length,
        isPurchased: false, // TODO: Check if user has purchased
      };
    }),

  getMany: baseProcedure
    .input(
      z.object({
        cursor: z.number().default(1),
        limit: z.number().default(DEFAULT_LIMIT),
        search: z.string().nullable().optional(),
        category: z.string().nullable().optional(),
        minPrice: z.string().nullable().optional(),
        maxPrice: z.string().nullable().optional(),
        tags: z.array(z.string()).nullable().optional(),
        sort: z.enum(["newest", "price-low", "price-high", "rating", "popular"]).nullable().optional(),
        tenantSlug: z.string().nullable().optional(),
      })
    )
    .query(async ({ input }) => {
      const { cursor, limit, search, category, minPrice, maxPrice, tenantSlug, sort } = input;
      const skip = (cursor - 1) * limit;

      // Build where clause
      const where: any = {
        isActive: true,
      };

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (category) {
        where.category = { slug: category };
      }

      if (tenantSlug) {
        where.tenant = { slug: tenantSlug };
      }

      if (minPrice || maxPrice) {
        where.price = {};
        if (minPrice) where.price.gte = parseFloat(minPrice);
        if (maxPrice) where.price.lte = parseFloat(maxPrice);
      }

      // Build orderBy
      let orderBy: any = { createdAt: 'desc' };
      if (sort === 'price-low') orderBy = { price: 'asc' };
      if (sort === 'price-high') orderBy = { price: 'desc' };

      // Get items
      const [items, totalCount] = await Promise.all([
        prisma.item.findMany({
          where,
          skip,
          take: limit,
          orderBy,
          include: {
            tenant: true,
            category: true,
            _count: {
              select: { reviews: true },
            },
          },
        }),
        prisma.item.count({ where }),
      ]);

      const hasNextPage = skip + items.length < totalCount;
      const nextCursor = hasNextPage ? cursor + 1 : null;

      // Format for compatibility
      const docs = items.map(item => ({
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
      }));

      return {
        docs,
        totalDocs: totalCount,
        limit,
        totalPages: Math.ceil(totalCount / limit),
        page: cursor,
        pagingCounter: skip + 1,
        hasPrevPage: cursor > 1,
        hasNextPage,
        prevPage: cursor > 1 ? cursor - 1 : null,
        nextPage: nextCursor,
      };
    }),
});