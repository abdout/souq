import z from "zod";
import { TRPCError } from "@trpc/server";
import { baseProcedure, createTRPCRouter } from "@/trpc/init";
import { Media, Tenant } from "@/payload-types";

export const tenantsRouter = createTRPCRouter({
  getOne: baseProcedure
    .input(
      z.object({
        slug: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const tenantsData = await ctx.db.find({
        collection: "tenants",
        depth: 1, // "tenant.image" is a type of "Media"
        where: {
          slug: {
            equals: input.slug,
          },
        },
      });

      const tenant = tenantsData.docs[0];

      if (!tenant) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Tenant not found" });
      }

      return tenant as Tenant & { image: Media | null };
    }),

  // Discover merchants near user location with delivery availability  
  discoverNearby: baseProcedure
    .input(
      z.object({
        userLocation: z.object({
          lat: z.number(),
          lng: z.number(),
        }),
        businessType: z.enum(["restaurant", "pharmacy", "grocery"]).optional(),
        maxDistance: z.number().default(20), // km
        limit: z.number().default(20),
        currentlyDelivering: z.boolean().default(false),
      })
    )
    .query(async ({ ctx, input }) => {
      const { userLocation, businessType, maxDistance, limit, currentlyDelivering } = input;
      
      // Build where clause
      const where: Record<string, any> = {
        isActive: true,
      };

      if (businessType) {
        where.businessType = businessType;
      }

      // If filtering by currently delivering, check operating hours
      if (currentlyDelivering) {
        // Note: This is a simplified check. In production, you'd want more sophisticated time handling
        where.operatingHours = {
          not: null
        };
      }

      const tenants = await ctx.db.find({
        collection: "tenants",
        where,
        limit: 1000, // Get all matching tenants for distance calculation
        depth: 1,
      });

      // Calculate distances and filter by delivery radius
      const nearbyTenants = tenants.docs
        .map(tenant => {
          if (!tenant.coordinates || !tenant.deliveryRadius) {
            return null;
          }

          const distance = calculateDistance(
            userLocation.lat,
            userLocation.lng,
            tenant.coordinates.lat,
            tenant.coordinates.lng
          );

          // Check if user is within merchant's delivery radius
          const canDeliver = distance <= tenant.deliveryRadius;
          const withinMaxDistance = distance <= maxDistance;

          if (!withinMaxDistance || (!canDeliver && !currentlyDelivering)) {
            return null;
          }

          // Check if currently operating (simplified)
          let isCurrentlyOpen = true;
          if (currentlyDelivering && tenant.operatingHours) {
            isCurrentlyOpen = checkIfCurrentlyOpen(tenant.operatingHours);
          }

          return {
            ...tenant,
            distance: Math.round(distance * 10) / 10, // Round to 1 decimal
            canDeliver,
            isCurrentlyOpen,
            estimatedDeliveryTime: getEstimatedDeliveryTime(tenant.businessType, distance),
          };
        })
        .filter(Boolean)
        .sort((a, b) => (a!.distance - b!.distance)) // Sort by distance
        .slice(0, limit);

      return {
        merchants: nearbyTenants,
        userLocation,
        searchRadius: maxDistance,
        totalFound: nearbyTenants.length,
      };
    }),

  // Get merchants by business type with availability status
  getByBusinessType: baseProcedure
    .input(
      z.object({
        businessType: z.enum(["restaurant", "pharmacy", "grocery"]),
        limit: z.number().default(12),
        offset: z.number().default(0),
        userLocation: z.object({
          lat: z.number(),
          lng: z.number(),
        }).optional(),
        onlyCurrentlyDelivering: z.boolean().default(false),
      })
    )
    .query(async ({ ctx, input }) => {
      const { businessType, limit, offset, userLocation, onlyCurrentlyDelivering } = input;

      const where: Record<string, any> = {
        businessType,
        isActive: true,
      };

      const tenants = await ctx.db.find({
        collection: "tenants",
        where,
        limit: limit + 20, // Get extra in case some are filtered out by distance
        page: Math.floor(offset / limit) + 1,
        sort: "-createdAt",
        depth: 1,
      });

      let processedTenants = tenants.docs.map(tenant => {
        let distance: number | null = null;
        let canDeliver = true;
        let isCurrentlyOpen = true;

        if (userLocation && tenant.coordinates) {
          distance = calculateDistance(
            userLocation.lat,
            userLocation.lng,
            tenant.coordinates.lat,
            tenant.coordinates.lng
          );
          canDeliver = distance <= (tenant.deliveryRadius || 20);
        }

        if (onlyCurrentlyDelivering && tenant.operatingHours) {
          isCurrentlyOpen = checkIfCurrentlyOpen(tenant.operatingHours);
        }

        return {
          ...tenant,
          distance: distance ? Math.round(distance * 10) / 10 : null,
          canDeliver,
          isCurrentlyOpen,
          estimatedDeliveryTime: distance ? getEstimatedDeliveryTime(tenant.businessType, distance) : null,
        };
      });

      // Filter out merchants that can't deliver or are closed if requested
      if (userLocation || onlyCurrentlyDelivering) {
        processedTenants = processedTenants.filter(tenant => {
          if (onlyCurrentlyDelivering && !tenant.isCurrentlyOpen) return false;
          if (userLocation && !tenant.canDeliver) return false;
          return true;
        });
      }

      // Sort by distance if user location provided
      if (userLocation) {
        processedTenants.sort((a, b) => {
          if (a.distance === null) return 1;
          if (b.distance === null) return -1;
          return a.distance - b.distance;
        });
      }

      return {
        merchants: processedTenants.slice(0, limit),
        totalCount: tenants.totalDocs,
        hasMore: tenants.hasNextPage,
        businessType,
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

function checkIfCurrentlyOpen(operatingHours: Record<string, any>): boolean {
  if (!operatingHours) return true;
  
  const now = new Date();
  const currentDay = now.toLocaleDateString('en', { weekday: 'lowercase' });
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTime = currentHour * 100 + currentMinute; // HHMM format
  
  const todayHours = operatingHours[currentDay];
  if (!todayHours || !todayHours.open || !todayHours.close) {
    return false; // Closed if no hours defined
  }
  
  // Parse time strings (assumes format like "09:00" or "21:30")
  const openTime = parseInt(todayHours.open.replace(':', ''));
  const closeTime = parseInt(todayHours.close.replace(':', ''));
  
  // Handle overnight hours (e.g., 22:00 to 02:00)
  if (openTime > closeTime) {
    return currentTime >= openTime || currentTime <= closeTime;
  }
  
  return currentTime >= openTime && currentTime <= closeTime;
}

function getEstimatedDeliveryTime(businessType: string, distance: number): number {
  const preparationTimes = {
    restaurant: 25, // minutes
    pharmacy: 10,
    grocery: 15,
  };
  
  const prepTime = preparationTimes[businessType as keyof typeof preparationTimes] || 20;
  const deliveryTime = Math.ceil(distance * 3); // 3 minutes per km
  
  return prepTime + deliveryTime;
}
