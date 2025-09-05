import { z } from "zod";
import { baseProcedure, createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import { isSuperAdmin } from "@/lib/access";
import { Tenant } from "@/payload-types";

export const inventoryRouter = createTRPCRouter({
  // Get low stock items for a merchant
  getLowStockItems: protectedProcedure
    .input(
      z.object({
        tenantSlug: z.string(),
        threshold: z.number().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Check if user can access this tenant's inventory
      if (!isSuperAdmin(ctx.session.user)) {
        const userTenant = ctx.session.user?.tenants?.[0]?.tenant as Tenant;
        if (userTenant?.slug !== input.tenantSlug) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Cannot access inventory for this tenant",
          });
        }
      }

      const items = await ctx.db.find({
        collection: "items",
        where: {
          and: [
            {
              "tenant.slug": {
                equals: input.tenantSlug,
              },
            },
            {
              trackInventory: {
                equals: true,
              },
            },
            {
              or: [
                // Items below their specific threshold
                {
                  and: [
                    {
                      lowStockThreshold: {
                        exists: true,
                      },
                    },
                    {
                      inventory: {
                        less_than: "lowStockThreshold",
                      },
                    },
                  ],
                },
                // Items below general threshold (if provided)
                ...(input.threshold
                  ? [
                      {
                        and: [
                          {
                            lowStockThreshold: {
                              exists: false,
                            },
                          },
                          {
                            inventory: {
                              less_than: input.threshold,
                            },
                          },
                        ],
                      },
                    ]
                  : []),
              ],
            },
          ],
        },
        limit: 100,
      });

      return items.docs.map((item) => ({
        id: item.id,
        name: item.name,
        inventory: item.inventory,
        lowStockThreshold: item.lowStockThreshold || input.threshold || 10,
        unit: item.unit,
        businessType: item.businessType,
        isLowStock: item.inventory <= (item.lowStockThreshold || input.threshold || 10),
      }));
    }),

  // Update inventory for a specific item
  updateInventory: protectedProcedure
    .input(
      z.object({
        itemId: z.string(),
        newQuantity: z.number().min(0),
        reason: z.enum(["restock", "sale", "damage", "adjustment"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get the item first to check permissions
      const item = await ctx.db.findByID({
        collection: "items",
        id: input.itemId,
        depth: 1,
      });

      if (!item) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Item not found",
        });
      }

      // Check permissions
      if (!isSuperAdmin(ctx.session.user)) {
        const userTenant = ctx.session.user?.tenants?.[0]?.tenant as Tenant;
        if (userTenant?.id !== item.tenant) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Cannot update inventory for items not owned by your tenant",
          });
        }
      }

      const updatedItem = await ctx.db.update({
        collection: "items",
        id: input.itemId,
        data: {
          inventory: input.newQuantity,
        },
      });

      // Log the inventory change (could be enhanced with proper audit log)
      console.log(`Inventory updated for item ${item.name}: ${item.inventory} → ${input.newQuantity} (${input.reason || "manual"})`);

      return {
        id: updatedItem.id,
        name: updatedItem.name,
        previousQuantity: item.inventory,
        newQuantity: input.newQuantity,
        isLowStock: input.newQuantity <= (updatedItem.lowStockThreshold || 10),
      };
    }),

  // Bulk update inventory
  bulkUpdateInventory: protectedProcedure
    .input(
      z.object({
        tenantSlug: z.string(),
        updates: z.array(
          z.object({
            itemId: z.string(),
            newQuantity: z.number().min(0),
          })
        ),
        reason: z.enum(["restock", "sale", "damage", "adjustment"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check tenant permissions
      if (!isSuperAdmin(ctx.session.user)) {
        const userTenant = ctx.session.user?.tenants?.[0]?.tenant as Tenant;
        if (userTenant?.slug !== input.tenantSlug) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Cannot update inventory for this tenant",
          });
        }
      }

      const results = [];

      for (const update of input.updates) {
        try {
          const item = await ctx.db.findByID({
            collection: "items",
            id: update.itemId,
          });

          if (!item) {
            results.push({
              itemId: update.itemId,
              success: false,
              error: "Item not found",
            });
            continue;
          }

          const updatedItem = await ctx.db.update({
            collection: "items",
            id: update.itemId,
            data: {
              inventory: update.newQuantity,
            },
          });

          results.push({
            itemId: update.itemId,
            success: true,
            name: item.name,
            previousQuantity: item.inventory,
            newQuantity: update.newQuantity,
            isLowStock: update.newQuantity <= (item.lowStockThreshold || 10),
          });

          console.log(`Bulk inventory update for ${item.name}: ${item.inventory} → ${update.newQuantity} (${input.reason || "bulk"})`);
        } catch (error) {
          results.push({
            itemId: update.itemId,
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }

      return {
        totalUpdates: input.updates.length,
        successful: results.filter((r) => r.success).length,
        failed: results.filter((r) => !r.success).length,
        results,
      };
    }),

  // Get inventory summary for merchant dashboard
  getInventorySummary: protectedProcedure
    .input(
      z.object({
        tenantSlug: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Check permissions
      if (!isSuperAdmin(ctx.session.user)) {
        const userTenant = ctx.session.user?.tenants?.[0]?.tenant as Tenant;
        if (userTenant?.slug !== input.tenantSlug) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Cannot access inventory for this tenant",
          });
        }
      }

      const items = await ctx.db.find({
        collection: "items",
        where: {
          "tenant.slug": {
            equals: input.tenantSlug,
          },
        },
        limit: 1000, // Adjust based on needs
      });

      const tracked = items.docs.filter((item) => item.trackInventory);
      const outOfStock = tracked.filter((item) => item.inventory === 0);
      const lowStock = tracked.filter(
        (item) => item.inventory > 0 && item.inventory <= (item.lowStockThreshold || 10)
      );

      const totalValue = tracked.reduce(
        (sum, item) => sum + (item.inventory * item.price),
        0
      );

      return {
        totalItems: items.totalDocs,
        trackedItems: tracked.length,
        outOfStock: outOfStock.length,
        lowStock: lowStock.length,
        totalInventoryValue: totalValue,
        lastUpdated: new Date().toISOString(),
      };
    }),
});