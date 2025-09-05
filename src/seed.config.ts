// Simplified payload config for seeding without Vercel Blob
import { mongooseAdapter } from "@payloadcms/db-mongodb";
import { payloadCloudPlugin } from "@payloadcms/payload-cloud";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import path from "path";
import { buildConfig } from "payload";
import sharp from "sharp";
import { fileURLToPath } from "url";

// Simplified Media collection without Vercel Blob
const SimpleMedia = {
  slug: "media",
  admin: {
    useAsTitle: "filename",
  },
  upload: {
    staticDir: "media",
  },
  fields: [
    {
      name: "filename",
      type: "text" as const,
      required: true,
    },
  ],
};
import { Users } from "./collections/Users";

import { multiTenantPlugin } from "@payloadcms/plugin-multi-tenant";
import { Items } from "./collections/Books";
import { Categories } from "./collections/Categories";
import { Orders } from "./collections/Orders";
import { Reviews } from "./collections/Reviews";
import { Tags } from "./collections/Tabs";
import { Tenants } from "./collections/Tenants";
import { isSuperAdmin } from "./lib/access";
import { Config } from "./payload-types";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [
    Users,
    SimpleMedia,
    Categories,
    Items,
    Tags,
    Tenants,
    Orders,
    Reviews,
  ],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || "",
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
  db: mongooseAdapter({
    url: process.env.DATABASE_URI || "",
  }),
  sharp,
  plugins: [
    payloadCloudPlugin(),
    multiTenantPlugin<Config>({
      collections: {
        items: {},
        media: {},
      },
      tenantsArrayField: {
        includeDefaultField: false,
      },
      userHasAccessToAllTenants: (user) => isSuperAdmin(user),
    }),
    // Skip Vercel Blob for seeding
  ],
});