import superjson from "superjson";
import { initTRPC, TRPCError } from "@trpc/server";
import { cache } from "react";

export const createTRPCContext = cache(async () => {
  /**
   * @see: https://trpc.io/docs/server/context
   */
  return { userId: "user_123" };
});
// Avoid exporting the entire t-object
// since it's not very descriptive.
// For instance, the use of a t variable
// is common in i18n libraries.
const t = initTRPC.create({
  /**
   * @see https://trpc.io/docs/server/data-transformers
   */
  transformer: superjson,
});
// Base router and procedure helpers
export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
export const baseProcedure = t.procedure.use(async ({ next }) => {
  // Skip Payload initialization since we're using Prisma for most operations
  // The Payload instance is only needed for specific admin operations
  console.log("[baseProcedure] Using Prisma for database operations");
  
  return next({ 
    ctx: {
      // db field removed - procedures will use prisma directly
    }
  });
});

export const protectedProcedure = baseProcedure.use(async ({ ctx, next }) => {
  // For now, we'll skip authentication since we're not using Payload
  // TODO: Implement proper authentication with NextAuth or similar
  
  return next({
    ctx: {
      ...ctx,
      session: {
        user: null, // No authentication for now
      },
    },
  });
});
