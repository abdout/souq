import { baseProcedure, createTRPCRouter } from "@/trpc/init";
import { prisma } from "@/lib/db";
import { TRPCError } from "@trpc/server";
import { loginSchema, registerSchema } from "../schemas";

export const authRouter = createTRPCRouter({
  session: baseProcedure.query(async () => {
    // Return a mock session for now
    // TODO: Implement proper authentication
    return {
      user: null,
      permissions: {
        collections: {
          users: { read: true, create: true, update: true, delete: true },
          items: { read: true, create: true, update: true, delete: true },
          categories: { read: true, create: true, update: true, delete: true },
        }
      }
    };
  }),
  
  register: baseProcedure
    .input(registerSchema)
    .mutation(async ({ input }) => {
      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { email: input.username }, // Using username as email for now
      });

      if (existingUser) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Username already taken",
        });
      }

      // Create new user
      const user = await prisma.user.create({
        data: {
          email: input.username,
          name: input.fullName,
        },
      });

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      };
    }),
    
  login: baseProcedure
    .input(loginSchema)
    .mutation(async ({ input }) => {
      // Find user
      const user = await prisma.user.findUnique({
        where: { email: input.username }, // Using username as email for now
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      // TODO: Implement proper password checking
      // For now, just return success
      
      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      };
    }),
    
  logout: baseProcedure.mutation(async () => {
    // TODO: Implement proper logout
    return {
      success: true,
    };
  }),
});