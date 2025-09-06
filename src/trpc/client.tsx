"use client";
// ^-- to make sure we can mount the Provider from a server component
import superjson from "superjson";
import type { QueryClient } from "@tanstack/react-query";
import { QueryClientProvider } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { createTRPCContext } from "@trpc/tanstack-react-query";
import { useState } from "react";
import { makeQueryClient } from "./query-client";
import type { AppRouter } from "./routers/_app";

export const { TRPCProvider, useTRPC } = createTRPCContext<AppRouter>();
let browserQueryClient: QueryClient;
function getQueryClient() {
  if (typeof window === "undefined") {
    // Server: always make a new query client
    return makeQueryClient();
  }
  // Browser: make a new query client if we don't already have one
  // This is very important, so we don't re-make a new client if React
  // suspends during the initial render. This may not be needed if we
  // have a suspense boundary BELOW the creation of the query client
  if (!browserQueryClient) browserQueryClient = makeQueryClient();
  return browserQueryClient;
}
function getUrl(host?: string) {
  const base = (() => {
    if (typeof window !== "undefined") {
      // In the browser, use the current origin to ensure proper protocol and domain
      const origin = window.location.origin;
      console.log(`[TRPC Client] Browser detected, using origin: ${origin}`);
      return origin;
    }
    
    // On the server, use the provided host or fall back to environment variable
    if (host) {
      // Ensure the host has a protocol - check if it already has http/https
      if (host.startsWith('http://') || host.startsWith('https://')) {
        console.log(`[TRPC Client] Server-side with full URL: ${host}`);
        return host;
      }
      // Add protocol based on environment
      const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
      const url = `${protocol}://${host}`;
      console.log(`[TRPC Client] Server-side with constructed URL: ${url}`);
      return url;
    }
    
    // Fallback to environment variable
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (appUrl) {
      console.log(`[TRPC Client] Using app URL from env: ${appUrl}`);
      return appUrl;
    }
    
    // Final fallback - construct from root domain
    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:3000';
    const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
    const fallbackUrl = `${protocol}://${rootDomain}`;
    console.log(`[TRPC Client] Using fallback URL: ${fallbackUrl}`);
    return fallbackUrl;
  })();
  
  const trpcUrl = `${base}/api/trpc`;
  console.log(`[TRPC Client] Final TRPC URL: ${trpcUrl}`);
  return trpcUrl;
}
export function TRPCReactProvider(
  props: Readonly<{
    children: React.ReactNode;
    host?: string; // Optional host for SSR
  }>
) {
  // NOTE: Avoid useState when initializing the query client if you don't
  //       have a suspense boundary between this and the code that may
  //       suspend because React will throw away the client on the initial
  //       render if it suspends and there is no boundary
  const queryClient = getQueryClient();
  const [trpcClient] = useState(() =>
    createTRPCClient<AppRouter>({
      links: [
        httpBatchLink({
          transformer: superjson, 
          url: getUrl(props.host),
        }),
      ],
    })
  );
  return (
    <QueryClientProvider client={queryClient}>
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        {props.children}
      </TRPCProvider>
    </QueryClientProvider>
  );
}
