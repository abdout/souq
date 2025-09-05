import { getQueryClient, trpc } from "@/trpc/server";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import type { SearchParams } from "nuqs/server";
import { loadItemFilters } from "@/modules/items/search-params";
import { ItemListView } from "@/modules/items/ui/views/item-list-view";
import { DEFAULT_LIMIT } from "@/constants";

interface Props {
  params: Promise<{
    category: string;
  }>;
  searchParams: Promise<SearchParams>;
}

export const dynamic = "force-dynamic";

const Page = async ({ params, searchParams }: Props) => {
  const { category } = await params;
  const filters = await loadItemFilters(searchParams);

  const queryClient = getQueryClient();
  void queryClient.prefetchInfiniteQuery(
    trpc.items.getMany.infiniteQueryOptions({
      ...filters,
      category,
      limit: DEFAULT_LIMIT,
    })
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ItemListView category={category} />
    </HydrationBoundary>
  );
};

// http://localhost:3000/education

export default Page;
