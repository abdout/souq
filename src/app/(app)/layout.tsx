import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { TRPCReactProvider } from "@/trpc/client";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Analytics } from "@vercel/analytics/next";
import { headers } from "next/headers";


export const metadata: Metadata = {
  title: "Souq",
  description: "Marketplace for restaurants, pharmacies, and grocery stores.",
 
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const host = headersList.get("host") || undefined;
  return (
    <html lang="en">
      <body
        className={cn(
          "font-sans antialiased",
          GeistSans.className,
          GeistMono.variable
        )}
      >
        <NuqsAdapter>
          <Analytics />
          <TRPCReactProvider host={host}>
            {children}
            <Toaster />
          </TRPCReactProvider>
        </NuqsAdapter>
      </body>
    </html>
  );
}
