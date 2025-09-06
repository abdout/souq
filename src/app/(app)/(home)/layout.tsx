import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { Suspense } from "react";
import {
  SearchFilters,
  SearchFiltersSkeleton,
} from "@/modules/home/ui/components/search-filters";
import { getQueryClient, trpc } from "@/trpc/server";
import { SiteHeader } from "@/components/template/site-header/content";
import { SiteFooter } from "@/components/template/site-footer/content";

interface Props {
  children: React.ReactNode;
}

const Layout = async ({ children }: Props) => {
  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(trpc.categories.getMany.queryOptions());

  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Suspense fallback={<SearchFiltersSkeleton />}>
          <SearchFilters />
        </Suspense>
      </HydrationBoundary>
      <div className="flex-1 bg-[#F4F4F0]">{children}</div>
      <SiteFooter />
    </div>
  );
};

export default Layout;
