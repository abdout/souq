import { z } from "zod";

import { Media } from "@/payload-types";
import { Tenant, Book, Order } from "@/types/payload-extensions";
import {
  baseProcedure,
  createTRPCRouter,
  protectedProcedure,
} from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import type Stripe from "stripe";
import { ItemMetadata, CheckoutMetadata } from "../type";
import { stripe } from "@/lib/stripe";
import { PLATFORM_FEE_PERCENTAGE } from "@/constants";
import { generateTenantURL } from "@/lib/utils";

export const checkoutRouter = createTRPCRouter({
  verify: protectedProcedure.mutation(async ({ ctx }) => {
    const user = await ctx.db.findByID({
      collection: "users",
      id: ctx.session.user.id,
      depth: 0, // user.tenants[0].tenant is going to be a string (tenant ID)
    });

    const tenantId = user.tenants?.[0]?.tenant as string; // This is an id because of depth: 0
    const tenant = await ctx.db.findByID({
      collection: "tenants",
      id: tenantId,
    });

    if (!tenant) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Tenant not found",
      });
    }
    const accountLink = await stripe.accountLinks.create({
      account: tenant.stripeAccountId,
      refresh_url: `${process.env.NEXT_PUBLIC_APP_URL!}/admin`,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL!}/admin`,
      type: "account_onboarding",
    });

    if (!accountLink.url) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Failed to create verification link",
      });
    }

    return { url: accountLink.url };
  }),
  purchase: protectedProcedure
    .input(
      z.object({
        itemIds: z.array(z.string()).min(1),
        tenantSlug: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const items = await ctx.db.find({
        collection: "items",
        depth: 2,
        where: {
          and: [
            {
              id: {
                in: input.itemIds,
              },
            },
            {
              "tenant.slug": {
                equals: input.tenantSlug,
              },
            },
            {
              isArchived: {
                not_equals: true,
              },
            },
          ],
        },
      });

      if (items.totalDocs !== input.itemIds.length) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Items not found" });
      }

      const tenantsData = await ctx.db.find({
        collection: "tenants",
        limit: 1,
        pagination: false,
        where: {
          slug: {
            equals: input.tenantSlug,
          },
        },
      });

      const tenant = tenantsData.docs[0];

      if (!tenant) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Tenant not found",
        });
      }

      if (!tenant.stripeDetailsSubmitted) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Tenant not allowed to sell items until Stripe verification is complete",
        });
      }

      const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] =
        items.docs.map((item) => ({
          quantity: 1,
          price_data: {
            unit_amount: item.price * 100, // Stripe handles prices in cents
            currency: "usd",
            product_data: {
              name: item.name,
              metadata: {
                stripeAccountId: tenant.stripeAccountId,
                id: item.id,
                name: item.name,
                price: item.price,
              } as ItemMetadata,
            },
          },
        }));

      const totalAmount = items.docs.reduce(
        (acc, item) => acc + item.price * 100,
        0
      );

      const platformFeeAmount = Math.round(
        totalAmount * (PLATFORM_FEE_PERCENTAGE / 100)
      );

      const domain = generateTenantURL(input.tenantSlug);

      const checkout = await stripe.checkout.sessions.create(
        {
          customer_email: ctx.session.user.email,
          success_url: `${domain}/checkout?success=true`,
          cancel_url: `${domain}/checkout?cancel=true`,
          mode: "payment",
          line_items: lineItems,
          invoice_creation: {
            enabled: true,
          },
          metadata: {
            userId: ctx.session.user.id,
          } as CheckoutMetadata,
          payment_intent_data: {
            application_fee_amount: platformFeeAmount,
          },
        },
        {
          stripeAccount: tenant.stripeAccountId,
        }
      );

      if (!checkout.url) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create checkout session",
        });
      }

      return { url: checkout.url };
    }),
  getItems: baseProcedure
    .input(
      z.object({
        ids: z.array(z.string()),
      })
    )
    .query(async ({ ctx, input }) => {
      const data = await ctx.db.find({
        collection: "items",
        depth: 2, // Populate "category", "image", "tenant" & "tenant.image"
        where: {
          and: [
            {
              id: {
                in: input.ids,
              },
            },
            {
              isArchived: {
                not_equals: true,
              },
            },
          ],
        },
      });

      if (data.totalDocs !== input.ids.length) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Items not found" });
      }

      const totalPrice = data.docs.reduce((acc, item) => {
        const price = Number(item.price);
        return acc + (isNaN(price) ? 0 : price);
      }, 0);

      return {
        ...data,
        totalPrice: totalPrice,
        docs: data.docs.map((doc) => ({
          ...doc,
          image: doc.image as Media | null,
          tenant: doc.tenant as Tenant & { image: Media | null },
        })),
      };
    }),
});
