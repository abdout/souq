import { isSuperAdmin } from "@/lib/access";
import type { CollectionConfig } from "payload";

export const Orders: CollectionConfig = {
  slug: "orders",
  access: {
    read: ({ req }) => isSuperAdmin(req.user),
    create: ({ req }) => isSuperAdmin(req.user),
    update: ({ req }) => isSuperAdmin(req.user),
    delete: ({ req }) => isSuperAdmin(req.user),
  },
  admin: {
    useAsTitle: "name",
  },
  fields: [
    {
      name: "name",
      type: "text",
      required: true,
    },
    {
      name: "user",
      type: "relationship",
      relationTo: "users",
      required: true,
      hasMany: false,
    },
    {
      name: "item",
      type: "relationship",
      relationTo: "books",
      required: true,
      hasMany: false,
    },
    {
      name: "deliveryAddress",
      type: "group",
      fields: [
        {
          name: "street",
          type: "text",
          required: true,
        },
        {
          name: "city",
          type: "text",
          required: true,
        },
        {
          name: "postalCode",
          type: "text",
        },
        {
          name: "country",
          type: "text",
          required: true,
          defaultValue: "Saudi Arabia",
        },
        {
          name: "coordinates",
          type: "group",
          fields: [
            { name: "lat", type: "number" },
            { name: "lng", type: "number" },
          ],
        },
      ],
      admin: {
        description: "Customer delivery address",
      },
    },
    {
      name: "orderStatus",
      type: "select",
      required: true,
      options: [
        { label: "Pending", value: "pending" },
        { label: "Confirmed", value: "confirmed" },
        { label: "Preparing", value: "preparing" },
        { label: "Ready", value: "ready" },
        { label: "Out for Delivery", value: "out_for_delivery" },
        { label: "Delivered", value: "delivered" },
        { label: "Cancelled", value: "cancelled" },
      ],
      defaultValue: "pending",
      admin: {
        description: "Current status of the order",
      },
    },
    {
      name: "deliveryFee",
      type: "number",
      required: true,
      defaultValue: 0,
      admin: {
        description: "Delivery fee charged in USD",
      },
    },
    {
      name: "estimatedDelivery",
      type: "date",
      admin: {
        description: "Estimated delivery time",
        date: {
          pickerAppearance: "dayAndTime",
        },
      },
    },
    {
      name: "specialInstructions",
      type: "textarea",
      admin: {
        description: "Special delivery instructions from customer",
      },
    },
    {
      name: "orderType",
      type: "select",
      required: true,
      options: [
        { label: "Delivery", value: "delivery" },
        { label: "Pickup", value: "pickup" },
      ],
      defaultValue: "delivery",
      admin: {
        description: "Type of order fulfillment",
      },
    },
    {
      name: "stripeCheckoutSessionId",
      type: "text",
      required: true,
      admin: {
        description: "Stripe checkout session associated with the order",
      },
    },
    {
      name: "stripeAccountId",
      type: "text",
      admin: {
        description: "Stripe account associated with the merchant",
      },
    },
  ],
};
