import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { headers as getHeaders } from "next/headers";

import {
  baseProcedure,
  createTRPCRouter,
  protectedProcedure,
} from "@/trpc/init";
import type { Media, Tenant } from "@/payload-types";
import { DEFAULT_LIMIT } from "@/constants";

export const libraryRouter = createTRPCRouter({
  getOne: protectedProcedure
    .input(
      z.object({
        bookId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const ordersData = await ctx.db.find({
        collection: "orders",
        limit: 1,
        pagination: false,
        where: {
          and: [
            {
              book: {
                equals: input.bookId,
              },
            },
            {
              user: {
                equals: ctx.session.user.id,
              },
            },
          ],
        },
      });
      const order = ordersData.docs[0];

      if (!order) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Order not found",
        });
      }

      const book = await ctx.db.findByID({
        collection: "items",
        id: input.bookId,
      });

      if (!book) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Book not found",
        });
      }

      return book;
    }),
  getMany: protectedProcedure
    .input(
      z.object({
        cursor: z.number().default(1),
        limit: z.number().default(DEFAULT_LIMIT),
      })
    )
    .query(async ({ ctx, input }) => {
      const ordersData = await ctx.db.find({
        collection: "orders",
        depth: 0, // We want to just get ids, without populating
        page: input.cursor,
        limit: input.limit,
        where: {
          user: {
            equals: ctx.session.user.id,
          },
        },
      });
      const bookIds = ordersData.docs.map((order) => order.book);

      const booksData = await ctx.db.find({
        collection: "items",
        pagination: false,
        where: {
          id: {
            in: bookIds,
          },
        },
      });

      const dataWithSummarizedReviews = await Promise.all(
        booksData.docs.map(async (doc) => {
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
        ...booksData,
        docs: dataWithSummarizedReviews.map((doc) => ({
          ...doc,
          image: doc.image as Media | null,
          tenant: doc.tenant as Tenant & { image: Media | null },
        })),
      };
    }),

  getBookDetails: baseProcedure
    .input(
      z.object({
        bookId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const headers = await getHeaders();
      const session = await ctx.db.auth({ headers });

      if (!session.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to view book details",
        });
      }

      try {
        // First fetch the book to check if it exists
        const book = await ctx.db.findByID({
          collection: "items",
          id: input.bookId,
          depth: 2, // Include category, tags, and tenant information
        });

        if (!book) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Book not found",
          });
        }

        // Check if user has purchased this book
        const ordersData = await ctx.db.find({
          collection: "orders",
          pagination: false,
          limit: 1,
          where: {
            and: [
              {
                book: {
                  equals: input.bookId,
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

        if (!ordersData.docs.length) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You don't have access to this book",
          });
        }

        return {
          ...book,
          image: book.image as Media | null,
          tenant: book.tenant as Tenant & { image: Media | null },
          isPurchased: true,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch book details",
          cause: error,
        });
      }
    }),
});
