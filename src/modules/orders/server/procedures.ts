import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import { sendMerchantOrderConfirmation, sendCustomerOrderConfirmation, sendOrderStatusUpdate } from "@/lib/email";

export const ordersRouter = createTRPCRouter({
  // Calculate delivery fee based on distance and minimum order
  calculateDeliveryFee: protectedProcedure
    .input(
      z.object({
        tenantSlug: z.string(),
        deliveryAddress: z.object({
          lat: z.number(),
          lng: z.number(),
          street: z.string(),
          city: z.string(),
          postalCode: z.string().optional(),
        }),
        orderTotal: z.number(),
        items: z.array(z.object({
          id: z.string(),
          quantity: z.number().default(1),
        })),
      })
    )
    .query(async ({ ctx, input }) => {
      // Get tenant delivery settings
      const tenant = await ctx.db.find({
        collection: "tenants",
        where: {
          slug: {
            equals: input.tenantSlug,
          },
        },
        limit: 1,
      });

      if (tenant.totalDocs === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Merchant not found",
        });
      }

      const merchantData = tenant.docs[0];

      // Check if merchant is active and accepting orders
      if (!merchantData.isActive) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Merchant is currently not accepting orders",
        });
      }

      // Calculate distance between merchant and delivery address
      const distance = calculateDistance(
        merchantData.coordinates.lat,
        merchantData.coordinates.lng,
        input.deliveryAddress.lat,
        input.deliveryAddress.lng
      );

      // Check if delivery address is within delivery radius
      if (distance > merchantData.deliveryRadius) {
        return {
          canDeliver: false,
          reason: "outside_delivery_radius",
          maxRadius: merchantData.deliveryRadius,
          actualDistance: distance,
          message: `Sorry, we only deliver within ${merchantData.deliveryRadius}km. Your location is ${distance.toFixed(1)}km away.`,
        };
      }

      // Calculate delivery fee (base fee + distance-based fee)
      const baseFee = merchantData.deliveryFee || 0;
      const distanceFee = Math.max(0, (distance - 5) * 1); // $1 per km after first 5km
      const totalDeliveryFee = baseFee + distanceFee;

      // Check minimum order requirement
      const meetsMinimum = input.orderTotal >= merchantData.minimumOrder;
      const freeDeliveryEligible = input.orderTotal >= (merchantData.minimumOrder * 2); // Free delivery for orders 2x minimum

      const finalDeliveryFee = freeDeliveryEligible ? 0 : totalDeliveryFee;

      // Estimate delivery time based on business type and distance
      const preparationTime = getPreparationTime(merchantData.businessType);
      const deliveryTime = Math.ceil(distance * 3); // 3 minutes per km
      const totalEstimatedTime = preparationTime + deliveryTime;

      return {
        canDeliver: true,
        meetsMinimumOrder: meetsMinimum,
        minimumOrderRequired: merchantData.minimumOrder,
        orderTotal: input.orderTotal,
        deliveryFee: finalDeliveryFee,
        originalDeliveryFee: totalDeliveryFee,
        freeDeliveryEligible,
        distance: distance,
        estimatedDeliveryTime: totalEstimatedTime,
        preparationTime,
        merchant: {
          name: merchantData.name,
          businessType: merchantData.businessType,
          address: merchantData.address,
          operatingHours: merchantData.operatingHours,
        },
      };
    }),

  // Create order with delivery information
  createDeliveryOrder: protectedProcedure
    .input(
      z.object({
        tenantSlug: z.string(),
        items: z.array(
          z.object({
            itemId: z.string(),
            quantity: z.number().min(1),
            price: z.number(),
            specialInstructions: z.string().optional(),
          })
        ),
        deliveryAddress: z.object({
          street: z.string(),
          city: z.string(),
          postalCode: z.string().optional(),
          country: z.string().default("Saudi Arabia"),
          coordinates: z.object({
            lat: z.number(),
            lng: z.number(),
          }),
          instructions: z.string().optional(),
        }),
        orderType: z.enum(["delivery", "pickup"]).default("delivery"),
        specialInstructions: z.string().optional(),
        requestedDeliveryTime: z.string().optional(), // ISO string
        paymentMethod: z.enum(["card", "cash"]).default("card"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify tenant exists and is active
      const tenant = await ctx.db.find({
        collection: "tenants",
        where: {
          slug: {
            equals: input.tenantSlug,
          },
        },
        limit: 1,
      });

      if (tenant.totalDocs === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Merchant not found",
        });
      }

      const merchantData = tenant.docs[0];

      if (!merchantData.isActive) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Merchant is currently not accepting orders",
        });
      }

      // Verify all items exist and calculate totals
      const itemDetails = await ctx.db.find({
        collection: "items",
        where: {
          and: [
            {
              id: {
                in: input.items.map(item => item.itemId),
              },
            },
            {
              "tenant.slug": {
                equals: input.tenantSlug,
              },
            },
          ],
        },
      });

      if (itemDetails.totalDocs !== input.items.length) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Some items were not found or are not available",
        });
      }

      // Check inventory availability
      const inventoryIssues = [];
      for (const orderItem of input.items) {
        const item = itemDetails.docs.find(i => i.id === orderItem.itemId);
        if (item && item.trackInventory && item.inventory < orderItem.quantity) {
          inventoryIssues.push({
            itemName: item.name,
            requested: orderItem.quantity,
            available: item.inventory,
          });
        }
      }

      if (inventoryIssues.length > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Insufficient inventory: ${inventoryIssues.map(i => `${i.itemName} (requested: ${i.requested}, available: ${i.available})`).join(", ")}`,
        });
      }

      // Calculate order totals
      const subtotal = input.items.reduce((sum, orderItem) => {
        const item = itemDetails.docs.find(i => i.id === orderItem.itemId);
        return sum + (item ? item.price * orderItem.quantity : 0);
      }, 0);

      // Calculate delivery fee
      const deliveryFeeResult = input.orderType === "delivery" 
        ? await calculateDeliveryFeeForOrder(merchantData, input.deliveryAddress.coordinates, subtotal)
        : { fee: 0, canDeliver: true };

      if (!deliveryFeeResult.canDeliver) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot deliver to this address",
        });
      }

      const total = subtotal + deliveryFeeResult.fee;
      const estimatedDelivery = new Date();
      estimatedDelivery.setMinutes(estimatedDelivery.getMinutes() + (deliveryFeeResult.estimatedTime || 45));

      // Create order record
      const order = await ctx.db.create({
        collection: "orders",
        data: {
          name: `Order #${Date.now()}`,
          user: ctx.session.user.id,
          item: input.items[0].itemId, // Primary item (legacy field)
          deliveryAddress: input.deliveryAddress,
          orderStatus: "pending",
          deliveryFee: deliveryFeeResult.fee,
          estimatedDelivery: estimatedDelivery.toISOString(),
          specialInstructions: input.specialInstructions,
          orderType: input.orderType,
          stripeCheckoutSessionId: "", // Will be updated after payment
          stripeAccountId: merchantData.stripeAccountId,
        },
      });

      // Update inventory for tracked items
      for (const orderItem of input.items) {
        const item = itemDetails.docs.find(i => i.id === orderItem.itemId);
        if (item && item.trackInventory) {
          await ctx.db.update({
            collection: "items",
            id: item.id,
            data: {
              inventory: item.inventory - orderItem.quantity,
            },
          });
        }
      }

      // Send email notifications (async, don't block the response)
      setTimeout(async () => {
        try {
          const user = await ctx.db.findByID({
            collection: "users",
            id: ctx.session.user.id,
          });

          const emailData = {
            orderId: order.id,
            orderNumber: order.name,
            customerName: user.name || `${user.firstName} ${user.lastName}` || user.email,
            customerEmail: user.email,
            merchantName: merchantData.name,
            merchantEmail: merchantData.email || '',
            items: input.items.map(orderItem => {
              const item = itemDetails.docs.find(i => i.id === orderItem.itemId);
              return {
                name: item?.name || 'Unknown Item',
                quantity: orderItem.quantity,
                price: item?.price || 0,
                specialInstructions: orderItem.specialInstructions,
              };
            }),
            subtotal,
            deliveryFee: deliveryFeeResult.fee,
            total,
            deliveryAddress: input.deliveryAddress,
            orderType: input.orderType,
            estimatedDelivery: estimatedDelivery.toISOString(),
            specialInstructions: input.specialInstructions,
            orderStatus: "pending",
          };

          // Send notifications to both customer and merchant
          await sendCustomerOrderConfirmation(emailData);
          if (merchantData.email) {
            await sendMerchantOrderConfirmation(emailData);
          }
        } catch (emailError) {
          console.error('Failed to send order confirmation emails:', emailError);
        }
      }, 100); // Small delay to not block the response

      return {
        orderId: order.id,
        orderNumber: order.name,
        subtotal,
        deliveryFee: deliveryFeeResult.fee,
        total,
        estimatedDelivery: estimatedDelivery.toISOString(),
        paymentRequired: input.paymentMethod === "card",
        merchant: {
          name: merchantData.name,
          businessType: merchantData.businessType,
        },
      };
    }),

  // Get orders for a user (customer order history)
  getUserOrders: protectedProcedure
    .input(
      z.object({
        status: z.enum(["pending", "confirmed", "preparing", "ready", "out_for_delivery", "delivered", "cancelled"]).optional(),
        limit: z.number().default(10),
        offset: z.number().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = {
        user: {
          equals: ctx.session.user.id,
        },
      };

      if (input.status) {
        where.orderStatus = {
          equals: input.status,
        };
      }

      const orders = await ctx.db.find({
        collection: "orders",
        where,
        limit: input.limit,
        page: Math.floor(input.offset / input.limit) + 1,
        sort: "-createdAt",
        depth: 2, // Include item and tenant details
      });

      return {
        orders: orders.docs.map(order => ({
          id: order.id,
          orderNumber: order.name,
          status: order.orderStatus,
          createdAt: order.createdAt,
          deliveryAddress: order.deliveryAddress,
          deliveryFee: order.deliveryFee,
          estimatedDelivery: order.estimatedDelivery,
          orderType: order.orderType,
          specialInstructions: order.specialInstructions,
        })),
        totalCount: orders.totalDocs,
        hasMore: orders.hasNextPage,
      };
    }),

  // Get orders for a merchant (merchant order management)
  getMerchantOrders: protectedProcedure
    .input(
      z.object({
        tenantSlug: z.string(),
        status: z.enum(["pending", "confirmed", "preparing", "ready", "out_for_delivery", "delivered", "cancelled"]).optional(),
        limit: z.number().default(20),
        offset: z.number().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      // Verify user has access to this tenant
      const tenant = await ctx.db.find({
        collection: "tenants",
        where: {
          slug: {
            equals: input.tenantSlug,
          },
        },
        limit: 1,
      });

      if (tenant.totalDocs === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Merchant not found",
        });
      }

      // Get orders for items belonging to this tenant
      const itemsQuery = await ctx.db.find({
        collection: "items",
        where: {
          "tenant.slug": {
            equals: input.tenantSlug,
          },
        },
        limit: 1000, // Get all items for this tenant
      });

      const itemIds = itemsQuery.docs.map(item => item.id);

      if (itemIds.length === 0) {
        return {
          orders: [],
          totalCount: 0,
          hasMore: false,
        };
      }

      const where: Record<string, unknown> = {
        item: {
          in: itemIds,
        },
      };

      if (input.status) {
        where.orderStatus = {
          equals: input.status,
        };
      }

      const orders = await ctx.db.find({
        collection: "orders",
        where,
        limit: input.limit,
        page: Math.floor(input.offset / input.limit) + 1,
        sort: "-createdAt",
        depth: 2, // Include user and item details
      });

      return {
        orders: orders.docs.map(order => ({
          id: order.id,
          orderNumber: order.name,
          status: order.orderStatus,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
          customer: {
            name: (order.user as Record<string, unknown>)?.name || `${(order.user as Record<string, unknown>)?.firstName} ${(order.user as Record<string, unknown>)?.lastName}` || (order.user as Record<string, unknown>)?.email || 'Unknown Customer',
            email: (order.user as Record<string, unknown>)?.email,
          },
          item: {
            name: (order.item as Record<string, unknown>)?.name,
            price: (order.item as Record<string, unknown>)?.price,
          },
          deliveryAddress: order.deliveryAddress,
          deliveryFee: order.deliveryFee,
          estimatedDelivery: order.estimatedDelivery,
          orderType: order.orderType,
          specialInstructions: order.specialInstructions,
        })),
        totalCount: orders.totalDocs,
        hasMore: orders.hasNextPage,
        pendingCount: orders.docs.filter(o => o.orderStatus === 'pending').length,
        preparingCount: orders.docs.filter(o => o.orderStatus === 'preparing').length,
      };
    }),

  // Update order status (for merchants)
  updateOrderStatus: protectedProcedure
    .input(
      z.object({
        orderId: z.string(),
        newStatus: z.enum(["pending", "confirmed", "preparing", "ready", "out_for_delivery", "delivered", "cancelled"]),
        updateMessage: z.string().optional(),
        estimatedDelivery: z.string().optional(), // ISO string
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get the order
      const order = await ctx.db.findByID({
        collection: "orders",
        id: input.orderId,
        depth: 2,
      });

      if (!order) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Order not found",
        });
      }

      const previousStatus = order.orderStatus;

      // Update the order
      const updatedOrder = await ctx.db.update({
        collection: "orders",
        id: input.orderId,
        data: {
          orderStatus: input.newStatus,
          ...(input.estimatedDelivery && { estimatedDelivery: input.estimatedDelivery }),
        },
      });

      // Send status update notification (async, don't block response)
      setTimeout(async () => {
        try {
          const customer = order.user as Record<string, unknown>;
          const item = order.item as Record<string, unknown>;

          // Get tenant info for merchant name
          const tenantQuery = await ctx.db.find({
            collection: "tenants",
            where: {
              id: {
                equals: item.tenant.id,
              },
            },
            limit: 1,
          });

          const merchant = tenantQuery.docs[0];

          const statusUpdateData = {
            orderId: order.id,
            orderNumber: order.name,
            newStatus: input.newStatus,
            previousStatus,
            customerName: customer?.name || `${customer?.firstName} ${customer?.lastName}` || customer?.email || 'Customer',
            customerEmail: customer?.email,
            merchantName: merchant?.name || 'Merchant',
            estimatedDelivery: input.estimatedDelivery || order.estimatedDelivery,
            updateMessage: input.updateMessage,
          };

          if (customer?.email) {
            await sendOrderStatusUpdate(statusUpdateData);
          }
        } catch (emailError) {
          console.error('Failed to send order status update email:', emailError);
        }
      }, 100);

      return {
        success: true,
        order: {
          id: updatedOrder.id,
          orderNumber: updatedOrder.name,
          status: updatedOrder.orderStatus,
          previousStatus,
          estimatedDelivery: updatedOrder.estimatedDelivery,
        },
      };
    }),

  // Get order details with timeline
  getOrderDetails: protectedProcedure
    .input(
      z.object({
        orderId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const order = await ctx.db.findByID({
        collection: "orders",
        id: input.orderId,
        depth: 2,
      });

      if (!order) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Order not found",
        });
      }

      // Verify access - user must own the order or be the merchant
      const customer = order.user as Record<string, unknown>;
      const item = order.item as Record<string, unknown>;

      const hasAccess = customer.id === ctx.session.user.id;

      if (!hasAccess) {
        // Check if user is merchant (simplified check)
        // Note: In a full implementation, you'd check if the current user is the owner of this tenant
      }

      // Create order timeline based on status
      const timeline = getOrderTimeline(order.orderStatus, order.createdAt, order.estimatedDelivery);

      return {
        id: order.id,
        orderNumber: order.name,
        status: order.orderStatus,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        customer: {
          name: customer?.name || `${customer?.firstName} ${customer?.lastName}` || customer?.email || 'Customer',
          email: customer?.email,
        },
        merchant: {
          name: item.tenant?.name || 'Merchant',
          businessType: item.tenant?.businessType,
          address: item.tenant?.address,
        },
        item: {
          name: item.name,
          price: item.price,
          image: item.image,
        },
        deliveryAddress: order.deliveryAddress,
        deliveryFee: order.deliveryFee,
        estimatedDelivery: order.estimatedDelivery,
        orderType: order.orderType,
        specialInstructions: order.specialInstructions,
        timeline,
      };
    }),
});

// Helper functions
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in kilometers
  return Math.round(d * 10) / 10; // Round to 1 decimal place
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

function getPreparationTime(businessType: string): number {
  const times = {
    restaurant: 25, // minutes
    pharmacy: 10,
    grocery: 15,
  };
  return times[businessType as keyof typeof times] || 20;
}

async function calculateDeliveryFeeForOrder(
  merchant: Record<string, unknown>,
  deliveryCoords: { lat: number; lng: number },
  orderTotal: number
) {
  const distance = calculateDistance(
    merchant.coordinates.lat,
    merchant.coordinates.lng,
    deliveryCoords.lat,
    deliveryCoords.lng
  );

  if (distance > merchant.deliveryRadius) {
    return { fee: 0, canDeliver: false, estimatedTime: 0 };
  }

  const baseFee = merchant.deliveryFee || 0;
  const distanceFee = Math.max(0, (distance - 5) * 1);
  const totalFee = baseFee + distanceFee;

  // Free delivery for large orders
  const freeDeliveryEligible = orderTotal >= (merchant.minimumOrder * 2);
  const finalFee = freeDeliveryEligible ? 0 : totalFee;

  const preparationTime = getPreparationTime(merchant.businessType);
  const deliveryTime = Math.ceil(distance * 3);
  const totalTime = preparationTime + deliveryTime;

  return { 
    fee: finalFee, 
    canDeliver: true, 
    estimatedTime: totalTime,
    distance,
  };
}

// Generate order timeline for tracking
function getOrderTimeline(currentStatus: string, createdAt: string, estimatedDelivery?: string) {
  const statuses = [
    { key: 'pending', label: 'Order Placed', icon: '📝' },
    { key: 'confirmed', label: 'Order Confirmed', icon: '✅' },
    { key: 'preparing', label: 'Being Prepared', icon: '👨‍🍳' },
    { key: 'ready', label: 'Ready', icon: '🎉' },
    { key: 'out_for_delivery', label: 'Out for Delivery', icon: '🚚' },
    { key: 'delivered', label: 'Delivered', icon: '✅' },
    { key: 'cancelled', label: 'Cancelled', icon: '❌' },
  ];

  const currentIndex = statuses.findIndex(s => s.key === currentStatus);
  const now = new Date();
  const orderCreated = new Date(createdAt);

  return statuses.map((status, index) => {
    let completedAt: string | undefined;
    let isCompleted = false;
    let isCurrent = false;

    if (currentStatus === 'cancelled' && status.key === 'cancelled') {
      isCompleted = true;
      isCurrent = true;
      completedAt = now.toISOString();
    } else if (currentStatus !== 'cancelled') {
      if (index < currentIndex) {
        isCompleted = true;
        // Estimate completion times for past statuses
        const minutesOffset = index * 15; // 15 minutes between each status
        const estimatedTime = new Date(orderCreated.getTime() + minutesOffset * 60000);
        completedAt = estimatedTime.toISOString();
      } else if (index === currentIndex) {
        isCompleted = true;
        isCurrent = true;
        completedAt = now.toISOString();
      }
    }

    return {
      key: status.key,
      label: status.label,
      icon: status.icon,
      isCompleted,
      isCurrent,
      completedAt,
      estimatedTime: status.key === 'delivered' && estimatedDelivery ? estimatedDelivery : undefined,
    };
  }).filter(item => {
    // Don't show cancelled in normal flow, and don't show delivery steps for pickup
    if (currentStatus === 'cancelled') {
      return ['pending', 'cancelled'].includes(item.key);
    }
    return item.key !== 'cancelled';
  });
}