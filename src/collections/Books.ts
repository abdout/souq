import { isSuperAdmin } from "@/lib/access";
import { Tenant } from "@/payload-types";
import type { CollectionConfig } from "payload";

export const Items: CollectionConfig = {
  slug: "books",
  access: {
    create: ({ req }) => {
      if (isSuperAdmin(req.user)) return true;

      const tenant = req.user?.tenants?.[0]?.tenant as Tenant;
      return Boolean(tenant?.stripeDetailsSubmitted);
    },
    delete: ({ req }) => isSuperAdmin(req.user),
  },
  admin: {
    useAsTitle: "name",
    description: "You must verify your account before creating items",
  },
  fields: [
    {
      name: "businessType",
      type: "select",
      required: true,
      options: [
        { label: "Food", value: "food" },
        { label: "Medicine", value: "medicine" },
        { label: "Grocery", value: "grocery" },
      ],
      defaultValue: "food",
      admin: {
        description: "Category of item for the delivery business",
      },
    },
    {
      name: "name",
      type: "text",
      required: true,
    },
    {
      name: "inventory",
      type: "number",
      required: true,
      defaultValue: 100,
      admin: {
        description: "Current stock quantity available",
      },
    },
    {
      name: "lowStockThreshold",
      type: "number",
      defaultValue: 10,
      admin: {
        description: "Alert when stock falls below this number",
      },
    },
    {
      name: "trackInventory",
      type: "checkbox",
      defaultValue: true,
      admin: {
        description: "Enable inventory tracking for this item",
      },
    },
    {
      name: "unit",
      type: "select",
      required: true,
      options: [
        { label: "Piece", value: "piece" },
        { label: "Kilogram", value: "kg" },
        { label: "Liter", value: "liter" },
        { label: "Pack", value: "pack" },
        { label: "Box", value: "box" },
      ],
      defaultValue: "piece",
      admin: {
        description: "Unit of measurement for this item",
      },
    },
    {
      name: "isPerishable",
      type: "checkbox",
      defaultValue: false,
      admin: {
        description: "Whether this item has a short shelf life",
      },
    },
    {
      name: "prescriptionRequired",
      type: "checkbox",
      defaultValue: false,
      admin: {
        description: "Whether this medicine requires a prescription",
      },
    },
    {
      name: "description",
      type: "richText",
    },
    {
      name: "price",
      type: "number",
      required: true,
      admin: {
        description: "Price in USD",
      },
    },
    {
      name: "category",
      type: "relationship",
      relationTo: "categories",
      hasMany: false,
    },
    {
      name: "tags",
      type: "relationship",
      relationTo: "tags",
      hasMany: true,
    },
    {
      name: "image",
      type: "upload",
      relationTo: "media",
    },
    {
      name: "deliveryTime",
      type: "number",
      required: true,
      defaultValue: 30,
      admin: {
        description: "Estimated preparation time in minutes",
      },
    },
    {
      name: "isPrivate",
      label: "Private",
      defaultValue: false,
      type: "checkbox",
      admin: {
        description:
          "If checked, this book will not be shown on the public storefront",
      },
    },
    {
      name: "isArchived",
      label: "Archive",
      defaultValue: false,
      type: "checkbox",
      admin: {
        description: "If checked, this book will be archived",
      },
    },
  ],
};
