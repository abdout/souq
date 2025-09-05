"use client";

import { Button } from "@/components/ui/button";
import { DEFAULT_LIMIT } from "@/constants";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";
import { useSuspenseInfiniteQuery } from "@tanstack/react-query";
import { InboxIcon } from "lucide-react";
import { useItemFilters } from "../../hooks/use-item-filters";
import { ItemCard, ItemCardSkeleton } from "./item-card";

interface Props {
  category?: string;
  tenantSlug?: string;
  narrowView?: boolean;
}

export const ItemList = ({ category, tenantSlug, narrowView }: Props) => {
  const [filters] = useItemFilters();
  const trpc = useTRPC();
  const { data, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useSuspenseInfiniteQuery(
      trpc.items.getMany.infiniteQueryOptions(
        {
          ...filters,
          category,
          tenantSlug,
          limit: DEFAULT_LIMIT,
        },
        {
          getNextPageParam: (lastPage) => {
            return lastPage.docs.length > 0 ? lastPage.nextPage : undefined;
          },
        }
      )
    );

  if (data.pages?.[0]?.docs.length === 0) {
    return (
      <div className="border border-black border-dashed flex items-center justify-center p-8 flex-col gap-y-4 bg-white w-full rounded-lg">
        <InboxIcon />
        <p className="text-base font-medium">No items found</p>
      </div>
    );
  }

  return (
    <>
      <div
        className={cn(
          "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4",
          narrowView && "lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-3"
        )}
      >
        {data?.pages
          .flatMap((page) => page.docs)
          .map((item) => (
            <ItemCard
              key={item.id}
              id={item.id}
              name={item.name}
              imageUrl={item.image?.url}
              tenantSlug={item.tenant?.slug}
              tenantImageUrl={item.tenant?.image?.url}
              reviewRating={item.reviewRating}
              reviewCount={item.reviewCount}
              price={item.price}
            />
          ))}
      </div>
      <div className="flex justify-center pt-8">
        {hasNextPage && (
          <Button
            disabled={isFetchingNextPage}
            onClick={() => fetchNextPage()}
            className="font-medium disabled:opacity-50 text-base bg-white"
            variant="elevated"
          >
            Load more
          </Button>
        )}
      </div>
    </>
  );
};

export const ItemListSkeleton = ({ narrowView }: Props) => {
  return (
    <div
      className={cn(
        "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4",
        narrowView && "lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-3"
      )}
    >
      {Array.from({ length: DEFAULT_LIMIT }).map((_, index) => (
        <ItemCardSkeleton key={index} />
      ))}
    </div>
  );
};
