import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateTenantURL(tenantSlug: string) {
  const isDevelopment = process.env.NODE_ENV === "development";
  const isSubdomainRoutingEnabled =
    process.env.NEXT_PUBLIC_ENABLE_SUBDOMAIN_ROUTING === "true";

  // In development, use path-based routing for easier testing
  if (isDevelopment && !isSubdomainRoutingEnabled) {
    return `/tenants/${tenantSlug}`;
  }

  // For production or when subdomain routing is explicitly enabled
  const protocol = typeof window !== 'undefined' 
    ? window.location.protocol.replace(':', '') 
    : 'https';
  
  const domain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'abdoutgroup.com';
  
  // Use subdomain routing for production
  return `${protocol}://${tenantSlug}.${domain}`;
}

// export function generateTenantURL(tenantSlug: string) {

//   let protocol = "https";
//   const domain = process.env.NEXT_PUBLIC_ROOT_DOMAIN!;

//   if (process.env.NODE_ENV === "development") {
//     protocol = "http";
//   }

//   return `${protocol}://${tenantSlug}.${domain}`;
// }

export function formatCurrency(value: number | string) {
  return new Intl.NumberFormat("ar-SA", {
    style: "currency",
    currency: "SAR",
    maximumFractionDigits: 2,
  }).format(Number(value));
}
