import { SimpleItemView, ItemViewSkeleton } from "@/modules/items/ui/views/item-view-simple";
import { getQueryClient, trpc } from "@/trpc/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

interface Props {
  params: Promise<{ itemId: string; slug: string }>;
}

export const dynamic = "force-dynamic";

const Page = async ({ params }: Props) => {
  const { itemId, slug } = await params;

  const queryClient = getQueryClient();
  
  // Prefetch both tenant and item data
  await Promise.all([
    queryClient.prefetchQuery(
      trpc.tenants.getOne.queryOptions({
        slug,
      })
    ),
    queryClient.prefetchQuery(
      trpc.items.getOne.queryOptions({
        id: itemId,
      })
    ),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <SimpleItemView itemId={itemId} tenantSlug={slug} />
    </HydrationBoundary>
  );
};

export default Page;
