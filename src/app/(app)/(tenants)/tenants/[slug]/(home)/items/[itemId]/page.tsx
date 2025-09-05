import { ItemView, ItemViewSkeleton } from "@/modules/items/ui/views/item-view";
import { getQueryClient, trpc } from "@/trpc/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { Suspense } from "react";

interface Props {
  params: Promise<{ itemId: string; slug: string }>;
}

export const dynamic = "force-dynamic";

const Page = async ({ params }: Props) => {
  const { itemId, slug } = await params;

  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(
    trpc.tenants.getOne.queryOptions({
      slug,
    })
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<ItemViewSkeleton />}>
        <ItemView itemId={itemId} tenantSlug={slug} />
      </Suspense>
    </HydrationBoundary>
  );
};

export default Page;
