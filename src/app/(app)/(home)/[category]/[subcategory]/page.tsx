export const dynamic = 'force-dynamic';

import { DEFAULT_LIMIT } from "@/constants";
import { loadItemFilters } from "@/modules/items/search-params";
import { ItemListView } from "@/modules/items/ui/views/item-list-view";
import { getQueryClient, trpc } from "@/trpc/server";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { SearchParams } from "nuqs/server";

interface Props {
  params: Promise<{
    subcategory: string;
  }>;
  searchParams: Promise<SearchParams>;
}

const Page = async ({ params, searchParams }: Props) => {
  const { subcategory } = await params;
  const filters = await loadItemFilters(searchParams);

  const queryClient = getQueryClient();
  void queryClient.prefetchInfiniteQuery(
    trpc.items.getMany.infiniteQueryOptions({
      ...filters,
      category: subcategory,
      limit: DEFAULT_LIMIT,
    })
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ItemListView category={subcategory} />
    </HydrationBoundary>
  );
};

// http://localhost:3000/education

export default Page;
