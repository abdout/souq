import { baseProcedure, createTRPCRouter } from "@/trpc/init";
import z from "zod";
import type { Where, Sort } from "payload";
import { Category, Media, Tenant } from "@/payload-types";
import { sortValues } from "../search-params";
import { DEFAULT_LIMIT } from "@/constants";
import { headers as getHeaders } from "next/headers";
import { TRPCError } from "@trpc/server";

export const booksRouter = createTRPCRouter({
  getOne: baseProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const headers = await getHeaders();
      const session = await ctx.db.auth({ headers });

      const book = await ctx.db.findByID({
        collection: "items",
        id: input.id,
        depth: 2, // Load book.image, book.tenant and book.tenant.image
        select: {
          content: false,
        },
      });

      if (book.isArchived) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Book not found",
        });
      }

      let isPurchased = false;

      if (session.user) {
        const ordersData = await ctx.db.find({
          collection: "orders",
          pagination: false,
          limit: 1,
          where: {
            and: [
              {
                book: {
                  equals: input.id,
                },
              },
              {
                user: {
                  equals: session.user.id,
                },
              },
            ],
          },
        });
        isPurchased = !!ordersData.docs[0];
      }

      const reviews = await ctx.db.find({
        collection: "reviews",
        pagination: false,
        where: {
          book: {
            equals: input.id,
          },
        },
      });

      const reviewRating =
        reviews.docs.length > 0
          ? Math.round(
              (reviews.docs.reduce((acc, review) => acc + review.rating, 0) /
                reviews.totalDocs) *
                10
            ) / 10
          : 0;

      const ratingDistribution: Record<number, number> = {
        5: 0,
        4: 0,
        3: 0,
        2: 0,
        1: 0,
      };

      if (reviews.totalDocs > 0) {
        reviews.docs.forEach((review) => {
          const rating = review.rating;

          if (rating >= 1 && rating <= 5) {
            ratingDistribution[rating] = (ratingDistribution[rating] || 0) + 1;
          }
        });

        Object.keys(ratingDistribution).forEach((key) => {
          const rating = Number(key);
          const count = ratingDistribution[rating] || 0;
          ratingDistribution[rating] = Math.round(
            (count / reviews.totalDocs) * 100
          );
        });
      }

      return {
        ...book,
        isPurchased,
        image: book.image as Media | null,
        tenant: book.tenant as Tenant & { image: Media | null },
        reviewRating,
        reviewCount: reviews.totalDocs,
        ratingDistribution,
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
        sort: z.enum(sortValues).nullable().optional(),
        tenantSlug: z.string().nullable().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: Where = {
        isArchived: {
          not_equals: true,
        },
      };

      if (input.minPrice && input.maxPrice) {
        where.price = {
          greater_than_equal: input.minPrice,
          less_than_equal: input.maxPrice,
        };
      } else if (input.minPrice) {
        where.price = {
          greater_than_equal: input.minPrice,
        };
      } else if (input.maxPrice) {
        where.price = {
          ...where.price,
          less_than_equal: input.maxPrice,
        };
      }

      if (input.tenantSlug) {
        where["tenant.slug"] = {
          equals: input.tenantSlug,
        };
      } else {
        // If we are loading books for public storefront (no tenantSlug)
        // Make sure to not load products set to "isPrivate: true" (using reverse not_equals logic)
        // There products are exclusively private to the tenant store
        where["isPrivate"] = {
          not_equals: true,
        };
      }

      if (input.category) {
        const categoriesData = await ctx.db.find({
          collection: "categories",
          limit: 1,
          depth: 1, // Populate subcategories, subcategories[0] will be a type of "Category"
          pagination: false,
          where: {
            slug: {
              equals: input.category,
            },
          },
        });

        console.log(JSON.stringify(categoriesData), null, 2);
        const formattedData = categoriesData.docs.map((doc) => ({
          ...doc,
          subcategories: (doc.subcategories?.docs ?? []).map((doc) => ({
            // Because of "depth: 1" we are confident "doc" will be a type of "Category"
            ...(doc as Category),
            subcategories: undefined,
          })),
        }));

        const subcategoriesSlugs = [];
        const parentCategory = formattedData[0];

        if (parentCategory) {
          subcategoriesSlugs.push(
            ...parentCategory.subcategories.map(
              (subcategory) => subcategory.slug
            )
          );
          where["category.slug"] = {
            in: [parentCategory.slug, ...subcategoriesSlugs],
          };
        }
      }

      if (input.tags && input.tags.length > 0) {
        where["tags.name"] = {
          in: input.tags,
        };
      }

      if (input.search) {
        where["name"] = {
          like: input.search,
        };
      }

      let sort: Sort = "-createdAt";
      if (input.sort === "curated") {
        sort = "-createdAt";
      } else if (input.sort === "hot_and_new") {
        sort = "-createdAt";
      } else if (input.sort === "trending") {
        sort = "+createdAt";
      }

      const data = await ctx.db.find({
        collection: "items",
        depth: 2, // Populate "category", "image", "tenant"
        where,
        sort,
        page: input.cursor,
        limit: input.limit,
        select: {
          content: false,
        },
      });

      const dataWithSummarizedReviews = await Promise.all(
        data.docs.map(async (doc) => {
          const reviewsData = await ctx.db.find({
            collection: "reviews",
            pagination: false,
            where: {
              book: {
                equals: doc.id,
              },
            },
          });

          return {
            ...doc,
            reviewCount: reviewsData.totalDocs,
            reviewRating:
              reviewsData.docs.length === 0
                ? 0
                : Math.round(
                    (reviewsData.docs.reduce(
                      (acc, review) => acc + review.rating,
                      0
                    ) /
                      reviewsData.totalDocs) *
                      10
                  ) / 10,
          };
        })
      );

      return {
        ...data,
        docs: dataWithSummarizedReviews.map((doc) => ({
          ...doc,
          image: doc.image as Media | null,
          tenant: doc.tenant as Tenant & { image: Media | null },
        })),
      };
    }),
});
