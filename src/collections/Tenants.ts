import { isSuperAdmin } from "@/lib/access";
import { CollectionConfig } from "payload";

export const Tenants: CollectionConfig = {
  slug: "tenants",
  access: {
    create: ({ req }) => isSuperAdmin(req.user),
    delete: ({ req }) => isSuperAdmin(req.user),
  },
  admin: {
    useAsTitle: "slug",
  },
  fields: [
    {
      name: "businessType",
      type: "select",
      required: true,
      options: [
        { label: "Restaurant", value: "restaurant" },
        { label: "Pharmacy", value: "pharmacy" },
        { label: "Grocery Store", value: "grocery" },
      ],
      defaultValue: "restaurant",
      admin: {
        description: "Select the type of business for this merchant",
      },
    },
    {
      name: "name",
      required: true,
      type: "text",
      label: "Store Name",
      admin: {
        description: "Business name (e.g. Mario's Pizza, City Pharmacy)",
      },
    },
    {
      name: "slug",
      type: "text",
      index: true,
      required: true,
      unique: true,
      access: {
        update: ({ req }) => isSuperAdmin(req.user),
      },
      admin: {
        description:
          "URL slug for the business (e.g. [slug].yourdeliveryapp.com)",
      },
    },
    {
      name: "address",
      type: "text",
      required: true,
      admin: {
        description: "Full business address for delivery purposes",
      },
    },
    {
      name: "coordinates",
      type: "group",
      fields: [
        {
          name: "lat",
          type: "number",
          required: true,
          admin: {
            description: "Latitude coordinate",
          },
        },
        {
          name: "lng",
          type: "number",
          required: true,
          admin: {
            description: "Longitude coordinate",
          },
        },
      ],
      admin: {
        description: "GPS coordinates for precise location",
      },
    },
    {
      name: "deliveryRadius",
      type: "number",
      required: true,
      defaultValue: 5,
      admin: {
        description: "Delivery radius in kilometers",
      },
    },
    {
      name: "minimumOrder",
      type: "number",
      required: true,
      defaultValue: 20,
      admin: {
        description: "Minimum order value in USD for delivery",
      },
    },
    {
      name: "deliveryFee",
      type: "number",
      required: true,
      defaultValue: 3,
      admin: {
        description: "Base delivery fee in USD",
      },
    },
    {
      name: "operatingHours",
      type: "group",
      fields: [
        {
          name: "monday",
          type: "group",
          fields: [
            { name: "open", type: "text", defaultValue: "09:00" },
            { name: "close", type: "text", defaultValue: "22:00" },
            { name: "closed", type: "checkbox", defaultValue: false },
          ],
        },
        {
          name: "tuesday",
          type: "group",
          fields: [
            { name: "open", type: "text", defaultValue: "09:00" },
            { name: "close", type: "text", defaultValue: "22:00" },
            { name: "closed", type: "checkbox", defaultValue: false },
          ],
        },
        {
          name: "wednesday",
          type: "group",
          fields: [
            { name: "open", type: "text", defaultValue: "09:00" },
            { name: "close", type: "text", defaultValue: "22:00" },
            { name: "closed", type: "checkbox", defaultValue: false },
          ],
        },
        {
          name: "thursday",
          type: "group",
          fields: [
            { name: "open", type: "text", defaultValue: "09:00" },
            { name: "close", type: "text", defaultValue: "22:00" },
            { name: "closed", type: "checkbox", defaultValue: false },
          ],
        },
        {
          name: "friday",
          type: "group",
          fields: [
            { name: "open", type: "text", defaultValue: "09:00" },
            { name: "close", type: "text", defaultValue: "22:00" },
            { name: "closed", type: "checkbox", defaultValue: false },
          ],
        },
        {
          name: "saturday",
          type: "group",
          fields: [
            { name: "open", type: "text", defaultValue: "09:00" },
            { name: "close", type: "text", defaultValue: "22:00" },
            { name: "closed", type: "checkbox", defaultValue: false },
          ],
        },
        {
          name: "sunday",
          type: "group",
          fields: [
            { name: "open", type: "text", defaultValue: "09:00" },
            { name: "close", type: "text", defaultValue: "22:00" },
            { name: "closed", type: "checkbox", defaultValue: false },
          ],
        },
      ],
      admin: {
        description: "Set business operating hours for each day",
      },
    },
    {
      name: "image",
      type: "upload",
      relationTo: "media",
    },
    {
      name: "stripeAccountId",
      type: "text",
      required: true,
      access: {
        update: ({ req }) => isSuperAdmin(req.user),
      },
      admin: {
        description: "Stripe Account ID associated with your business",
      },
    },
    {
      name: "isActive",
      type: "checkbox",
      defaultValue: true,
      admin: {
        description: "Whether the business is currently accepting orders",
      },
    },
    {
      name: "businessLicense",
      type: "text",
      admin: {
        description: "Business license number for compliance",
      },
    },
    {
      name: "stripeDetailsSubmitted",
      type: "checkbox",
      access: {
        update: ({ req }) => isSuperAdmin(req.user),
      },
      admin: {
        readOnly: true,
        description:
          "You cannot create items until you submit your Stripe details",
      },
    },
  ],
};
