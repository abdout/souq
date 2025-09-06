import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { createTRPCContext } from "@/trpc/init";
import { appRouter } from "@/trpc/routers/_app";

const handler = async (req: Request) => {
  const url = new URL(req.url);
  console.log(`[TRPC Route] Handling request:`, {
    method: req.method,
    url: url.pathname,
    host: req.headers.get('host'),
    origin: req.headers.get('origin'),
  });

  try {
    const response = await fetchRequestHandler({
      endpoint: "/api/trpc",
      req,
      router: appRouter,
      createContext: createTRPCContext,
      onError: ({ error, path }) => {
        console.error(`[TRPC Route] Error in ${path}:`, error);
      },
    });
    
    console.log(`[TRPC Route] Response status:`, response.status);
    return response;
  } catch (error) {
    console.error(`[TRPC Route] Fatal error:`, error);
    throw error;
  }
};

export { handler as GET, handler as POST };
