import { z } from "zod";
import { createTRPCRouter, protectedProcedure, baseProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import { prisma } from "@/lib/db";

export const itemsRouter = createTRPCRouter({
  // Get single item with stock status and availability
  getOne: baseProcedure
    .input(
      z.object({
        id: z.string(),
        tenantSlug: z.string().optional(),
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
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
      });

      if (!item || !item.isActive) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Item not found or unavailable",
        });
      }

      // Check if tenant is active
      if (!item.tenant.isActive) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Merchant is currently not accepting orders",
        });
      }

      // Calculate stock status
      const isOutOfStock = item.trackInventory && item.inventory <= 0;
      const isLowStock = item.trackInventory && item.inventory <= item.lowStockThreshold && item.inventory > 0;

      // Calculate review stats
      const reviewCount = item.reviews.length;
      const averageRating = reviewCount > 0 
        ? item.reviews.reduce((sum, review) => sum + review.rating, 0) / reviewCount
        : 0;

      return {
        ...item,
        stockStatus: {
          isOutOfStock,
          isLowStock,
          inventory: item.trackInventory ? item.inventory : null,
          lowStockThreshold: item.lowStockThreshold,
        },
        reviewStats: {
          count: reviewCount,
          averageRating: Math.round(averageRating * 10) / 10,
        },
        reviews: item.reviews.map(review => ({
          ...review,
          user: review.user,
        })),
      };
    }),

  // Get many items with filtering and stock status
  getMany: baseProcedure
    .input(
      z.object({
        cursor: z.number().default(1),
        limit: z.number().default(12),
        search: z.string().optional(),
        categorySlug: z.string().optional(),
        businessType: z.enum(["food", "medicine", "grocery"]).optional(),
        tenantSlug: z.string().optional(),
        minPrice: z.number().optional(),
        maxPrice: z.number().optional(),
        sort: z.enum(["newest", "price-low", "price-high", "rating", "popular", "distance"]).default("newest"),
        includeOutOfStock: z.boolean().default(true), // For merchant views
        onlyInStock: z.boolean().default(false), // For customer views
        currentlyDelivering: z.boolean().default(false), // Show only merchants accepting orders now
        userLocation: z.object({
          lat: z.number(),
          lng: z.number(),
        }).optional(), // For distance-based sorting and filtering
      })
    )
    .query(async ({ input }) => {
      const {
        cursor,
        limit,
        search,
        categorySlug,
        businessType,
        tenantSlug,
        minPrice,
        maxPrice,
        sort,
        includeOutOfStock,
        onlyInStock,
      } = input;

      // Build where clause
      const where: Record<string, any> = {
        isActive: true,
        tenant: {
          isActive: true,
        },
      };

      // Stock filtering
      if (onlyInStock && !includeOutOfStock) {
        where.OR = [
          { trackInventory: false }, // Items not tracked are always available
          { 
            AND: [
              { trackInventory: true },
              { inventory: { gt: 0 } }
            ]
          }
        ];
      }

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (categorySlug) {
        where.category = { slug: categorySlug };
      }

      if (businessType) {
        where.businessType = businessType;
      }

      if (tenantSlug) {
        where.tenant = { slug: tenantSlug };
      }

      if (minPrice !== undefined || maxPrice !== undefined) {
        where.price = {};
        if (minPrice !== undefined) where.price.gte = minPrice;
        if (maxPrice !== undefined) where.price.lte = maxPrice;
      }

      // Build orderBy clause
      let orderBy: Record<string, any> = { createdAt: 'desc' }; // default: newest
      
      switch (sort) {
        case 'price-low':
          orderBy = { price: 'asc' };
          break;
        case 'price-high':
          orderBy = { price: 'desc' };
          break;
        case 'rating':
          // We'll handle this after the query since we need to calculate averages
          orderBy = { createdAt: 'desc' };
          break;
        case 'popular':
          // Based on number of reviews for now
          orderBy = { createdAt: 'desc' };
          break;
      }

      // Calculate pagination
      const skip = (cursor - 1) * limit;

      const [items, totalCount] = await Promise.all([
        prisma.item.findMany({
          where,
          include: {
            tenant: {
              select: {
                id: true,
                name: true,
                slug: true,
                businessType: true,
                isActive: true,
                image: true,
              },
            },
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
            reviews: {
              select: {
                rating: true,
              },
            },
            _count: {
              select: {
                reviews: true,
                orderItems: true,
              },
            },
          },
          orderBy,
          skip,
          take: limit,
        }),
        prisma.item.count({ where }),
      ]);

      // Process items to add stock status and review stats
      const processedItems = items.map(item => {
        const isOutOfStock = item.trackInventory && item.inventory <= 0;
        const isLowStock = item.trackInventory && item.inventory <= item.lowStockThreshold && item.inventory > 0;
        
        const reviewCount = item._count.reviews;
        const averageRating = reviewCount > 0 
          ? item.reviews.reduce((sum, review) => sum + review.rating, 0) / reviewCount
          : 0;

        return {
          ...item,
          stockStatus: {
            isOutOfStock,
            isLowStock,
            inventory: item.trackInventory ? item.inventory : null,
          },
          reviewStats: {
            count: reviewCount,
            averageRating: Math.round(averageRating * 10) / 10,
          },
          orderCount: item._count.orderItems,
          reviews: undefined, // Remove full reviews from list view
          _count: undefined, // Clean up the count object
        };
      });

      // Sort by rating if requested (now that we have calculated ratings)
      const finalItems = sort === 'rating' 
        ? processedItems.sort((a, b) => b.reviewStats.averageRating - a.reviewStats.averageRating)
        : sort === 'popular'
        ? processedItems.sort((a, b) => b.orderCount - a.orderCount)
        : processedItems;

      const hasNextPage = skip + limit < totalCount;
      const hasPrevPage = cursor > 1;

      return {
        items: finalItems,
        pagination: {
          currentPage: cursor,
          totalPages: Math.ceil(totalCount / limit),
          totalCount,
          hasNextPage,
          hasPrevPage,
          limit,
        },
      };
    }),

  // Update item stock (merchant only)
  updateStock: protectedProcedure
    .input(
      z.object({
        itemId: z.string(),
        inventory: z.number().min(0),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user owns this item's tenant
      const item = await prisma.item.findUnique({
        where: { id: input.itemId },
        include: {
          tenant: {
            include: {
              users: {
                where: {
                  userId: ctx.session.user.id,
                },
              },
            },
          },
        },
      });

      if (!item) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Item not found",
        });
      }

      if (item.tenant.users.length === 0) {
        throw new TRPCError({
          code: "FORBIDDEN", 
          message: "You don't have permission to update this item",
        });
      }

      const updatedItem = await prisma.item.update({
        where: { id: input.itemId },
        data: {
          inventory: input.inventory,
        },
        include: {
          tenant: true,
        },
      });

      return {
        success: true,
        item: updatedItem,
        stockStatus: {
          isOutOfStock: updatedItem.trackInventory && updatedItem.inventory <= 0,
          isLowStock: updatedItem.trackInventory && updatedItem.inventory <= updatedItem.lowStockThreshold,
        },
      };
    }),

  // Toggle item availability
  toggleAvailability: protectedProcedure
    .input(
      z.object({
        itemId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check ownership (same as updateStock)
      const item = await prisma.item.findUnique({
        where: { id: input.itemId },
        include: {
          tenant: {
            include: {
              users: {
                where: {
                  userId: ctx.session.user.id,
                },
              },
            },
          },
        },
      });

      if (!item || item.tenant.users.length === 0) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to update this item",
        });
      }

      const updatedItem = await prisma.item.update({
        where: { id: input.itemId },
        data: {
          isActive: !item.isActive,
        },
      });

      return {
        success: true,
        isActive: updatedItem.isActive,
        message: updatedItem.isActive ? "Item is now available" : "Item is now unavailable",
      };
    }),
});