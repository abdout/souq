import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import { stripe } from "@/lib/stripe";

export const onboardingRouter = createTRPCRouter({
  // Create business-specific Stripe Connect account
  createStripeAccount: protectedProcedure
    .input(
      z.object({
        businessType: z.enum(["restaurant", "pharmacy", "grocery"]),
        businessName: z.string().min(2),
        businessEmail: z.string().email(),
        businessPhone: z.string().optional(),
        businessAddress: z.object({
          line1: z.string(),
          city: z.string(),
          postal_code: z.string(),
          country: z.string().default("SA"), // Saudi Arabia
        }),
        coordinates: z.object({
          lat: z.number(),
          lng: z.number(),
        }),
        operatingHours: z.object({
          monday: z.object({
            open: z.string(),
            close: z.string(), 
            closed: z.boolean(),
          }),
          tuesday: z.object({
            open: z.string(),
            close: z.string(),
            closed: z.boolean(),
          }),
          wednesday: z.object({
            open: z.string(),
            close: z.string(),
            closed: z.boolean(),
          }),
          thursday: z.object({
            open: z.string(),
            close: z.string(),
            closed: z.boolean(),
          }),
          friday: z.object({
            open: z.string(),
            close: z.string(),
            closed: z.boolean(),
          }),
          saturday: z.object({
            open: z.string(),
            close: z.string(),
            closed: z.boolean(),
          }),
          sunday: z.object({
            open: z.string(),
            close: z.string(),
            closed: z.boolean(),
          }),
        }),
        deliverySettings: z.object({
          deliveryRadius: z.number().min(1).max(50), // 1-50 km
          minimumOrder: z.number().min(0),
          deliveryFee: z.number().min(0),
        }),
        businessLicense: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Get business type specific requirements
        const businessTypeRequirements = getBusinessTypeRequirements(input.businessType);

        // Create Stripe Connect account
        const account = await stripe.accounts.create({
          type: "express",
          country: input.businessAddress.country,
          email: input.businessEmail,
          capabilities: {
            card_payments: { requested: true },
            transfers: { requested: true },
          },
          business_type: "individual", // Can be enhanced for company registration
          business_profile: {
            name: input.businessName,
            mcc: businessTypeRequirements.mcc, // Merchant Category Code
            product_description: `${input.businessType} delivery services`,
            support_phone: input.businessPhone,
            url: `${process.env.NEXT_PUBLIC_APP_URL}/merchants/${generateSlug(input.businessName)}`,
          },
          settings: {
            payouts: {
              schedule: {
                interval: "daily",
              },
            },
          },
        });

        // Create tenant record
        const tenant = await ctx.db.create({
          collection: "tenants",
          data: {
            name: input.businessName,
            slug: generateSlug(input.businessName),
            businessType: input.businessType,
            address: `${input.businessAddress.line1}, ${input.businessAddress.city}, ${input.businessAddress.postal_code}`,
            coordinates: input.coordinates,
            deliveryRadius: input.deliverySettings.deliveryRadius,
            minimumOrder: input.deliverySettings.minimumOrder,
            deliveryFee: input.deliverySettings.deliveryFee,
            operatingHours: input.operatingHours,
            isActive: false, // Inactive until Stripe verification complete
            businessLicense: input.businessLicense,
            stripeAccountId: account.id,
            stripeDetailsSubmitted: false,
          },
        });

        // Associate user with tenant
        await ctx.db.update({
          collection: "users",
          id: ctx.session.user.id,
          data: {
            tenants: [
              ...(ctx.session.user.tenants || []),
              { tenant: tenant.id },
            ],
          },
        });

        // Create account link for onboarding
        const accountLink = await stripe.accountLinks.create({
          account: account.id,
          refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/onboarding/refresh?account_id=${account.id}`,
          return_url: `${process.env.NEXT_PUBLIC_APP_URL}/onboarding/complete?account_id=${account.id}`,
          type: "account_onboarding",
        });

        return {
          tenantId: tenant.id,
          stripeAccountId: account.id,
          onboardingUrl: accountLink.url,
          businessType: input.businessType,
          requirements: businessTypeRequirements,
        };

      } catch (error) {
        console.error("Stripe account creation failed:", error);
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: error instanceof Error ? error.message : "Failed to create merchant account",
        });
      }
    }),

  // Complete onboarding after Stripe verification
  completeOnboarding: protectedProcedure
    .input(
      z.object({
        stripeAccountId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Verify Stripe account status
        const account = await stripe.accounts.retrieve(input.stripeAccountId);
        
        if (!account.details_submitted) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Please complete Stripe verification first",
          });
        }

        // Update tenant status
        const tenant = await ctx.db.update({
          collection: "tenants",
          where: {
            stripeAccountId: {
              equals: input.stripeAccountId,
            },
          },
          data: {
            stripeDetailsSubmitted: true,
            isActive: true, // Now merchant can start accepting orders
          },
        });

        return {
          success: true,
          tenantId: tenant.docs[0]?.id,
          canAcceptOrders: true,
          message: "Congratulations! Your merchant account is now active and ready to accept orders.",
        };

      } catch (error) {
        console.error("Onboarding completion failed:", error);
        throw new TRPCError({
          code: "BAD_REQUEST", 
          message: error instanceof Error ? error.message : "Failed to complete onboarding",
        });
      }
    }),

  // Get onboarding status for a user
  getOnboardingStatus: protectedProcedure.query(async ({ ctx }) => {
    const userTenants = ctx.session.user.tenants || [];
    
    if (userTenants.length === 0) {
      return {
        hasAccount: false,
        needsOnboarding: true,
        step: "create_account",
      };
    }

    const tenant = await ctx.db.findByID({
      collection: "tenants",
      id: userTenants[0].tenant as string,
    });

    if (!tenant) {
      return {
        hasAccount: false,
        needsOnboarding: true,
        step: "create_account",
      };
    }

    if (!tenant.stripeDetailsSubmitted) {
      return {
        hasAccount: true,
        needsOnboarding: true,
        step: "complete_stripe",
        stripeAccountId: tenant.stripeAccountId,
        businessType: tenant.businessType,
        businessName: tenant.name,
      };
    }

    return {
      hasAccount: true,
      needsOnboarding: false,
      step: "complete",
      tenant: {
        id: tenant.id,
        name: tenant.name,
        businessType: tenant.businessType,
        isActive: tenant.isActive,
        slug: tenant.slug,
      },
    };
  }),
});

// Helper functions
function getBusinessTypeRequirements(businessType: string) {
  const requirements = {
    restaurant: {
      mcc: "5812", // Eating Places and Restaurants
      requiredDocuments: ["business_license", "food_safety_certificate"],
      description: "Restaurant and food delivery services",
      minimumDeliveryFee: 5,
      averagePreparationTime: 30, // minutes
    },
    pharmacy: {
      mcc: "5912", // Drug Stores and Pharmacies
      requiredDocuments: ["pharmacy_license", "pharmacist_certification", "drug_license"],
      description: "Pharmacy and medical delivery services", 
      minimumDeliveryFee: 3,
      averagePreparationTime: 15,
      specialRequirements: ["prescription_handling", "controlled_substances"],
    },
    grocery: {
      mcc: "5411", // Grocery Stores and Supermarkets
      requiredDocuments: ["business_license", "food_handling_permit"],
      description: "Grocery and household items delivery",
      minimumDeliveryFee: 4,
      averagePreparationTime: 20,
    },
  };

  return requirements[businessType as keyof typeof requirements] || requirements.restaurant;
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single
    .trim();
}