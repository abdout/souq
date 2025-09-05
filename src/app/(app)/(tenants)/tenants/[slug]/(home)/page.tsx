import type { SearchParams } from "nuqs/server";

import { DEFAULT_LIMIT } from "@/constants";
import { getQueryClient, trpc } from "@/trpc/server";

import { ItemListView } from "@/modules/items/ui/views/item-list-view";
import { loadItemFilters } from "@/modules/items/search-params";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

interface Props {
  searchParams: Promise<SearchParams>;
  params: Promise<{ slug: string }>;
}

export const dynamic = "force-dynamic";

const Page = async ({ params, searchParams }: Props) => {
  const { slug } = await params;
  const filters = await loadItemFilters(searchParams);

  const queryClient = getQueryClient();
  void queryClient.prefetchInfiniteQuery(
    trpc.items.getMany.infiniteQueryOptions({
      ...filters,
      tenantSlug: slug,
      limit: DEFAULT_LIMIT,
    })
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ItemListView tenantSlug={slug} narrowView />
    </HydrationBoundary>
  );
};

export default Page;
