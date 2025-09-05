import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient, trpc } from "@/trpc/server";
import { ItemView } from "@/modules/library/ui/views/item-view";
import { Suspense } from "react";
import { ItemViewSkeleton } from "@/modules/items/ui/views/item-view";

interface Props {
  params: Promise<{
    itemId: string;
  }>;
}

export const dynamic = "force-dynamic";

const Page = async ({ params }: Props) => {
  const { itemId } = await params;
  const queryClient = getQueryClient();

  void queryClient.prefetchQuery(
    trpc.library.getOne.queryOptions({
      itemId,
    })
  );

  void queryClient.prefetchQuery(
    trpc.reviews.getOne.queryOptions({
      itemId,
    })
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<ItemViewSkeleton />}>
        <ItemView itemId={itemId} />
      </Suspense>
    </HydrationBoundary>
  );
};

export default Page;
